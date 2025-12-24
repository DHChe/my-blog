from fastapi import APIRouter

from app.api.v1.endpoints import posts, tags

api_router = APIRouter()

api_router.include_router(posts.router)
api_router.include_router(tags.router)
