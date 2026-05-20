"""Dev inventory router — no auth, shows product stock globally."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.product import Product

router = APIRouter()


@router.get("")
def dev_list_inventory(db: Session = Depends(get_db)):
    """List all products with their current stock levels."""
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
def dev_adjust_stock(product_id: str, payload: dict, db: Session = Depends(get_db)):
    """Adjust stock for a product."""
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
