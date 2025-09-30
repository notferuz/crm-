from pydantic import BaseModel
from datetime import datetime

class SupportMessageBase(BaseModel):
    store_id: int
    sender_role: str
    sender_id: int
    text: str

class SupportMessageCreate(SupportMessageBase):
    pass

class SupportMessageRead(SupportMessageBase):
    id: int
    created_at: datetime
    is_read: bool

    class Config:
        orm_mode = True 