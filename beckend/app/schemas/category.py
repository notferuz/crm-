from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    store_id: Optional[int] = None

class CategoryRead(CategoryBase):
    id: int
    store_id: Optional[int] = None
    is_deleted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CategoryUpdate(BaseModel):
    name: Optional[str] = None 