#!/usr/bin/env python3
"""
Script to create test data for the equipment rental system
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.equipment import Equipment
from app.models.user import User, UserRole
from app.models.store import Store
from app.core.auth import get_password_hash
from sqlalchemy import select

async def create_test_data():
    async with AsyncSessionLocal() as session:
        # Create super admin
        superadmin_data = {
            "email": "superadmin@vertica.com",
            "hashed_password": get_password_hash("superadmin123"),
            "full_name": "Супер Администратор",
            "role": UserRole.superadmin,
            "is_active": True
        }
        
        result = await session.execute(
            select(User).where(User.email == superadmin_data["email"])
        )
        existing_superadmin = result.scalar_one_or_none()
        
        if not existing_superadmin:
            superadmin = User(**superadmin_data)
            session.add(superadmin)
            await session.commit()
            print("✅ Super admin created: superadmin@vertica.com / superadmin123")
        else:
            print("ℹ️ Super admin already exists")
        
        # Create test store
        store_data = {
            "name": "Vertica Studio - Центральный офис",
            "address": "ул. Тверская, 1, Москва",
            "phone": "+7 (495) 123-45-67",
            "email": "central@vertica.com",
            "is_active": True
        }
        
        result = await session.execute(
            select(Store).where(Store.email == store_data["email"])
        )
        existing_store = result.scalar_one_or_none()
        
        if not existing_store:
            store = Store(**store_data)
            session.add(store)
            await session.commit()
            await session.refresh(store)
            print("✅ Store created: Vertica Studio - Центральный офис")
        else:
            store = existing_store
            print("ℹ️ Store already exists")
        
        # Create store admin
        store_admin_data = {
            "email": "admin@vertica.com",
            "hashed_password": get_password_hash("admin123"),
            "full_name": "Администратор Магазина",
            "role": UserRole.store_admin,
            "store_id": store.id,
            "is_active": True
        }
        
        result = await session.execute(
            select(User).where(User.email == store_admin_data["email"])
        )
        existing_admin = result.scalar_one_or_none()
        
        if not existing_admin:
            store_admin = User(**store_admin_data)
            session.add(store_admin)
            await session.commit()
            print("✅ Store admin created: admin@vertica.com / admin123")
        else:
            print("ℹ️ Store admin already exists")
        
        # Create test categories with store_id
        categories_data = [
            {"name": "Камеры", "store_id": store.id},
            {"name": "Штативы", "store_id": store.id},
            {"name": "Объективы", "store_id": store.id},
            {"name": "Освещение", "store_id": store.id},
            {"name": "Аудио", "store_id": store.id},
        ]
        
        categories = []
        for cat_data in categories_data:
            # Check if category already exists
            result = await session.execute(
                select(Category).where(
                    Category.name == cat_data["name"],
                    Category.store_id == cat_data["store_id"]
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                category = Category(**cat_data)
                session.add(category)
                categories.append(category)
            else:
                categories.append(existing)
        
        await session.commit()
        
        # Refresh to get IDs
        for category in categories:
            await session.refresh(category)
        
        # Create test equipment
        equipment_data = [
            {
                "title": "Sony FX6 Full-Frame",
                "description": "Профессиональная кинокамера с полнокадровым сенсором",
                "category_id": categories[0].id,
                "store_id": store.id,
                "quantity_total": 3,
                "quantity_available": 2,
                "price_per_day": 150000,
                "status": "available"
            },
            {
                "title": "Canon EOS R5",
                "description": "Зеркальная камера с высоким разрешением",
                "category_id": categories[0].id,
                "store_id": store.id,
                "quantity_total": 5,
                "quantity_available": 4,
                "price_per_day": 80000,
                "status": "available"
            },
            {
                "title": "DJI RS 3 Pro",
                "description": "Стабилизатор для тяжелых камер",
                "category_id": categories[1].id,
                "store_id": store.id,
                "quantity_total": 2,
                "quantity_available": 1,
                "price_per_day": 45000,
                "status": "available"
            },
            {
                "title": "Manfrotto MT055",
                "description": "Профессиональный штатив",
                "category_id": categories[1].id,
                "store_id": store.id,
                "quantity_total": 4,
                "quantity_available": 3,
                "price_per_day": 25000,
                "status": "available"
            },
            {
                "title": "Canon RF 24-70mm f/2.8",
                "description": "Универсальный зум-объектив",
                "category_id": categories[2].id,
                "store_id": store.id,
                "quantity_total": 2,
                "quantity_available": 1,
                "price_per_day": 35000,
                "status": "rented"
            },
            {
                "title": "Sony FE 70-200mm f/2.8",
                "description": "Телеобъектив для спортивной съемки",
                "category_id": categories[2].id,
                "store_id": store.id,
                "quantity_total": 1,
                "quantity_available": 0,
                "price_per_day": 40000,
                "status": "rented"
            },
            {
                "title": "Aputure 600D Pro",
                "description": "Мощный LED светильник",
                "category_id": categories[3].id,
                "store_id": store.id,
                "quantity_total": 2,
                "quantity_available": 2,
                "price_per_day": 60000,
                "status": "available"
            },
            {
                "title": "Shure SM7B",
                "description": "Динамический микрофон для студийной записи",
                "category_id": categories[4].id,
                "store_id": store.id,
                "quantity_total": 3,
                "quantity_available": 2,
                "price_per_day": 20000,
                "status": "available"
            },
        ]
        
        for eq_data in equipment_data:
            # Check if equipment already exists
            result = await session.execute(
                select(Equipment).where(
                    Equipment.title == eq_data["title"],
                    Equipment.store_id == eq_data["store_id"]
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                equipment = Equipment(**eq_data)
                session.add(equipment)
        
        await session.commit()
        print("✅ Test data created successfully!")
        print(f"📁 Created {len(categories)} categories")
        print(f"📦 Created {len(equipment_data)} equipment items")
        print("\n🔑 Test accounts:")
        print("   Super Admin: superadmin@vertica.com / superadmin123")
        print("   Store Admin: admin@vertica.com / admin123")

if __name__ == "__main__":
    asyncio.run(create_test_data()) 