from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class EquipmentMovement(Base):
    __tablename__ = "equipment_movements"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    rental_id = Column(Integer, ForeignKey("rentals.id"), nullable=True)
    action = Column(String, nullable=False)  # issued, returned, maintenance
    quantity = Column(Integer, nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    equipment = relationship("Equipment", back_populates="movements")
    rental = relationship("Rental", back_populates="equipment_movements")
    user = relationship("User", back_populates="equipment_movements") 