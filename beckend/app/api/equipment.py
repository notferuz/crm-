from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.equipment import EquipmentCreate, EquipmentRead, EquipmentUpdate
from app.crud.equipment import create_equipment, get_equipment, get_equipments, update_equipment, delete_equipment
from app.db.session import get_db
from app.crud import store as store_crud
from app.core.auth import require_role, get_current_user
from app.schemas.user import UserRole
from app.models.user import User

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.post("/", response_model=EquipmentRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def create(equipment_in: EquipmentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для store_admin устанавливаем store_id из его профиля
    if current_user.role == UserRole.store_admin:
        equipment_in.store_id = current_user.store_id
    return await create_equipment(db, equipment_in)

@router.get("/", response_model=List[EquipmentRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin показываем все данные, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    equipments = await get_equipments(db, skip, limit, store_id)
    # Добавляем category_name
    result = []
    for eq in equipments:
        item = eq.__dict__.copy()
        item['category_name'] = eq.category.name if getattr(eq, 'category', None) else None
        result.append(item)
    return result

# Публичный список техники по slug (без авторизации)
@router.get("/public", response_model=List[EquipmentRead])
async def public_read_all(store_slug: str = None, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    store_id = None
    if store_slug:
        store = await store_crud.get_store_by_slug(db, store_slug)
        store_id = store.id if store else None
    equipments = await get_equipments(db, skip, limit, store_id)
    result = []
    for eq in equipments:
        item = eq.__dict__.copy()
        item['category_name'] = eq.category.name if getattr(eq, 'category', None) else None
        result.append(item)
    return result

@router.get("/{equipment_id}", response_model=EquipmentRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read(equipment_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin показываем все данные, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    equipment = await get_equipment(db, equipment_id, store_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    item = equipment.__dict__.copy()
    item['category_name'] = equipment.category.name if getattr(equipment, 'category', None) else None
    return item

@router.put("/{equipment_id}", response_model=EquipmentRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def update(equipment_id: int, equipment_in: EquipmentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin разрешаем редактировать все, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    equipment = await update_equipment(db, equipment_id, equipment_in, store_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.delete("/{equipment_id}", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def delete(equipment_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin разрешаем удалять все, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    success = await delete_equipment(db, equipment_id, store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"ok": True} 