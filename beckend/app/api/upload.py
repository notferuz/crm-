from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import shutil
from pathlib import Path
from app.core.auth import require_role
from app.schemas.user import UserRole

router = APIRouter(prefix="/upload", tags=["upload"])

# Создаем папку для загруженных файлов
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/image", dependencies=[Depends(require_role(UserRole.store_admin, UserRole.superadmin, UserRole.staff))])
async def upload_image(file: UploadFile = File(...)):
    """Загружает изображение и возвращает путь к файлу"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")
    
    # Создаем уникальное имя файла
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{os.urandom(16).hex()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": unique_filename, "url": f"/upload/image/{unique_filename}"}

@router.get("/image/{filename}")
async def get_image(filename: str):
    """Возвращает изображение по имени файла"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path) 