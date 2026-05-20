"""API v1 inventory router — production, requires valid JWT."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.product import Product
from ...models.store import Store
from .auth import get_current_user

router = APIRouter()


@router.get("")
def api_list_inventory(
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
    products = db.query(Product).filter(Product.is_active == True).order_by(Product.name).all()
    return [
        {
            "product_id": str(p.id),
            "product_name": p.name,
            "product_category": p.category,
            "quantity": p.stock,
            "price": p.price,
        }
        for p in products
    ]


@router.patch("/{product_id}")
def api_adjust_stock(
    product_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    new_quantity = payload.get("quantity")
    if new_quantity is None or new_quantity < 0:
        raise HTTPException(400, "quantity debe ser un número >= 0")
    product.stock = new_quantity
    db.commit()
    return {
        "product_id": str(product.id),
        "product_name": product.name,
        "quantity": product.stock,
    }
