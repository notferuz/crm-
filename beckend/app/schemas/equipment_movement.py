from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EquipmentMovementBase(BaseModel):
    equipment_id: int
    rental_id: int
    action: str
    quantity: int
    performed_by: int

class EquipmentMovementRead(EquipmentMovementBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True 