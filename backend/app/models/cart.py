import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from ..core.database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id   = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
