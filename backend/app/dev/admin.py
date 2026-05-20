"""Dev admin router — no auth, admin stats and all orders."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..core.database import get_db
from ..models.store import Store
from ..models.order import Order

router = APIRouter()


@router.get("/stats")
def dev_admin_stats(db: Session = Depends(get_db)):
    """Return admin dashboard stats."""
    total_stores = db.query(Store).count()
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total)).scalar() or 0.0
    return {
        "total_stores": total_stores,
        "total_orders": total_orders,
        "total_revenue": round(float(total_revenue), 2),
    }


@router.get("/orders")
def dev_admin_orders(db: Session = Depends(get_db)):
    """List all orders for admin view."""
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(50).all()
    return [
        {
            "id": str(o.id),
            "order_number": o.order_number,
            "store_id": str(o.store_id),
            "total": o.total,
            "tracking_status": o.tracking_status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]
