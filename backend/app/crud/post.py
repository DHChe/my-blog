from datetime import UTC, datetime
from typing import cast
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Post, PostStatus
from app.models.tag import Tag
from app.schemas.post import PostCreate, PostListItem, PostUpdate
from app.utils.slug import generate_slug


async def get_posts(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 10,
    status: PostStatus | None = None,
    tag_slug: str | None = None,
    include_drafts: bool = False,
) -> tuple[list[PostListItem], int]:
    """Get paginated list of posts.

    Args:
        db: Database session.
        page: Page number (1-indexed).
        page_size: Number of items per page.
        status: Filter by post status.
        tag_slug: Filter by tag slug.
        include_drafts: Include draft posts (for admin).

    Returns:
        Tuple of (list of posts, total count).
    """
    # Base query
    query = select(Post).options(selectinload(Post.tags))

    # Apply filters
    if not include_drafts:
        query = query.where(Post.status == PostStatus.PUBLISHED)
    elif status:
        query = query.where(Post.status == status)

    if tag_slug:
        query = query.join(Post.tags).where(Tag.slug == tag_slug)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply ordering and pagination
    query = query.order_by(Post.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    posts = result.scalars().unique().all()

    # Convert to list items with excerpt
    items = []
    for post in posts:
        excerpt = post.content[:200] if post.content else None
        item = PostListItem(
            id=post.id,
            title=post.title,
            slug=post.slug,
            status=post.status,
            created_at=post.created_at,
            excerpt=excerpt,
            tags=post.tags,
        )
        items.append(item)

    return items, total


async def get_post_by_slug(
    db: AsyncSession,
    slug: str,
    *,
    include_drafts: bool = False,
) -> Post | None:
    """Get a single post by its slug.

    Args:
        db: Database session.
        slug: Post URL slug.
        include_drafts: Include draft posts (for admin).

    Returns:
        Post if found, None otherwise.
    """
    query = select(Post).options(selectinload(Post.tags)).where(Post.slug == slug)

    if not include_drafts:
        query = query.where(Post.status == PostStatus.PUBLISHED)

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_post(
    db: AsyncSession,
    post_data: PostCreate,
) -> Post:
    """Create a new post.

    Args:
        db: Database session.
        post_data: Post creation data.

    Returns:
        Created post.
    """
    # Get existing slugs to ensure uniqueness
    result = await db.execute(select(Post.slug))
    existing_slugs = [row[0] for row in result.fetchall()]

    # Generate unique slug
    slug = generate_slug(post_data.title, existing_slugs)

    # Handle tags
    tags = []
    for tag_name in post_data.tags:
        # Check if tag exists
        result = await db.execute(select(Tag).where(Tag.name == tag_name))
        tag = cast(Tag | None, result.scalar_one_or_none())

        if not tag:
            # Create new tag
            tag_slug = generate_slug(tag_name)
            tag = Tag(name=tag_name, slug=tag_slug)
            db.add(tag)

        tags.append(tag)

    # Create post
    post = Post(
        title=post_data.title,
        slug=slug,
        content=post_data.content,
        status=post_data.status,
        tags=tags,
    )

    # Set published_at if publishing
    if post_data.status == PostStatus.PUBLISHED:
        post.published_at = datetime.now(UTC)

    db.add(post)
    await db.flush()
    await db.refresh(post)

    return post


async def update_post(
    db: AsyncSession,
    post: Post,
    post_data: PostUpdate,
) -> Post:
    """Update an existing post.

    Args:
        db: Database session.
        post: Post to update.
        post_data: Update data.

    Returns:
        Updated post.
    """
    update_data = post_data.model_dump(exclude_unset=True)

    # Handle status change
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == PostStatus.PUBLISHED and post.published_at is None:
            post.published_at = datetime.now(UTC)

    # Handle tags update
    if "tags" in update_data:
        tag_names = update_data.pop("tags")
        tags = []
        for tag_name in tag_names:
            result = await db.execute(select(Tag).where(Tag.name == tag_name))
            tag = cast(Tag | None, result.scalar_one_or_none())

            if not tag:
                tag_slug = generate_slug(tag_name)
                tag = Tag(name=tag_name, slug=tag_slug)
                db.add(tag)

            tags.append(tag)
        post.tags = tags

    # Update other fields
    for field, value in update_data.items():
        setattr(post, field, value)

    # SQLAlchemy will automatically set updated_at via onupdate
    await db.flush()
    await db.refresh(post)

    return post


async def delete_post(
    db: AsyncSession,
    post_id: UUID,
) -> bool:
    """Delete a post by its ID.

    Args:
        db: Database session.
        post_id: Post UUID.
    
    Returns:
        True if deleted, False if not found.
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        return False

    await db.delete(post)
    await db.flush()

    return True
