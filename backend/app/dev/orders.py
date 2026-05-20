"""Dev orders router — no auth required, uses X-Store-ID header."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..schemas import OrderResponse, OrderItemResponse

router = APIRouter()


def _get_dev_store_id(x_store_id: str = Header(None)) -> str:
    """Dev mode: extract store_id from X-Store-ID header."""
    if not x_store_id:
        raise HTTPException(401, "X-Store-ID header requerido para modo dev")
    return x_store_id


@router.post("", status_code=201)
def dev_create_order(
    payload: dict,
    store_id: str = Depends(_get_dev_store_id),
    db: Session = Depends(get_db),
):
    items_data = payload.get("items", [])
    if not items_data:
        raise HTTPException(400, "Se requiere al menos un item")

    # Validate stock with lock
    total = 0.0
    order_items = []
    for item in items_data:
        product = db.query(Product).with_for_update().get(item["product_id"])
        if not product:
            raise HTTPException(404, f"Producto {item['product_id']} no encontrado")
        qty = item["quantity"]
        if product.stock < qty:
            raise HTTPException(400, f"Stock insuficiente para {product.name}: {product.stock} disponibles, {qty} solicitados")
        product.stock -= qty
        total += product.price * qty
        order_items.append({
            "product": product,
            "quantity": qty,
        })

    # Create order
    order_count = db.query(Order).count()
    order = Order(
        store_id=store_id,
        order_number=f"NXA-DEV-{order_count + 1:04d}",
        total=round(total, 2),
        tracking_status="confirmed",
        status_history=[{"status": "confirmed", "timestamp": datetime.now(timezone.utc).isoformat()}],
        payment_method="dev_test",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(order)
    db.flush()

    for oi in order_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=oi["product"].id,
            quantity=oi["quantity"],
            unit_price=oi["product"].price,
        ))

    db.commit()
    return {
        "order_id": str(order.id),
        "order_number": order.order_number,
        "status": order.tracking_status,
        "total": order.total,
    }


@router.get("")
def dev_list_orders(
    store_id: str = Depends(_get_dev_store_id),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.store_id == store_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    result = []
    for o in orders:
        items = [
            OrderItemResponse(
                product_id=str(i.product_id),
                product_name=db.query(Product).get(i.product_id).name,
                quantity=i.quantity,
                unit_price=i.unit_price,
            )
            for i in o.items
        ]
        result.append(OrderResponse(
            id=str(o.id),
            order_number=o.order_number,
            total=o.total,
            tracking_status=o.tracking_status,
            status_history=o.status_history or [],
            payment_method=o.payment_method,
            paid_at=o.paid_at,
            delivered_at=o.delivered_at,
            created_at=o.created_at,
            items=items,
        ))
    return result


@router.get("/{order_id}")
def dev_get_order(
    order_id: str,
    store_id: str = Depends(_get_dev_store_id),
    db: Session = Depends(get_db),
):
    o = db.query(Order).filter(Order.id == order_id, Order.store_id == store_id).first()
    if not o:
        raise HTTPException(404, "Orden no encontrada")
    items = [
        OrderItemResponse(
            product_id=str(i.product_id),
            product_name=db.query(Product).get(i.product_id).name,
            quantity=i.quantity,
            unit_price=i.unit_price,
        )
        for i in o.items
    ]
    return OrderResponse(
        id=str(o.id),
        order_number=o.order_number,
        total=o.total,
        tracking_status=o.tracking_status,
        status_history=o.status_history or [],
        payment_method=o.payment_method,
        paid_at=o.paid_at,
        delivered_at=o.delivered_at,
        created_at=o.created_at,
        items=items,
    )


@router.patch("/{order_id}/status")
def dev_update_order_status(
    order_id: str,
    payload: dict,
    store_id: str = Depends(_get_dev_store_id),
    db: Session = Depends(get_db),
):
    o = db.query(Order).filter(Order.id == order_id, Order.store_id == store_id).first()
    if not o:
        raise HTTPException(404, "Orden no encontrada")

    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(400, "status es requerido")

    valid_transitions = {"pending", "confirmed", "preparing", "shipped", "in_transit", "delivered"}
    if new_status not in valid_transitions:
        raise HTTPException(400, f"Status inválido: {new_status}")

    now = datetime.now(timezone.utc)
    o.tracking_status = new_status
    history = o.status_history or []
    history.append({"status": new_status, "timestamp": now.isoformat()})
    o.status_history = history

    if new_status == "delivered":
        o.delivered_at = now

    db.commit()
    return {
        "order_id": str(o.id),
        "tracking_status": o.tracking_status,
        "status_history": o.status_history,
    }
