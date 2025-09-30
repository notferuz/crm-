from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EquipmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    store_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity_total: int = 0
    quantity_available: int = 0
    price_per_day: int = 0

class EquipmentCreate(EquipmentBase):
    photos: Optional[str] = None
    status: Optional[str] = 'available'

class EquipmentRead(EquipmentBase):
    id: int
    store_id: int
    photos: Optional[str] = None
    status: Optional[str] = None
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

class EquipmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    store_id: Optional[int] = None
    category_id: Optional[int] = None
    quantity_total: Optional[int] = None
    quantity_available: Optional[int] = None
    price_per_day: Optional[int] = None
    photos: Optional[str] = None
    status: Optional[str] = None 