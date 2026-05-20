"""Dev products router — no auth required, mirrors /api/v1/products."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..models.product import Product
from ..schemas import ProductResponse

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
def dev_list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.is_active == True)
    if category:
        q = q.filter(Product.category == category)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    return q.order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def dev_get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
def dev_create_product(payload: dict, db: Session = Depends(get_db)):
    product = Product(
        name=payload["name"],
        description=payload.get("description", ""),
        price=payload["price"],
        category=payload.get("category", ""),
        image_url=payload.get("image_url", ""),
        stock=payload.get("stock", 0),
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
