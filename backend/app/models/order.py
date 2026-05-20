import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id        = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    order_number    = Column(String(20), unique=True)
    total           = Column(Float, nullable=False)
    tracking_status = Column(String(30), default="confirmed")
    status_history  = Column(JSON, default=list)
    payment_method  = Column(String(50), default="simulated_card")
    paid_at         = Column(DateTime(timezone=True))
    delivered_at    = Column(DateTime(timezone=True))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    store = relationship("Store", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="joined")


class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id   = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
