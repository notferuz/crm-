# CRM аренды техники (Backend)

## Стек
- FastAPI
- PostgreSQL
- SQLAlchemy (async)
- Alembic
- JWT

## Запуск

1. Установить зависимости:
   ```bash
   pip install -r requirements.txt
   ```
2. Настроить переменные окружения (см. пример ниже)
3. Запустить сервер:
   ```bash
   uvicorn app.main:app --reload
   ```

## Структура папок
- `app/` — основной код приложения
- `alembic/` — миграции

## Пример .env
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
``` 