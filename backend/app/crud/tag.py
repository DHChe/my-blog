from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag
from app.schemas.tag import TagCreate, TagUpdate
from app.utils.slug import generate_slug


async def get_existing_tag_slugs(db: AsyncSession) -> list[str]:
    """Get all existing tag slugs.

    Args:
        db: Database session.

    Returns:
        List of existing tag slugs.
    """
    result = await db.execute(select(Tag.slug))
    return list(result.scalars().all())


async def get_tags(db: AsyncSession) -> list[Tag]:
    """Get all tags sorted by name.

    Args:
        db: Database session.

    Returns:
        List of all tags.
    """
    result = await db.execute(select(Tag).order_by(Tag.name))
    return list(result.scalars().all())


async def get_tag_by_id(db: AsyncSession, tag_id: UUID) -> Optional[Tag]:
    """Get tag by ID.

    Args:
        db: Database session.
        tag_id: Tag ID.

    Returns:
        Tag object or None if not found.
    """
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    return result.scalar_one_or_none()


async def get_tag_by_slug(db: AsyncSession, slug: str) -> Optional[Tag]:
    """Get tag by slug.

    Args:
        db: Database session.
        slug: Tag slug.

    Returns:
        Tag object or None if not found.
    """
    result = await db.execute(select(Tag).where(Tag.slug == slug))
    return result.scalar_one_or_none()


async def create_tag(db: AsyncSession, tag_in: TagCreate) -> Tag:
    """Create a new tag.

    Args:
        db: Database session.
        tag_in: Tag creation data.

    Returns:
        Created Tag object.

    Raises:
        ValueError: If tag name already exists.
    """
    # Check for duplicate name
    existing_by_name = await db.execute(select(Tag).where(Tag.name == tag_in.name))
    if existing_by_name.scalar_one_or_none():
        raise ValueError(f"Tag with name '{tag_in.name}' already exists")

    # Generate unique slug
    existing_slugs = await get_existing_tag_slugs(db)
    slug = generate_slug(tag_in.name, existing_slugs)
    # Ensure slug doesn't exceed 60 characters (Tag model constraint)
    if len(slug) > 60:
        slug = slug[:60]

    # Create tag
    tag = Tag(name=tag_in.name, slug=slug)

    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    return tag


async def update_tag(db: AsyncSession, tag: Tag, tag_in: TagUpdate) -> Tag:
    """Update an existing tag.

    Args:
        db: Database session.
        tag: Tag object to update.
        tag_in: Tag update data.

    Returns:
        Updated Tag object.

    Raises:
        ValueError: If new tag name already exists.
    """
    update_data = tag_in.model_dump(exclude_unset=True)

    # Handle name update (and slug regeneration)
    if "name" in update_data:
        new_name = update_data["name"]
        # Check for duplicate name (excluding current tag)
        existing_by_name = await db.execute(
            select(Tag).where(Tag.name == new_name, Tag.id != tag.id)
        )
        if existing_by_name.scalar_one_or_none():
            raise ValueError(f"Tag with name '{new_name}' already exists")

        tag.name = new_name
        # Regenerate slug if name changed
        existing_slugs = await get_existing_tag_slugs(db)
        # Exclude current tag's slug from existing slugs
        existing_slugs = [s for s in existing_slugs if s != tag.slug]
        new_slug = generate_slug(new_name, existing_slugs)
        # Ensure slug doesn't exceed 60 characters
        if len(new_slug) > 60:
            new_slug = new_slug[:60]
        tag.slug = new_slug

    await db.flush()
    await db.refresh(tag)
    return tag


async def delete_tag(db: AsyncSession, tag: Tag) -> None:
    """Delete a tag.

    Args:
        db: Database session.
        tag: Tag object to delete.

    Note:
        TIL relationships are automatically handled by CASCADE delete.
    """
    await db.delete(tag)
    await db.flush()
