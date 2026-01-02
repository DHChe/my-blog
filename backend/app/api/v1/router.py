from fastapi import APIRouter

from app.api.v1.endpoints import books, generate, tags, tils

api_router = APIRouter()

api_router.include_router(books.router)
api_router.include_router(tags.router)
api_router.include_router(tils.router)
api_router.include_router(generate.router)
