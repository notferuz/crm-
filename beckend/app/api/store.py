from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.crud import store as store_crud
from app.schemas.store import StoreCreate, StoreRead, StoreUpdate
from app.schemas.user import UserRead
from app.core.deps import get_db, get_current_user

router = APIRouter(prefix="/stores", tags=["stores"])

@router.get("/", response_model=List[StoreRead])
async def read_stores(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Получить список всех магазинов.
    Доступно только для superadmin.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра списка магазинов"
        )
    
    stores = await store_crud.get_stores(db, skip=skip, limit=limit)
    return stores

@router.get("/active", response_model=List[StoreRead])
async def read_active_stores(
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Получить список только активных магазинов.
    Доступно для всех авторизованных пользователей.
    """
    stores = await store_crud.get_active_stores(db)
    return stores

@router.get("/{store_id}", response_model=StoreRead)
async def read_store(
    store_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Получить информацию о конкретном магазине.
    Доступно для всех авторизованных пользователей.
    """
    store = await store_crud.get_store(db, store_id=store_id)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Магазин не найден"
        )
    return store

# Публичный эндпоинт для получения магазина по slug (без авторизации)
@router.get("/public/by-slug/{slug}", response_model=StoreRead)
async def public_store_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    store = await store_crud.get_store_by_slug(db, slug)
    if not store:
        raise HTTPException(status_code=404, detail="Магазин не найден")
    return store

@router.post("/", response_model=StoreRead)
async def create_store(
    store: StoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Создать новый магазин.
    Доступно только для superadmin.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания магазина"
        )
    
    # Проверка на существование магазина с таким email
    existing_store = await store_crud.get_store_by_email(db, email=store.email)
    if existing_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Магазин с таким email уже существует"
        )
    
    return await store_crud.create_store(db=db, store=store)

@router.put("/{store_id}", response_model=StoreRead)
async def update_store(
    store_id: int,
    store: StoreUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Обновить информацию о магазине.
    Доступно только для superadmin.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для обновления магазина"
        )
    
    db_store = await store_crud.update_store(db=db, store_id=store_id, store=store)
    if db_store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Магазин не найден"
        )
    return db_store

@router.delete("/{store_id}")
async def delete_store(
    store_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Удалить магазин.
    Доступно только для superadmin.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления магазина"
        )
    
    success = await store_crud.delete_store(db=db, store_id=store_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Магазин не найден"
        )
    
    return {"message": "Магазин успешно удален"}

@router.get("/{store_id}/stats")
async def get_store_stats(
    store_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
):
    """
    Получить статистику магазина.
    Доступно для всех авторизованных пользователей.
    """
    # Проверяем, что магазин существует
    store = await store_crud.get_store(db, store_id=store_id)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Магазин не найден"
        )
    
    stats = await store_crud.get_store_stats(db, store_id=store_id)
    return stats 