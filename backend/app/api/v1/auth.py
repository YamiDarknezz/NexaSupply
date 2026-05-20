"""API v1 auth router — production, requires valid JWT."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import hash_password, verify_password, create_access_token, decode_access_token
from ...models.store import Store
from ...schemas import StoreRegister, StoreLogin, TokenResponse, StoreResponse

router = APIRouter()


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Dependency: extract and validate JWT from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    payload = decode_access_token(authorization.split(" ", 1)[1])
    if not payload or payload.get("type") != "store":
        raise HTTPException(status_code=401, detail="Token inválido")
    store = db.query(Store).get(payload["sub"])
    if not store:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return store


@router.post("/register", response_model=TokenResponse, status_code=201)
def api_register(payload: StoreRegister, db: Session = Depends(get_db)):
    existing = db.query(Store).filter(Store.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    store = Store(
        name=payload.store_name,
        ruc=payload.store_ruc,
        address=payload.store_address,
        phone=payload.store_phone,
        owner_name=payload.owner_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        plan=payload.plan,
        subscription_status="active",
    )
    db.add(store)
    db.commit()
    db.refresh(store)

    token = create_access_token(data={"sub": str(store.id), "type": "store"})
    return TokenResponse(
        access_token=token,
        store_id=str(store.id),
        store_name=store.name,
    )


@router.post("/login", response_model=TokenResponse)
def api_login(payload: StoreLogin, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.email == payload.email).first()
    if not store or not verify_password(payload.password, store.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token(data={"sub": str(store.id), "type": "store"})
    return TokenResponse(
        access_token=token,
        store_id=str(store.id),
        store_name=store.name,
    )


@router.get("/me", response_model=StoreResponse)
def api_me(current_store: Store = Depends(get_current_user)):
    return current_store
