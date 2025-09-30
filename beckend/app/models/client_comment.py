from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime

class ClientComment(Base):
    __tablename__ = "client_comments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("User", foreign_keys=[client_id], backref="comments_received")
    author = relationship("User", foreign_keys=[author_id], backref="comments_written") 