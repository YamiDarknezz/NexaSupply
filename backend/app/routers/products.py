from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..models.product import Product
from ..schemas import ProductResponse

router = APIRouter()


@router.get("/", response_model=list[ProductResponse])
def list_products(
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


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = (
        db.query(Product.category)
        .filter(Product.is_active == True, Product.category.isnot(None))
        .distinct()
        .order_by(Product.category)
        .all()
    )
    return [c[0] for c in cats]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(404, "Producto no encontrado")
    return product
