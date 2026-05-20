import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class InventoryItem(Base):
    __tablename__ = "inventory"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id     = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    product_id   = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity     = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    store = relationship("Store", back_populates="inventory_items")
