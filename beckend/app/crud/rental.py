from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, func
from datetime import timedelta, date, datetime
from typing import List, Optional
from app.models.rental import Rental, RentalStatus, RentalItem
from app.models.equipment import Equipment
from app.models.equipment_movement import EquipmentMovement
from app.schemas.rental import RentalCreate
from app.models.user import User

async def create_rental(db: AsyncSession, rental_in: RentalCreate) -> Rental:
    # Проверяем доступность техники и при необходимости уменьшаем кол-во до доступного
    adjusted_items = []
    for item in rental_in.items:
        equipment = await db.get(Equipment, item.equipment_id)
        if not equipment:
            raise ValueError("Техника не найдена")
        available = equipment.quantity_available or 0
        requested = item.quantity or 0
        if available <= 0:
            raise ValueError(f"Недостаточно техники {equipment.title} (доступно: 0, запрошено: {requested})")
        adjusted_quantity = min(requested, available)
        # Перезаписываем количество, если запрос превышает доступное
        item.quantity = adjusted_quantity
        adjusted_items.append(item)
    
    # Создаем аренду
    # Пересчитываем итоговую сумму с учетом скорректированных количеств
    # По умолчанию используем количество дней как разницу между датами (минимум 1)
    try:
        days = (rental_in.date_end - rental_in.date_start).days
        days = days if days > 0 else 1
    except Exception:
        days = 1

    recomputed_total = 0
    for item in adjusted_items:
        price_per_day = getattr(item, 'price_per_day', 0) or 0
        recomputed_total += (item.quantity or 0) * price_per_day * days

    rental = Rental(
        client_id=rental_in.client_id,
        admin_id=rental_in.admin_id,
        store_id=rental_in.store_id,
        date_start=rental_in.date_start,
        date_end=rental_in.date_end,
        total_amount=recomputed_total if recomputed_total > 0 else rental_in.total_amount,
        status=rental_in.status,
        comment=rental_in.comment
    )
    db.add(rental)
    await db.flush()
    
    # Создаем элементы аренды и обновляем количество техники
    for item in adjusted_items:
        rental_item = RentalItem(
            rental_id=rental.id,
            equipment_id=item.equipment_id,
            quantity=item.quantity,
            price_per_day=item.price_per_day
        )
        db.add(rental_item)
        
        # Обновляем количество доступной техники
        equipment = await db.get(Equipment, item.equipment_id)
        equipment.quantity_available -= item.quantity
    
    await db.commit()
    # Повторно загружаем rental с items для корректной сериализации
    result = await db.execute(
        select(Rental).options(selectinload(Rental.items)).where(Rental.id == rental.id)
    )
    rental = result.scalar_one()
    return rental

async def get_rental(db: AsyncSession, rental_id: int, store_id: int = None) -> Optional[Rental]:
    query = select(Rental).options(selectinload(Rental.items)).where(Rental.id == rental_id, Rental.is_deleted == False)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_rentals(db: AsyncSession, skip: int = 0, limit: int = 100, store_id: int = None):
    query = select(Rental).options(selectinload(Rental.items)).where(Rental.is_deleted == False)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rentals = result.scalars().all()
    # Получаем client_id и admin_id для всех аренд
    client_ids = list({r.client_id for r in rentals if r.client_id})
    admin_ids = list({r.admin_id for r in rentals if r.admin_id})
    clients = {}
    admins = {}
    if client_ids:
        client_result = await db.execute(select(User).where(User.id.in_(client_ids)))
        for user in client_result.scalars().all():
            clients[user.id] = user
    if admin_ids:
        admin_result = await db.execute(select(User).where(User.id.in_(admin_ids)))
        for user in admin_result.scalars().all():
            admins[user.id] = user
    # Формируем выдачу с ФИО, email, phone, admin_full_name
    rentals_out = []
    for r in rentals:
        client = clients.get(r.client_id)
        admin = admins.get(r.admin_id)
        rental_dict = r.__dict__.copy()
        rental_dict['items'] = r.items
        rental_dict['client_full_name'] = client.full_name if client else None
        rental_dict['client_email'] = client.email if client else None
        rental_dict['client_phone'] = client.phone if client else None
        rental_dict['admin_full_name'] = admin.full_name if admin else None
        rentals_out.append(rental_dict)
    return rentals_out

async def delete_rental(db: AsyncSession, rental_id: int, store_id: int = None) -> bool:
    query = select(Rental).where(Rental.id == rental_id, Rental.is_deleted == False)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    result = await db.execute(query)
    rental = result.scalar_one_or_none()
    if not rental:
        return False
    rental.is_deleted = True
    await db.commit()
    return True

async def return_rental(db: AsyncSession, rental_id: int, store_id: int = None, cash: float = 0.0, card: float = 0.0) -> bool:
    query = select(Rental).where(Rental.id == rental_id, Rental.status == RentalStatus.active)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    result = await db.execute(query)
    rental = result.scalar_one_or_none()
    if not rental:
        return False
    
    # Возвращаем технику
    items_result = await db.execute(select(RentalItem).where(RentalItem.rental_id == rental_id))
    items = items_result.scalars().all()
    
    for item in items:
        equipment = await db.get(Equipment, item.equipment_id)
        if equipment:
            equipment.quantity_available += item.quantity
    
    # Сохраняем информацию об оплате в комментарий (пока без отдельной таблицы)
    pay_note = f"cash:{max(0.0, cash or 0.0)}; card:{max(0.0, card or 0.0)}"
    if rental.comment and rental.comment.strip():
        rental.comment = f"{rental.comment} | {pay_note}"
    else:
        rental.comment = pay_note

    rental.status = RentalStatus.completed
    await db.commit()
    return True

async def mark_overdue_rentals(db: AsyncSession):
    today = date.today()
    result = await db.execute(
        select(Rental).where(
            and_(
                Rental.status == RentalStatus.active,
                Rental.date_end < today,
                Rental.is_deleted == False
            )
        )
    )
    overdue_rentals = result.scalars().all()
    
    for rental in overdue_rentals:
        rental.status = RentalStatus.overdue
    
    await db.commit()

async def activate_booking(db: AsyncSession, rental_id: int, store_id: int = None) -> bool:
    query = select(Rental).where(Rental.id == rental_id, Rental.status == RentalStatus.booked)
    if store_id:
        query = query.where(Rental.store_id == store_id)
    result = await db.execute(query)
    rental = result.scalar_one_or_none()
    if not rental:
        return False
    
    # Проверяем доступность техники
    items_result = await db.execute(select(RentalItem).where(RentalItem.rental_id == rental_id))
    items = items_result.scalars().all()
    
    for item in items:
        equipment = await db.get(Equipment, item.equipment_id)
        if not equipment or equipment.quantity_available < item.quantity:
            return False
    
    # Активируем аренду и обновляем количество техники
    for item in items:
        equipment = await db.get(Equipment, item.equipment_id)
        equipment.quantity_available -= item.quantity
    
    rental.status = RentalStatus.active
    await db.commit()
    return True 