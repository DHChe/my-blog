from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag


async def get_tags(db: AsyncSession) -> list[Tag]:
    """Get all tags sorted by name.

    Args:
        db: Database session.

    Returns:
        List of all tags.
    """
    result = await db.execute(select(Tag).order_by(Tag.name))
    return list(result.scalars().all())
