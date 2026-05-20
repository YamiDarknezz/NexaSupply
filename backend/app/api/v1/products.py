"""API v1 products router — production, requires valid JWT."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ...core.database import get_db
from ...models.product import Product
from ...models.store import Store
from ...schemas import ProductResponse
from .auth import get_current_user

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
def api_list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
    q = db.query(Product).filter(Product.is_active == True)
    if category:
        q = q.filter(Product.category == category)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    return q.order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def api_get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
def api_create_product(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Store = Depends(get_current_user),
):
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
