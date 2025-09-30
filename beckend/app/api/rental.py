from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.rental import RentalCreate, RentalRead
from app.crud.rental import create_rental, get_rental, get_rentals, delete_rental, return_rental, mark_overdue_rentals, activate_booking
from app.db.session import get_db
from app.core.auth import require_role, get_current_user
from app.schemas.user import UserRole
from app.models.user import User
from sqlalchemy import select
from app.models.rental import Rental

router = APIRouter(prefix="/rentals", tags=["rentals"])

@router.post("/", response_model=RentalRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff))])
async def create(rental_in: RentalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        rental_data = rental_in.dict()
        rental_data['admin_id'] = current_user.id
        rental_data['store_id'] = current_user.store_id
        return await create_rental(db, RentalCreate(**rental_data))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[RentalRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await mark_overdue_rentals(db)
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    return await get_rentals(db, skip, limit, store_id)

@router.get("/{rental_id}", response_model=RentalRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read(rental_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    rental = await get_rental(db, rental_id, store_id)
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    return rental

@router.delete("/{rental_id}", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def delete(rental_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    success = await delete_rental(db, rental_id, store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rental not found")
    return {"ok": True}

from pydantic import BaseModel

class ReturnPayload(BaseModel):
    cash: float | None = 0
    card: float | None = 0

@router.patch("/{rental_id}/return", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff))])
async def return_equipment(rental_id: int, payload: ReturnPayload | None = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    cash = float(payload.cash) if payload and payload.cash is not None else 0.0
    card = float(payload.card) if payload and payload.card is not None else 0.0
    success = await return_rental(db, rental_id, store_id, cash=cash, card=card)
    if not success:
        raise HTTPException(status_code=404, detail="Rental not found or not active")
    return {"ok": True}

@router.get("/overdue", response_model=List[RentalRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def overdue(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await mark_overdue_rentals(db)
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    query = select(Rental).where(Rental.status == "overdue", Rental.is_deleted == False)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{rental_id}/activate", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff))])
async def activate(rental_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    success = await activate_booking(db, rental_id, store_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot activate booking (not found, not booked, or not enough equipment)")
    return {"ok": True}

@router.get("/booked", response_model=List[RentalRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def booked(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    query = select(Rental).where(Rental.status == "booked", Rental.is_deleted == False)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    result = await db.execute(query)
    return result.scalars().all() 