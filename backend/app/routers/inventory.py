from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.inventory import InventoryItem
from ..models.product import Product
from ..schemas import InventoryItemResponse
from fastapi import Header

router = APIRouter()


def _get_store_id(authorization: str = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization.split(" ", 1)[1])
        if payload and payload.get("type") == "store":
            return payload["sub"]
    raise HTTPException(401, "Autenticación requerida")


@router.get("", response_model=list[InventoryItemResponse])
def list_inventory(
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    items = (
        db.query(InventoryItem)
        .filter(InventoryItem.store_id == store_id)
        .order_by(InventoryItem.last_updated.desc())
        .all()
    )
    result = []
    for inv in items:
        product = db.query(Product).get(inv.product_id)
        result.append(InventoryItemResponse(
            id=str(inv.id),
            product_id=str(inv.product_id),
            product_name=product.name if product else "Desconocido",
            product_category=product.category if product else None,
            quantity=inv.quantity,
            last_updated=inv.last_updated,
        ))
    return result
