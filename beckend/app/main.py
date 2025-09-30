from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.category import router as category_router
from app.api.equipment import router as equipment_router
from app.api.auth import router as auth_router
from app.api.client import router as client_router
from app.api.rental import router as rental_router
from app.api.dashboard import router as dashboard_router
from app.api.user import router as user_router
from app.api.equipment_movement import router as equipment_movement_router
from app.api.upload import router as upload_router
from app.api.store import router as store_router
from app.api import support_chat

app = FastAPI(title="CRM аренды техники")

# Добавляем CORS middleware с улучшенными настройками
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174", 
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["*"],
    max_age=86400,
)

# Подключаем статические файлы для загруженных изображений
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(category_router)
app.include_router(equipment_router)
app.include_router(auth_router)
app.include_router(client_router)
app.include_router(rental_router)
app.include_router(dashboard_router)
app.include_router(user_router)
app.include_router(equipment_movement_router)
app.include_router(upload_router)
app.include_router(store_router)
app.include_router(support_chat.router)

@app.get("/")
def root():
    return {"message": "Backend for Equipment Rental CRM is running!"} 