from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminAuth, DbSession
from app.crud import tag_crud
from app.schemas import TagCreate, TagResponse, TagUpdate

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagResponse])
async def list_tags(db: DbSession) -> list[TagResponse]:
    """Get all tags.

    Args:
        db: Database session.

    Returns:
        List of all tags sorted alphabetically.
    """
    tags = await tag_crud.get_tags(db)
    return [TagResponse.model_validate(tag) for tag in tags]


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    db: DbSession,
    _: AdminAuth,
    tag_in: TagCreate,
) -> TagResponse:
    """Create a new tag (admin only).

    - Automatically generates slug from name
    - Validates name uniqueness
    """
    try:
        tag = await tag_crud.create_tag(db, tag_in)
        return TagResponse.model_validate(tag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    db: DbSession,
    _: AdminAuth,
    tag_id: UUID,
    tag_in: TagUpdate,
) -> TagResponse:
    """Update a tag (admin only).

    - Validates name uniqueness if changed
    - Regenerates slug if name changed
    """
    tag = await tag_crud.get_tag_by_id(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    try:
        tag = await tag_crud.update_tag(db, tag, tag_in)
        return TagResponse.model_validate(tag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    db: DbSession,
    _: AdminAuth,
    tag_id: UUID,
) -> None:
    """Delete a tag (admin only).

    - TIL relationships are automatically handled by CASCADE delete
    """
    tag = await tag_crud.get_tag_by_id(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    await tag_crud.delete_tag(db, tag)
