from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class SupportMessage(Base):
    __tablename__ = "support_messages"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    sender_role = Column(String, nullable=False)  # 'admin' или 'store'
    sender_id = Column(Integer, nullable=False)   # id пользователя
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False) 