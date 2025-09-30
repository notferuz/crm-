from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.crud.category import create_category, get_category, get_categories, update_category, delete_category
from app.db.session import get_db
from app.crud import store as store_crud
from app.core.auth import require_role, get_current_user
from app.schemas.user import UserRole
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=CategoryRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def create(
    category_in: CategoryCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Устанавливаем store_id для store_admin
    if current_user.role == UserRole.store_admin:
        category_in.store_id = current_user.store_id
    
    return await create_category(db, category_in)

@router.get("/", response_model=List[CategoryRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin показываем все данные, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    return await get_categories(db, skip, limit, store_id)

# Публичный список категорий по slug магазина (без авторизации)
@router.get("/public", response_model=List[CategoryRead])
async def public_read_all(store_slug: str = None, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    store_id = None
    if store_slug:
        store = await store_crud.get_store_by_slug(db, store_slug)
        store_id = store.id if store else None
    return await get_categories(db, skip, limit, store_id)

@router.get("/{category_id}", response_model=CategoryRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read(category_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin показываем все данные, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    category = await get_category(db, category_id, store_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=CategoryRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def update(category_id: int, category_in: CategoryUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin разрешаем редактировать все, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    category = await update_category(db, category_id, category_in, store_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/{category_id}", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def delete(category_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin разрешаем удалять все, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    success = await delete_category(db, category_id, store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True} 