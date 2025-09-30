from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=True, unique=True, index=True)
    address = Column(Text, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    logo_url = Column(String(500), nullable=True)
    about_html = Column(Text, nullable=True)
    map_iframe = Column(Text, nullable=True)
    telegram = Column(String(255), nullable=True)
    instagram = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    users = relationship("User", back_populates="store")
    equipment = relationship("Equipment", back_populates="store")
    rentals = relationship("Rental", back_populates="store")
    categories = relationship("Category", back_populates="store") 