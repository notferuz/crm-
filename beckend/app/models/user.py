from sqlalchemy import Column, Integer, String, Boolean, Enum, Date, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum

class UserRole(str, enum.Enum):
    superadmin = "superadmin"  # Вы - главный админ всей системы
    store_admin = "store_admin"  # Админ конкретного магазина
    staff = "staff"  # Сотрудник магазина
    viewer = "viewer"  # Просмотрщик
    client = "client"  # Клиент

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", "store_id", name="uq_email_store"),
    )

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)  # Номер телефона клиента
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.staff, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)  # null для superadmin
    birth_date = Column(Date, nullable=True)
    passport_number = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    trusted_person_name = Column(String, nullable=True)
    trusted_person_phone = Column(String, nullable=True)
    passport_photo_front = Column(String, nullable=True)
    passport_photo_back = Column(String, nullable=True)
    permissions = Column(JSON, nullable=True)  # Разрешения на просмотр разделов
    
    # Relationships
    store = relationship("Store", back_populates="users")
    client_rentals = relationship("Rental", foreign_keys="Rental.client_id", back_populates="client")
    admin_rentals = relationship("Rental", foreign_keys="Rental.admin_id", back_populates="admin")
    equipment_movements = relationship("EquipmentMovement", back_populates="user") 