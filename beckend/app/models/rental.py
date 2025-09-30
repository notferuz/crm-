from sqlalchemy import Column, Integer, String, Date, Float, Boolean, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum
from datetime import datetime

class RentalStatus(str, enum.Enum):
    booked = "booked"
    active = "active"
    completed = "completed"
    overdue = "overdue"
    cancelled = "cancelled"

class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_start = Column(Date, nullable=False)
    date_end = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(RentalStatus), default=RentalStatus.booked, nullable=False)
    comment = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False)

    store = relationship("Store", back_populates="rentals")
    client = relationship("User", foreign_keys=[client_id], back_populates="client_rentals")
    admin = relationship("User", foreign_keys=[admin_id], back_populates="admin_rentals")
    equipment_movements = relationship("EquipmentMovement", back_populates="rental")
    items = relationship("RentalItem", back_populates="rental")

class RentalItem(Base):
    __tablename__ = "rental_items"

    id = Column(Integer, primary_key=True, index=True)
    rental_id = Column(Integer, ForeignKey("rentals.id"), nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_day = Column(Float, nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rental = relationship("Rental", back_populates="items")
    equipment = relationship("Equipment") 