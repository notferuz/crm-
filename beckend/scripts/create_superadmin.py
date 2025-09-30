import asyncio
import os

from dotenv import load_dotenv

from app.db.session import AsyncSessionLocal, create_tables
from app.crud.user import create_user, get_user_by_email
from app.schemas.user import UserCreate
from app.models.user import UserRole


async def ensure_superadmin(email: str, password: str, full_name: str | None = None) -> None:
    async with AsyncSessionLocal() as session:
        existing = await get_user_by_email(session, email)
        if existing:
            print(f"User already exists: {email} (role={existing.role})")
            return

        user_in = UserCreate(
            email=email,
            password=password,
            full_name=full_name or "Super Admin",
            role=UserRole.superadmin,  # type: ignore[arg-type]
            is_active=True,
        )
        user = await create_user(session, user_in, role=UserRole.superadmin)
        print(f"Superadmin created: id={user.id} email={user.email}")


async def main() -> None:
    load_dotenv()

    # Make sure tables exist (idempotent)
    await create_tables()

    email = os.getenv("SUPERADMIN_EMAIL", "admin@example.com")
    password = os.getenv("SUPERADMIN_PASSWORD", "admin12345")
    full_name = os.getenv("SUPERADMIN_NAME", "Super Admin")

    await ensure_superadmin(email=email, password=password, full_name=full_name)


if __name__ == "__main__":
    asyncio.run(main())


