from pydantic import BaseModel, EmailStr
from typing import Optional, Union
import enum
from datetime import date, datetime

class UserRole(str, enum.Enum):
    superadmin = "superadmin"  # Вы - главный админ всей системы
    store_admin = "store_admin"  # Админ конкретного магазина
    staff = "staff"  # Сотрудник магазина
    viewer = "viewer"  # Просмотрщик
    client = "client"  # Клиент

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None  # Номер телефона клиента
    is_active: Optional[bool] = True
    role: UserRole = UserRole.staff
    store_id: Optional[int] = None  # null для superadmin
    birth_date: Optional[str] = None  # ISO date string
    passport_number: Optional[str] = None
    organization: Optional[str] = None
    trusted_person_name: Optional[str] = None
    trusted_person_phone: Optional[str] = None
    passport_photo_front: Optional[str] = None
    passport_photo_back: Optional[str] = None
    permissions: Optional[dict] = None  # Права доступа к разделам

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    store_id: Optional[int] = None
    store_name: Optional[str] = None  # Название магазина
    birth_date: Optional[Union[str, date, datetime]] = None  # Принимаем разные типы дат
    permissions: Optional[dict] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None
        }

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    store_id: Optional[int] = None
    birth_date: Optional[str] = None
    passport_number: Optional[str] = None
    organization: Optional[str] = None
    trusted_person_name: Optional[str] = None
    trusted_person_phone: Optional[str] = None
    passport_photo_front: Optional[str] = None
    passport_photo_back: Optional[str] = None
    permissions: Optional[dict] = None

class ClientCommentBase(BaseModel):
    text: str

class ClientCommentCreate(ClientCommentBase):
    pass

class ClientCommentRead(ClientCommentBase):
    id: int
    client_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    author_full_name: Optional[str] = None
    
    class Config:
        orm_mode = True 