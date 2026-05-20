from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.cart import CartItem
from ..models.product import Product
from ..schemas import CartItemAdd, CartItemResponse
from fastapi import Header

router = APIRouter()


def _get_store_id(authorization: str = Header(None)) -> str:
    """Extrae store_id del JWT. En modo dev, permite header X-Store-ID."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        payload = decode_access_token(token)
        if payload and payload.get("type") == "store":
            return payload["sub"]
    raise HTTPException(401, "Autenticación requerida")


@router.get("", response_model=list[CartItemResponse])
def list_cart(
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    items = (
        db.query(CartItem, Product)
        .join(Product, CartItem.product_id == Product.id)
        .filter(CartItem.store_id == store_id)
        .all()
    )
    return [
        CartItemResponse(
            id=str(ci.id),
            product_id=str(ci.product_id),
            product_name=p.name,
            product_price=p.price,
            product_stock=p.stock,
            quantity=ci.quantity,
        )
        for ci, p in items
    ]


@router.post("/add", response_model=dict)
def add_to_cart(
    payload: CartItemAdd,
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    product = db.query(Product).get(payload.product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    if product.stock < payload.quantity:
        raise HTTPException(400, f"Stock insuficiente: {product.stock} disponibles")

    existing = (
        db.query(CartItem)
        .filter(CartItem.store_id == store_id, CartItem.product_id == payload.product_id)
        .first()
    )
    if existing:
        existing.quantity += payload.quantity
    else:
        db.add(CartItem(store_id=store_id, product_id=payload.product_id, quantity=payload.quantity))

    db.commit()
    return {"message": "Producto agregado al carrito", "quantity": existing.quantity if existing else payload.quantity}


@router.post("/update")
def update_cart_item(
    item_id: str, quantity: int,
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.store_id == store_id).first()
    if not item:
        raise HTTPException(404, "Item no encontrado")

    product = db.query(Product).get(item.product_id)
    if product.stock < quantity:
        raise HTTPException(400, f"Stock insuficiente: {product.stock} disponibles")

    item.quantity = quantity
    db.commit()
    return {"message": "Cantidad actualizada"}


@router.delete("/{item_id}")
def remove_from_cart(
    item_id: str,
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.store_id == store_id).first()
    if not item:
        raise HTTPException(404, "Item no encontrado")
    db.delete(item)
    db.commit()
    return {"message": "Item eliminado del carrito"}


@router.delete("")
def clear_cart(
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    db.query(CartItem).filter(CartItem.store_id == store_id).delete()
    db.commit()
    return {"message": "Carrito vaciado"}
