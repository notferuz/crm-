from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.models.rental import RentalStatus

class RentalItemBase(BaseModel):
    equipment_id: int
    quantity: int
    price_per_day: float

class RentalItemCreate(RentalItemBase):
    pass

class RentalItemRead(RentalItemBase):
    id: int
    rental_id: int
    is_deleted: bool = False

    class Config:
        from_attributes = True

class RentalBase(BaseModel):
    client_id: int
    admin_id: Optional[int] = None
    store_id: Optional[int] = None
    date_start: date
    date_end: date
    total_amount: float
    status: RentalStatus = RentalStatus.booked
    comment: Optional[str] = None

class RentalCreate(RentalBase):
    items: List[RentalItemCreate]

class RentalRead(RentalBase):
    id: int
    is_deleted: bool = False
    items: List[RentalItemRead] = []
    client_full_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    admin_full_name: Optional[str] = None

    class Config:
        from_attributes = True 