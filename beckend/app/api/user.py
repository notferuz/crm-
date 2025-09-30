from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.crud.user import create_user, get_user, get_users, update_user, delete_user_by_id
from app.db.session import get_db
from app.core.auth import require_role, get_current_user
from app.models.user import UserRole, User
from app.models.store import Store

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserRead, dependencies=[Depends(require_role(UserRole.superadmin))])
async def create(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await create_user(db, user_in, role=user_in.role)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")

@router.post("/store-employee", response_model=UserRead, dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def create_store_employee(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Убеждаемся, что store_admin может создавать только staff для своего магазина
        if current_user.role == UserRole.store_admin:
            user_in.store_id = current_user.store_id
            user_in.role = UserRole.staff
        
        user = await create_user(db, user_in, role=user_in.role)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")

@router.get("/", response_model=List[UserRead], dependencies=[Depends(require_role(UserRole.superadmin))])
async def read_all(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await get_users(db, skip, limit)

@router.get("/store-employees", response_model=List[UserRead], dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def read_store_employees(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.crud.user import get_users_by_store
    store_id = current_user.store_id if current_user.role == UserRole.store_admin else None
    return await get_users_by_store(db, store_id)

@router.get("/{user_id}", response_model=UserRead)
async def read(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    store_name = None
    if user.store_id is not None:
        try:
            store_id_int = int(user.store_id)
            result = await db.execute(select(Store).where(Store.id == store_id_int))
            store = result.scalar_one_or_none()
            print(f"DEBUG: store_id={store_id_int}, store={store}")
            if store:
                store_name = store.name
        except Exception as e:
            print(f"Ошибка поиска магазина для пользователя {user.email}: {e}")
    return UserRead(
        **user.__dict__,
        store_name=store_name
    )

@router.patch("/{user_id}", response_model=UserRead)
async def update(user_id: int, user_in: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await update_user(db, user_id, user_in.dict(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    store_name = None
    if current_user.store_id is not None:
        try:
            store_id_int = int(current_user.store_id)
            result = await db.execute(select(Store).where(Store.id == store_id_int))
            store = result.scalar_one_or_none()
            if store:
                store_name = store.name
        except Exception as e:
            print(f"Ошибка поиска магазина для пользователя {current_user.email}: {e}")
    return UserRead(
        **current_user.__dict__,
        store_name=store_name
    )

@router.get("/auth/me", response_model=UserRead)
async def auth_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    store_name = None
    if current_user.store_id is not None:
        try:
            store_id_int = int(current_user.store_id)
            result = await db.execute(select(Store).where(Store.id == store_id_int))
            store = result.scalar_one_or_none()
            if store:
                store_name = store.name
        except Exception as e:
            print(f"Ошибка поиска магазина для пользователя {current_user.email}: {e}")
    # --- PATCH: always return all permissions for store_admin ---
    user_dict = dict(current_user.__dict__)
    if current_user.role == "store_admin":
        user_dict["permissions"] = {
            "dashboard": True,
            "equipment": True,
            "clients": True,
            "rentals": True
        }
    return UserRead(
        **user_dict,
        store_name=store_name
    ) 

@router.delete("/{user_id}", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin))])
async def delete_user_endpoint(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    store_scope = None if current_user.role == UserRole.superadmin else current_user.store_id
    ok = await delete_user_by_id(db, user_id, store_scope)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found or cannot delete")
    return {"ok": True}