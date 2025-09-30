from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, date
from app.db.session import get_db
from app.models.equipment_movement import EquipmentMovement
from app.schemas.equipment_movement import EquipmentMovementRead
from app.core.auth import require_role
from app.schemas.user import UserRole

router = APIRouter(prefix="/equipment-movements", tags=["equipment-movements"], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])

@router.get("/", response_model=List[EquipmentMovementRead])
async def get_movements(
    equipment_id: Optional[int] = None,
    performed_by: Optional[int] = None,
    action: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(EquipmentMovement)
    if equipment_id:
        query = query.where(EquipmentMovement.equipment_id == equipment_id)
    if performed_by:
        query = query.where(EquipmentMovement.performed_by == performed_by)
    if action:
        query = query.where(EquipmentMovement.action == action)
    if date_from:
        query = query.where(EquipmentMovement.timestamp >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.where(EquipmentMovement.timestamp <= datetime.combine(date_to, datetime.max.time()))
    query = query.order_by(EquipmentMovement.timestamp.desc())
    result = await db.execute(query)
    return result.scalars().all() 