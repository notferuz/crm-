from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.store import Store
from app.schemas.store import StoreCreate, StoreUpdate
from typing import List, Optional

async def get_store(db: AsyncSession, store_id: int) -> Optional[Store]:
    """Получить магазин по ID"""
    result = await db.execute(select(Store).filter(Store.id == store_id))
    return result.scalar_one_or_none()

async def get_stores(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Store]:
    """Получить список всех магазинов"""
    result = await db.execute(select(Store).offset(skip).limit(limit))
    return result.scalars().all()

async def get_active_stores(db: AsyncSession) -> List[Store]:
    """Получить список только активных магазинов"""
    result = await db.execute(select(Store).filter(Store.is_active == True))
    return result.scalars().all()

async def create_store(db: AsyncSession, store: StoreCreate) -> Store:
    """Создать новый магазин"""
    db_store = Store(
        name=store.name,
        slug=store.slug,
        address=store.address,
        phone=store.phone,
        email=store.email,
        is_active=store.is_active if store.is_active is not None else True
    )
    db.add(db_store)
    await db.commit()
    await db.refresh(db_store)
    return db_store

async def update_store(db: AsyncSession, store_id: int, store: StoreUpdate) -> Optional[Store]:
    """Обновить магазин"""
    db_store = await get_store(db, store_id)
    if not db_store:
        return None
    
    update_data = store.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_store, field, value)
    
    await db.commit()
    await db.refresh(db_store)
    return db_store

async def delete_store(db: AsyncSession, store_id: int) -> bool:
    """Удалить магазин"""
    db_store = await get_store(db, store_id)
    if not db_store:
        return False
    
    # Сначала удаляем или обновляем связанные записи
    from app.models.user import User
    from app.models.equipment import Equipment
    from app.models.rental import Rental
    from app.models.category import Category
    
    # Удаляем категории магазина
    categories_result = await db.execute(
        select(Category).filter(Category.store_id == store_id)
    )
    categories = categories_result.scalars().all()
    for category in categories:
        await db.delete(category)
    
    # Удаляем оборудование магазина
    equipment_result = await db.execute(
        select(Equipment).filter(Equipment.store_id == store_id)
    )
    equipment_list = equipment_result.scalars().all()
    for equipment in equipment_list:
        await db.delete(equipment)
    
    # Удаляем аренды магазина
    rentals_result = await db.execute(
        select(Rental).filter(Rental.store_id == store_id)
    )
    rentals = rentals_result.scalars().all()
    for rental in rentals:
        await db.delete(rental)
    
    # Удаляем пользователей магазина (кроме superadmin)
    users_result = await db.execute(
        select(User).filter(User.store_id == store_id)
    )
    users = users_result.scalars().all()
    for user in users:
        await db.delete(user)
    
    # Теперь удаляем сам магазин
    await db.delete(db_store)
    await db.commit()
    return True

async def get_store_by_email(db: AsyncSession, email: str) -> Optional[Store]:
    """Получить магазин по email"""
    result = await db.execute(select(Store).filter(Store.email == email))
    return result.scalar_one_or_none()

async def get_store_by_slug(db: AsyncSession, slug: str) -> Optional[Store]:
    result = await db.execute(select(Store).filter(Store.slug == slug))
    return result.scalar_one_or_none()

async def get_store_stats(db: AsyncSession, store_id: int) -> dict:
    """Получить статистику магазина"""
    from app.models.user import User
    from app.models.equipment import Equipment
    from app.models.rental import Rental
    
    # Подсчет сотрудников магазина
    result = await db.execute(
        select(func.count(User.id)).filter(
            User.store_id == store_id,
            User.role.in_(['store_admin', 'staff'])
        )
    )
    total_employees = result.scalar()
    
    # Подсчет оборудования магазина
    result = await db.execute(
        select(func.count(Equipment.id)).filter(Equipment.store_id == store_id)
    )
    total_equipment = result.scalar()
    
    # Подсчет активных аренд
    result = await db.execute(
        select(func.count(Rental.id)).filter(
            Rental.store_id == store_id,
            Rental.status == 'active'
        )
    )
    active_rentals = result.scalar()
    
    # Подсчет всех аренд
    result = await db.execute(
        select(func.count(Rental.id)).filter(Rental.store_id == store_id)
    )
    total_rentals = result.scalar()
    
    return {
        "total_employees": total_employees,
        "total_equipment": total_equipment,
        "active_rentals": active_rentals,
        "total_rentals": total_rentals
    } 