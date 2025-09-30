from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas.user import UserRead

# Экспортируем зависимости для использования в API
__all__ = ["get_db", "get_current_user"] 