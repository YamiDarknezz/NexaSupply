import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Store(Base):
    __tablename__ = "stores"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name                = Column(String(200), nullable=False)
    ruc                 = Column(String(20))
    address             = Column(String(300))
    phone               = Column(String(20))
    owner_name          = Column(String(200), nullable=False)
    email               = Column(String(200), unique=True, nullable=False, index=True)
    password_hash       = Column(String(256), nullable=False)
    plan                = Column(String(20), default="basic")
    subscription_status = Column(String(20), default="inactive")
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    orders           = relationship("Order", back_populates="store", lazy="dynamic")
    inventory_items  = relationship("InventoryItem", back_populates="store", lazy="dynamic")
