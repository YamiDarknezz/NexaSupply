import random, uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import decode_access_token
from ..models.cart import CartItem
from ..models.product import Product
from ..models.order import Order, OrderItem
from ..schemas import CheckoutResponse, PaymentRequest, PaymentResponse
from fastapi import Header

router = APIRouter()


def _get_store_id(authorization: str = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        payload = decode_access_token(authorization.split(" ", 1)[1])
        if payload and payload.get("type") == "store":
            return payload["sub"]
    raise HTTPException(401, "Autenticación requerida")


@router.post("/payment/simulate", response_model=PaymentResponse)
def simulate_payment(req: PaymentRequest):
    errors = []
    if len(req.card_number.replace(" ", "")) != 16:
        errors.append("Número de tarjeta inválido")
    if len(req.cvv) != 3 or not req.cvv.isdigit():
        errors.append("CVV inválido")
    if errors:
        return PaymentResponse(success=False, transaction_id="", message=" | ".join(errors))

    if random.random() < 0.95:
        return PaymentResponse(
            success=True,
            transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
            message="Pago aprobado",
        )
    return PaymentResponse(success=False, transaction_id="", message="Transacción rechazada. Fondos insuficientes.")


@router.post("/", response_model=CheckoutResponse)
def process_checkout(
    store_id: str = Depends(_get_store_id),
    db: Session = Depends(get_db),
):
    cart_items = db.query(CartItem).filter(CartItem.store_id == store_id).all()
    if not cart_items:
        raise HTTPException(400, "Carrito vacío")

    # Validar stock con lock
    for ci in cart_items:
        product = db.query(Product).with_for_update().get(ci.product_id)
        if product.stock < ci.quantity:
            raise HTTPException(
                400,
                f"Stock insuficiente para {product.name}: disponible {product.stock}, solicitado {ci.quantity}",
            )

    # Total
    total = 0.0
    for ci in cart_items:
        product = db.query(Product).get(ci.product_id)
        total += product.price * ci.quantity

    # Crear orden
    order_count = db.query(Order).count()
    order = Order(
        store_id=store_id,
        order_number=f"NXA-{order_count + 1:04d}",
        total=round(total, 2),
        tracking_status="confirmed",
        status_history=[{"status": "confirmed", "timestamp": datetime.now(timezone.utc).isoformat()}],
        payment_method="simulated_card",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(order)
    db.flush()

    # Order items + reducir stock
    for ci in cart_items:
        product = db.query(Product).get(ci.product_id)
        product.stock -= ci.quantity
        db.add(OrderItem(
            order_id=order.id,
            product_id=ci.product_id,
            quantity=ci.quantity,
            unit_price=product.price,
        ))

    # Vaciar carrito
    db.query(CartItem).filter(CartItem.store_id == store_id).delete()
    db.commit()

    return CheckoutResponse(
        order_id=str(order.id),
        order_number=order.order_number,
        status=order.tracking_status,
        total=order.total,
    )
