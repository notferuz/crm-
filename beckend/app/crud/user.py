from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.auth import get_password_hash
from passlib.context import CryptContext
from typing import Optional
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def create_user(db: AsyncSession, user_in: UserCreate, role: UserRole = UserRole.staff):
    # Проверяем, существует ли пользователь с таким email
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise ValueError(f"Пользователь с email {user_in.email} уже существует")
    
    hashed_password = get_password_hash(user_in.password)
    
    # Преобразуем birth_date из строки в объект date если он есть
    birth_date = None
    if user_in.birth_date:
        if isinstance(user_in.birth_date, str):
            try:
                birth_date = datetime.strptime(user_in.birth_date, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError(f"Неверный формат даты: {user_in.birth_date}. Ожидается формат YYYY-MM-DD")
        else:
            birth_date = user_in.birth_date
    
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=role,
        store_id=user_in.store_id,
        is_active=user_in.is_active,
        birth_date=birth_date,
        passport_number=user_in.passport_number,
        organization=user_in.organization,
        trusted_person_name=user_in.trusted_person_name,
        trusted_person_phone=user_in.trusted_person_phone,
        passport_photo_front=user_in.passport_photo_front,
        passport_photo_back=user_in.passport_photo_back,
        permissions=getattr(user_in, 'permissions', None)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def create_client(db: AsyncSession, user_in: UserCreate):
    return await create_user(db, user_in, role=UserRole.client)

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

async def get_users_by_store(db: AsyncSession, store_id: int, skip: int = 0, limit: int = 100):
    if store_id is None:
        return await get_users(db, skip, limit)
    result = await db.execute(
        select(User).where(User.store_id == store_id).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_clients(db: AsyncSession, skip: int = 0, limit: int = 100, store_id: int = None):
    query = select(User).where(User.role == UserRole.client)
    if store_id:
        query = query.where(User.store_id == store_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def update_user(db: AsyncSession, user_id: int, user_data: dict, store_id: int = None):
    query = select(User).where(User.id == user_id)
    if store_id:
        query = query.where(User.store_id == store_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user:
        # Обрабатываем birth_date отдельно
        if 'birth_date' in user_data and user_data['birth_date']:
            if isinstance(user_data['birth_date'], str):
                try:
                    user_data['birth_date'] = datetime.strptime(user_data['birth_date'], '%Y-%m-%d').date()
                except ValueError:
                    raise ValueError(f"Неверный формат даты: {user_data['birth_date']}. Ожидается формат YYYY-MM-DD")
        
        for field, value in user_data.items():
            setattr(user, field, value)
        await db.commit()
        await db.refresh(user)
    return user

async def delete_client(db: AsyncSession, user_id: int, store_id: int = None):
    query = select(User).where(User.id == user_id, User.role == UserRole.client)
    if store_id:
        query = query.where(User.store_id == store_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user:
        await db.delete(user)
        await db.commit()
        return True
    return False 

async def delete_user_by_id(db: AsyncSession, user_id: int, store_id: int | None = None) -> bool:
    """Удаляет пользователя по id. Если указан store_id, ограничиваем удаление рамками магазина.
    Не позволяет удалить супер-админа.
    """
    query = select(User).where(User.id == user_id)
    if store_id:
        query = query.where(User.store_id == store_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if not user:
        return False
    # Защита от удаления супер-админа
    if str(user.role).lower() == str(UserRole.superadmin.value).lower():
        return False
    await db.delete(user)
    await db.commit()
    return True