from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from typing import List
from app.schemas.user import UserCreate, UserRead, UserUpdate, ClientCommentCreate, ClientCommentRead
from app.crud.user import create_client, get_clients, delete_client, update_user, get_user
from app.db.session import get_db
from app.core.auth import require_role, get_current_user
from app.models.user import UserRole
from app.models.user import User
from app.models import ClientComment
import traceback
from app.dependencies import get_current_active_user
from sqlalchemy.future import select

router = APIRouter(prefix="/clients", tags=["clients"])

@router.post("/", response_model=UserRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff))])
async def create(user_in: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для store_admin устанавливаем store_id из его профиля
    if current_user.role == UserRole.store_admin:
        user_in.store_id = current_user.store_id
    return await create_client(db, user_in)

@router.get("/", response_model=List[UserRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Для superadmin показываем все данные, для остальных только их магазин
        store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
        clients = await get_clients(db, skip, limit, store_id)
        return clients
    except Exception as e:
        print(f"Error in read_all clients: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff, UserRole.viewer))])
async def read_one(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Получаем клиента
        user = await get_user(db, user_id)
        if not user or user.role != UserRole.client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Проверяем права доступа
        if current_user.role != UserRole.superadmin and user.store_id != current_user.store_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in read_one client: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{user_id}", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def delete(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin разрешаем удалять все, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    success = await delete_client(db, user_id, store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}

@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def update(user_id: int, user_in: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Для superadmin разрешаем редактировать все, для остальных только их магазин
    store_id = None if current_user.role == UserRole.superadmin else current_user.store_id
    user = await update_user(db, user_id, user_in.dict(exclude_unset=True), store_id)
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")
    return user 

@router.get("/{client_id}/comments")
async def get_client_comments(client_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    result = await db.execute(
        select(ClientComment).where(ClientComment.client_id == client_id).order_by(ClientComment.created_at.desc())
    )
    comments = result.scalars().all()
    # Получаем id всех авторов
    author_ids = list({c.author_id for c in comments})
    authors = {}
    if author_ids:
        users_result = await db.execute(select(User.id, User.full_name).where(User.id.in_(author_ids)))
        authors = {row.id: row.full_name for row in users_result.all()}
    # Добавляем author_full_name к каждому комментарию
    comments_with_names = []
    for c in comments:
        item = c.__dict__.copy()
        item['author_full_name'] = authors.get(c.author_id)
        comments_with_names.append(item)
    return comments_with_names

@router.post("/{client_id}/comments", response_model=ClientCommentRead)
async def add_client_comment(client_id: int, comment: ClientCommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    db_comment = ClientComment(
        client_id=client_id,
        author_id=user.id,
        text=comment.text
    )
    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment)
    return db_comment

@router.delete("/{client_id}/comments/{comment_id}")
async def delete_client_comment(client_id: int, comment_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_active_user)):
    result = await db.execute(
        select(ClientComment).where(ClientComment.id == comment_id, ClientComment.client_id == client_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")
    if comment.author_id != user.id and user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    await db.delete(comment)
    await db.commit()
    return {"ok": True} 