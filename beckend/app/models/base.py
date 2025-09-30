from sqlalchemy.orm import declared_attr
from sqlalchemy import Column, Boolean, DateTime, func
from sqlalchemy.ext.declarative import as_declarative, declared_attr

@as_declarative()
class Base:
    id: int

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()

    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 