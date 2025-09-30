from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoreBase(BaseModel):
    name: str
    slug: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    about_html: Optional[str] = None
    map_iframe: Optional[str] = None
    telegram: Optional[str] = None
    instagram: Optional[str] = None

class StoreCreate(StoreBase):
    is_active: Optional[bool] = True

class StoreRead(StoreBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    logo_url: Optional[str] = None
    about_html: Optional[str] = None
    map_iframe: Optional[str] = None
    telegram: Optional[str] = None
    instagram: Optional[str] = None