from sqlalchemy import Column, Integer, String, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    quantity_total = Column(Integer, default=0)
    quantity_available = Column(Integer, default=0)
    photos = Column(String, nullable=True)  # Можно хранить ссылки через запятую или сделать отдельную таблицу
    price_per_day = Column(Integer, default=0)
    status = Column(String, nullable=True, default='available')  # available, rented, maintenance
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="equipment")
    category = relationship("Category", back_populates="equipment")
    movements = relationship("EquipmentMovement", back_populates="equipment") 