from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import date, datetime, timedelta
from app.db.session import get_db
from app.models.equipment import Equipment
from app.models.rental import Rental
from app.models.user import User
from app.core.auth import require_role, get_current_user
from app.schemas.user import UserRole

router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])

@router.get("/")
async def dashboard(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    period: Optional[str] = Query(default=None, description="today | yesterday | custom"),
    date_from: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    history_limit: int = Query(default=10)
):
    # Store scope
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id

    # Equipment stats (store-scoped)
    equipment_query = select(func.count()).select_from(Equipment).where(Equipment.is_deleted == False)
    if store_id:
        equipment_query = equipment_query.where(Equipment.store_id == store_id)
    total_equipment = await db.scalar(equipment_query)

    available_query = select(func.sum(Equipment.quantity_available)).where(Equipment.is_deleted == False)
    if store_id:
        available_query = available_query.where(Equipment.store_id == store_id)
    available = await db.scalar(available_query) or 0

    busy_query = select(func.sum(Equipment.quantity_total - Equipment.quantity_available)).where(Equipment.is_deleted == False)
    if store_id:
        busy_query = busy_query.where(Equipment.store_id == store_id)
    busy = await db.scalar(busy_query) or 0

    # Resolve period range
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    today = date.today()

    if period == "today":
        start_date = today
        end_date = today
    elif period == "yesterday":
        start_date = today - timedelta(days=1)
        end_date = today - timedelta(days=1)
    elif period == "custom":
        if not (date_from and date_to):
            raise HTTPException(status_code=400, detail="date_from and date_to are required for custom period")
        try:
            start_date = datetime.strptime(date_from, "%Y-%m-%d").date()
            end_date = datetime.strptime(date_to, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="date_from cannot be after date_to")

    # Default: if no period provided, use today
    if start_date is None or end_date is None:
        start_date = today
        end_date = today

    # Rentals and revenue for selected range (inclusive)
    base_range_filters = [
        Rental.is_deleted == False,
        Rental.date_start >= start_date,
        Rental.date_start <= end_date,
    ]
    rentals_range_query = select(func.count()).select_from(Rental).where(*base_range_filters)
    if store_id:
        rentals_range_query = rentals_range_query.where(Rental.store_id == store_id)
    rentals_count = await db.scalar(rentals_range_query) or 0

    revenue_range_query = select(func.sum(Rental.total_amount)).where(*base_range_filters)
    if store_id:
        revenue_range_query = revenue_range_query.where(Rental.store_id == store_id)
    revenue_total = await db.scalar(revenue_range_query) or 0

    # Unique clients in range
    unique_clients_query = select(func.count(func.distinct(Rental.client_id))).where(*base_range_filters)
    if store_id:
        unique_clients_query = unique_clients_query.where(Rental.store_id == store_id)
    unique_clients = await db.scalar(unique_clients_query) or 0

    # Status distribution in range
    status_query = select(Rental.status, func.count()).where(*base_range_filters)
    if store_id:
        status_query = status_query.where(Rental.store_id == store_id)
    status_query = status_query.group_by(Rental.status)
    status_result = await db.execute(status_query)
    status_counts = {str(status): count for status, count in status_result.all()}

    # Parse payments from comments for cash/card aggregation (temporary solution)
    payments_query = select(Rental.comment).where(*base_range_filters)
    if store_id:
        payments_query = payments_query.where(Rental.store_id == store_id)
    payments_result = await db.execute(payments_query)
    cash_total = 0.0
    card_total = 0.0
    for (comment,) in payments_result.all():
        if not comment:
            continue
        try:
            # look for patterns like 'cash:123; card:456'
            parts = str(comment).split('|')
            for part in parts:
                if 'cash:' in part:
                    val = part.split('cash:')[1].split(';')[0].strip()
                    cash_total += float(val or 0)
                if 'card:' in part:
                    # handle both 'card:123' and '; card:123'
                    idx = part.find('card:')
                    if idx >= 0:
                        val = part[idx+5:].split(';')[0].strip()
                        card_total += float(val or 0)
        except Exception:
            continue

    # Average check in range
    avg_check = float(revenue_total) / float(rentals_count) if rentals_count else 0.0

    # Backward compatibility fields (today-only)
    rentals_today_query = select(func.count()).select_from(Rental).where(Rental.date_start == today, Rental.is_deleted == False)
    if store_id:
        rentals_today_query = rentals_today_query.where(Rental.store_id == store_id)
    rentals_today = await db.scalar(rentals_today_query) or 0

    total_amount_query = select(func.sum(Rental.total_amount)).where(Rental.date_start == today, Rental.is_deleted == False)
    if store_id:
        total_amount_query = total_amount_query.where(Rental.store_id == store_id)
    total_amount_today = await db.scalar(total_amount_query) or 0

    # History (latest N within selected range)
    history_base = select(Rental, User).join(User, Rental.client_id == User.id).where(Rental.is_deleted == False)
    if store_id:
        history_base = history_base.where(Rental.store_id == store_id)
    history_base = history_base.where(Rental.date_start >= start_date, Rental.date_start <= end_date)
    history_base = history_base.order_by(Rental.date_start.desc()).limit(history_limit)
    result = await db.execute(history_base)
    history = []
    for r, client in result.all():
        admin_result = await db.execute(select(User).where(User.id == r.admin_id))
        admin = admin_result.scalar_one_or_none()
        history.append({
            "id": r.id,
            "client_id": r.client_id,
            "client_full_name": client.full_name if client else None,
            "admin_id": r.admin_id,
            "admin_full_name": admin.full_name if admin else None,
            "date_start": r.date_start,
            "date_end": r.date_end,
            "total_amount": r.total_amount,
            "status": r.status,
            "comment": r.comment
        })

    return {
        "equipment": {
            "total": total_equipment,
            "busy": busy,
            "available": available
        },
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "rentals": rentals_count,
            "revenue": revenue_total,
            "unique_clients": unique_clients,
            "status_counts": status_counts,
            "avg_check": avg_check,
            "cash": cash_total,
            "card": card_total,
        },
        # legacy today fields kept for compatibility
        "rentals_today": rentals_today,
        "total_amount_today": total_amount_today,
        "history": history
    } 