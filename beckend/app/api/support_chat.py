from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.db.session import get_db
from app.models.support_message import SupportMessage
from app.schemas.support_message import SupportMessageCreate, SupportMessageRead
from app.core.auth import get_current_user

router = APIRouter(prefix="/support", tags=["support"])

@router.get("/messages/{store_id}", response_model=List[SupportMessageRead])
async def get_messages(store_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SupportMessage).where(SupportMessage.store_id == store_id).order_by(SupportMessage.created_at)
    )
    return result.scalars().all()

@router.post("/messages/", response_model=SupportMessageRead)
async def send_message(msg: SupportMessageCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    db_msg = SupportMessage(**msg.dict())
    db.add(db_msg)
    await db.commit()
    await db.refresh(db_msg)
    return db_msg 