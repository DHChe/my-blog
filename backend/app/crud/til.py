"""CRUD operations for TIL model."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Tag, TIL
from app.schemas.til import TILCreate, TILUpdate
from app.utils.slug import generate_slug


async def get_existing_slugs(db: AsyncSession) -> list[str]:
    """Get all existing TIL slugs.

    Args:
        db: Database session.

    Returns:
        List of existing slugs.
    """
    result = await db.execute(select(TIL.slug))
    return list(result.scalars().all())


async def get_tils(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 10,
    tag_slug: Optional[str] = None,
    is_published: Optional[bool] = None,
) -> tuple[list[TIL], int]:
    """Get TIL list with pagination and filtering.

    Args:
        db: Database session.
        skip: Number of items to skip.
        limit: Number of items to return.
        tag_slug: Filter by tag slug (optional).
        is_published: Filter by published status (optional).

    Returns:
        Tuple of (TIL list, total count).
    """
    query = select(TIL).options(selectinload(TIL.tags))
    count_query = select(func.count(TIL.id))

    # Filter by published status
    if is_published is not None:
        query = query.where(TIL.is_published == is_published)
        count_query = count_query.where(TIL.is_published == is_published)

    # Filter by tag
    if tag_slug:
        query = query.join(TIL.tags).where(Tag.slug == tag_slug)
        count_query = count_query.join(TIL.tags).where(Tag.slug == tag_slug)

    # Order by day_number descending (latest bootcamp day first)
    query = query.order_by(TIL.day_number.desc(), TIL.created_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    count_result = await db.execute(count_query)

    return list(result.scalars().unique().all()), count_result.scalar() or 0


async def get_til_by_id(db: AsyncSession, til_id: UUID) -> Optional[TIL]:
    """Get TIL by ID.

    Args:
        db: Database session.
        til_id: TIL ID.

    Returns:
        TIL object or None if not found.
    """
    result = await db.execute(
        select(TIL).options(selectinload(TIL.tags)).where(TIL.id == til_id)
    )
    return result.scalar_one_or_none()


async def get_til_by_slug(db: AsyncSession, slug: str) -> Optional[TIL]:
    """Get TIL by slug.

    Args:
        db: Database session.
        slug: TIL slug.

    Returns:
        TIL object or None if not found.
    """
    result = await db.execute(
        select(TIL).options(selectinload(TIL.tags)).where(TIL.slug == slug)
    )
    return result.scalar_one_or_none()


async def get_til_by_day_number(db: AsyncSession, day_number: int) -> Optional[TIL]:
    """Get TIL by day number.

    Args:
        db: Database session.
        day_number: Bootcamp day number.

    Returns:
        TIL object or None if not found.
    """
    result = await db.execute(
        select(TIL).options(selectinload(TIL.tags)).where(TIL.day_number == day_number)
    )
    return result.scalar_one_or_none()


async def create_til(db: AsyncSession, til_in: TILCreate) -> TIL:
    """Create a new TIL.

    Args:
        db: Database session.
        til_in: TIL creation data.

    Returns:
        Created TIL object.
    """
    # Generate unique slug
    existing_slugs = await get_existing_slugs(db)
    slug = generate_slug(til_in.title, existing_slugs)

    # Get tags
    tags: list[Tag] = []
    if til_in.tag_ids:
        result = await db.execute(select(Tag).where(Tag.id.in_(til_in.tag_ids)))
        tags = list(result.scalars().all())

    # Create TIL
    til = TIL(
        title=til_in.title,
        slug=slug,
        day_number=til_in.day_number,
        excerpt=til_in.excerpt,
        content=til_in.content,
        is_published=til_in.is_published,
        published_at=datetime.now(timezone.utc) if til_in.is_published else None,
        tags=tags,
    )

    db.add(til)
    await db.flush()
    await db.refresh(til, ["tags"])
    return til


async def update_til(db: AsyncSession, til: TIL, til_in: TILUpdate) -> TIL:
    """Update an existing TIL.

    Args:
        db: Database session.
        til: TIL object to update.
        til_in: TIL update data.

    Returns:
        Updated TIL object.
    """
    update_data = til_in.model_dump(exclude_unset=True)

    # Handle tag update
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        if tag_ids is not None:
            result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
            til.tags = list(result.scalars().all())

    # Handle publish status change
    if "is_published" in update_data:
        if update_data["is_published"] and not til.is_published:
            til.published_at = datetime.now(timezone.utc)
        elif not update_data["is_published"]:
            til.published_at = None

    # Update remaining fields
    for field, value in update_data.items():
        setattr(til, field, value)

    await db.flush()
    await db.refresh(til, ["tags"])
    return til


async def delete_til(db: AsyncSession, til: TIL) -> None:
    """Delete a TIL.

    Args:
        db: Database session.
        til: TIL object to delete.
    """
    await db.delete(til)
    await db.flush()


async def get_max_day_number(db: AsyncSession) -> Optional[int]:
    """Get the maximum day_number from existing TILs.

    Args:
        db: Database session.

    Returns:
        Maximum day_number or None if no TILs exist.
    """
    result = await db.execute(select(func.max(TIL.day_number)))
    return result.scalar()
