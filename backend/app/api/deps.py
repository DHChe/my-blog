from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_current_admin(
    x_api_key: Annotated[str | None, Header()] = None,
) -> bool:
    """Verify admin API key for protected endpoints."""
    if x_api_key is None or x_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return True


# Type aliases for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]
AdminAuth = Annotated[bool, Depends(get_current_admin)]
