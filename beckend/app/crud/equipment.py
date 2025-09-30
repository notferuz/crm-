from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.equipment import Equipment
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate
from typing import List, Optional
from sqlalchemy.orm import joinedload

async def create_equipment(db: AsyncSession, equipment_in: EquipmentCreate) -> Equipment:
    equipment = Equipment(**equipment_in.dict())
    db.add(equipment)
    await db.commit()
    await db.refresh(equipment)
    return equipment

async def get_equipment(db: AsyncSession, equipment_id: int, store_id: int = None) -> Optional[Equipment]:
    query = select(Equipment).where(Equipment.id == equipment_id, Equipment.is_deleted == False)
    if store_id:
        query = query.where(Equipment.store_id == store_id)
    query = query.options(joinedload(Equipment.category))
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_equipments(db: AsyncSession, skip: int = 0, limit: int = 100, store_id: int = None) -> List[Equipment]:
    query = select(Equipment).where(Equipment.is_deleted == False)
    if store_id:
        query = query.where(Equipment.store_id == store_id)
    query = query.options(joinedload(Equipment.category))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def update_equipment(db: AsyncSession, equipment_id: int, equipment_in: EquipmentUpdate, store_id: int = None) -> Optional[Equipment]:
    query = select(Equipment).where(Equipment.id == equipment_id, Equipment.is_deleted == False)
    if store_id:
        query = query.where(Equipment.store_id == store_id)
    result = await db.execute(query)
    equipment = result.scalar_one_or_none()
    if not equipment:
        return None
    # Preserve the number of items currently in rental when only total is updated
    incoming_data = equipment_in.dict(exclude_unset=True)
    if "quantity_total" in incoming_data and "quantity_available" not in incoming_data:
        previous_total = equipment.quantity_total or 0
        previous_available = equipment.quantity_available or 0
        currently_rented = max(0, previous_total - previous_available)
        new_total = incoming_data["quantity_total"] or 0
        # Keep currently rented units, adjust available accordingly and bound to [0, new_total]
        adjusted_available = max(0, min(new_total, new_total - currently_rented))
        incoming_data["quantity_available"] = adjusted_available

    for field, value in incoming_data.items():
        setattr(equipment, field, value)
    await db.commit()
    await db.refresh(equipment)
    return equipment

async def delete_equipment(db: AsyncSession, equipment_id: int, store_id: int = None) -> bool:
    query = select(Equipment).where(Equipment.id == equipment_id, Equipment.is_deleted == False)
    if store_id:
        query = query.where(Equipment.store_id == store_id)
    result = await db.execute(query)
    equipment = result.scalar_one_or_none()
    if not equipment:
        return False
    equipment.is_deleted = True
    await db.commit()
    return True 