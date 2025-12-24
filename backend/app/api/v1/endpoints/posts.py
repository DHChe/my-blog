import math
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminAuth, DbSession
from app.crud import create_post, delete_post, get_post_by_slug, get_posts, update_post
from app.models import PostStatus
from app.schemas import PostCreate, PostListResponse, PostResponse, PostUpdate

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=PostListResponse)
async def list_posts(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    status: PostStatus | None = None,
    tag: str | None = None,
) -> PostListResponse:
    """Get paginated list of published blog posts.

    Args:
        db: Database session.
        page: Page number (1-indexed).
        page_size: Number of items per page.
        status: Filter by post status (admin only).
        tag: Filter by tag slug.

    Returns:
        Paginated list of posts.
    """
    items, total = await get_posts(
        db,
        page=page,
        page_size=page_size,
        status=status,
        tag_slug=tag,
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return PostListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{slug}", response_model=PostResponse)
async def get_post(
    db: DbSession,
    slug: str,
) -> PostResponse:
    """Get a single post by its slug.

    Args:
        db: Database session.
        slug: Post URL slug.

    Returns:
        Post details.

    Raises:
        HTTPException: If post not found.
    """
    post = await get_post_by_slug(db, slug)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    return PostResponse.model_validate(post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_new_post(
    db: DbSession,
    _: AdminAuth,
    post_data: PostCreate,
) -> PostResponse:
    """Create a new blog post.

    Requires admin authentication.

    Args:
        db: Database session.
        post_data: Post creation data.

    Returns:
        Created post.
    """
    post = await create_post(db, post_data)
    return PostResponse.model_validate(post)


@router.put("/{slug}", response_model=PostResponse)
async def update_existing_post(
    db: DbSession,
    _: AdminAuth,
    slug: str,
    post_data: PostUpdate,
) -> PostResponse:
    """Update an existing blog post.

    Requires admin authentication.

    Args:
        db: Database session.
        slug: Post URL slug.
        post_data: Update data.

    Returns:
        Updated post.

    Raises:
        HTTPException: If post not found.
    """
    post = await get_post_by_slug(db, slug, include_drafts=True)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    updated_post = await update_post(db, post, post_data)
    return PostResponse.model_validate(updated_post)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_post(
    db: DbSession,
    _: AdminAuth,
    slug: str,
) -> None:
    """Delete a blog post.

    Requires admin authentication.

    Args:
        db: Database session.
        slug: Post URL slug.

    Raises:
        HTTPException: If post not found.
    """
    post = await get_post_by_slug(db, slug, include_drafts=True)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    await delete_post(db, post.id)
