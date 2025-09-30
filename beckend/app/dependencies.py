from fastapi import Depends
from app.core.auth import get_current_user

def get_current_active_user(user=Depends(get_current_user)):
    # Здесь можно добавить дополнительные проверки активности пользователя
    return user 