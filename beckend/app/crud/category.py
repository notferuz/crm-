from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from typing import List, Optional

async def create_category(db: AsyncSession, category_in: CategoryCreate) -> Category:
    category = Category(**category_in.dict())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

async def get_category(db: AsyncSession, category_id: int, store_id: int = None) -> Optional[Category]:
    query = select(Category).where(Category.id == category_id, Category.is_deleted == False)
    if store_id:
        query = query.where(Category.store_id == store_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_categories(db: AsyncSession, skip: int = 0, limit: int = 100, store_id: int = None) -> List[Category]:
    query = select(Category).where(Category.is_deleted == False)
    if store_id:
        query = query.where(Category.store_id == store_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def update_category(db: AsyncSession, category_id: int, category_in: CategoryUpdate, store_id: int = None) -> Optional[Category]:
    query = select(Category).where(Category.id == category_id, Category.is_deleted == False)
    if store_id:
        query = query.where(Category.store_id == store_id)
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        return None
    for field, value in category_in.dict(exclude_unset=True).items():
        setattr(category, field, value)
    await db.commit()
    await db.refresh(category)
    return category

async def delete_category(db: AsyncSession, category_id: int, store_id: int = None) -> bool:
    query = select(Category).where(Category.id == category_id, Category.is_deleted == False)
    if store_id:
        query = query.where(Category.store_id == store_id)
    result = await db.execute(query)
    category = result.scalar_one_or_none()
    if not category:
        return False
    category.is_deleted = True
    await db.commit()
    return True 