#!/usr/bin/env python3
"""
Script to fix user store_id
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.store import Store
from sqlalchemy import select

async def fix_user_store():
    async with AsyncSessionLocal() as session:
        # Найти пользователя
        result = await session.execute(
            select(User).where(User.email == "sarikvarik@gmail.com")
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ Пользователь sarikvarik@gmail.com не найден")
            return
        
        print(f"✅ Найден пользователь: {user.email}, роль: {user.role}")
        
        # Найти магазин
        result = await session.execute(
            select(Store).where(Store.email == "central@vertica.com")
        )
        store = result.scalar_one_or_none()
        
        if not store:
            # Создать магазин если его нет
            store_data = {
                "name": "Vertica Studio - Центральный офис",
                "address": "ул. Тверская, 1, Москва",
                "phone": "+7 (495) 123-45-67",
                "email": "central@vertica.com",
                "is_active": True
            }
            store = Store(**store_data)
            session.add(store)
            await session.commit()
            await session.refresh(store)
            print("✅ Создан магазин: Vertica Studio - Центральный офис")
        else:
            print(f"✅ Найден магазин: {store.name}")
        
        # Привязать пользователя к магазину
        user.store_id = store.id
        await session.commit()
        print(f"✅ Пользователь {user.email} привязан к магазину {store.name} (ID: {store.id})")

if __name__ == "__main__":
    asyncio.run(fix_user_store()) 