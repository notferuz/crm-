from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserRead, UserLogin, Token
from app.crud.user import get_user_by_email, create_user, verify_password
from app.core.auth import create_access_token, get_current_user
from app.db.session import get_db
from app.models.user import UserRole, User
from app.models.store import Store

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await create_user(db, user_in)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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