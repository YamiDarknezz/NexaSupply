from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import get_settings
from ..core.security import create_access_token
from ..models.order import Order
from ..models.store import Store

router = APIRouter()
settings = get_settings()


@router.post("/login")
def admin_login(email: str, password: str):
    if email == settings.ADMIN_EMAIL and password == settings.ADMIN_PASSWORD:
        token = create_access_token(data={"sub": "admin", "type": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(401, "Credenciales inválidas")


@router.get("/orders")
def list_all_orders(db: Session = Depends(get_db)):
    """Lista todas las órdenes para el panel admin."""
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(50).all()
    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "store_name": db.query(Store).get(o.store_id).name,
            "total": o.total,
            "tracking_status": o.tracking_status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@router.post("/orders/{order_id}/advance")
def advance_tracking(order_id: str, db: Session = Depends(get_db)):
    """Avanza manualmente el estado de tracking."""
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(404, "Orden no encontrada")

    transitions = {
        "confirmed": "preparing",
        "preparing": "in_transit",
        "in_transit": "delivered",
    }
    next_status = transitions.get(order.tracking_status)
    if not next_status:
        raise HTTPException(400, f"No se puede avanzar desde {order.tracking_status}")

    now = datetime.now(timezone.utc)
    order.tracking_status = next_status
    history = order.status_history or []
    history.append({"status": next_status, "timestamp": now.isoformat()})
    order.status_history = history

    if next_status == "delivered":
        order.delivered_at = now

    db.commit()
    return {
        "order_id": str(order.id),
        "tracking_status": order.tracking_status,
        "status_history": order.status_history,
    }


@router.get("/stores")
def list_stores(db: Session = Depends(get_db)):
    stores = db.query(Store).order_by(Store.created_at.desc()).all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "owner_name": s.owner_name,
            "email": s.email,
            "plan": s.plan,
            "subscription_status": s.subscription_status,
        }
        for s in stores
    ]
