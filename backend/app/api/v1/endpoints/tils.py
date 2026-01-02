"""TIL API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminAuth, DbSession
from app.crud import til_crud
from app.schemas import TILCreate, TILListResponse, TILResponse, TILUpdate

router = APIRouter(prefix="/tils", tags=["tils"])


@router.get("", response_model=TILListResponse)
async def list_tils(
    db: DbSession,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    tag: Optional[str] = Query(None, description="Filter by tag slug"),
    published: Optional[bool] = Query(None, description="Filter by published status"),
) -> TILListResponse:
    """Get paginated TIL list.

    - Supports pagination with page and size parameters
    - Filter by tag slug
    - Filter by published status
    - Ordered by day_number descending (latest first)
    """
    skip = (page - 1) * size
    tils, total = await til_crud.get_tils(
        db,
        skip=skip,
        limit=size,
        tag_slug=tag,
        is_published=published,
    )

    pages = (total + size - 1) // size if total > 0 else 0

    return TILListResponse(
        items=[TILResponse.model_validate(til) for til in tils],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/day/{day_number}", response_model=TILResponse)
async def get_til_by_day(db: DbSession, day_number: int) -> TILResponse:
    """Get TIL by day number."""
    til = await til_crud.get_til_by_day_number(db, day_number)
    if not til:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TIL for day {day_number} not found",
        )
    return TILResponse.model_validate(til)


@router.get("/id/{til_id}", response_model=TILResponse)
async def get_til_by_id(
    db: DbSession,
    _: AdminAuth,
    til_id: UUID,
) -> TILResponse:
    """Get TIL by ID (admin only)."""
    til = await til_crud.get_til_by_id(db, til_id)
    if not til:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TIL not found",
        )
    return TILResponse.model_validate(til)


@router.get("/{slug}", response_model=TILResponse)
async def get_til(db: DbSession, slug: str) -> TILResponse:
    """Get TIL by slug."""
    til = await til_crud.get_til_by_slug(db, slug)
    if not til:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TIL not found",
        )
    return TILResponse.model_validate(til)


@router.post("", response_model=TILResponse, status_code=status.HTTP_201_CREATED)
async def create_til(
    db: DbSession,
    _: AdminAuth,
    til_in: TILCreate,
) -> TILResponse:
    """Create a new TIL (admin only).

    - Automatically generates slug from title
    - Sets published_at when is_published is True
    """
    # Check for duplicate day_number
    existing = await til_crud.get_til_by_day_number(db, til_in.day_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"TIL for day {til_in.day_number} already exists",
        )

    til = await til_crud.create_til(db, til_in)
    return TILResponse.model_validate(til)


@router.put("/{til_id}", response_model=TILResponse)
async def update_til(
    db: DbSession,
    _: AdminAuth,
    til_id: UUID,
    til_in: TILUpdate,
) -> TILResponse:
    """Update a TIL (admin only).

    - Validates day_number uniqueness if changed
    - Updates published_at when is_published changes
    """
    til = await til_crud.get_til_by_id(db, til_id)
    if not til:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TIL not found",
        )

    # Check for duplicate day_number if changing
    if til_in.day_number is not None and til_in.day_number != til.day_number:
        existing = await til_crud.get_til_by_day_number(db, til_in.day_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"TIL for day {til_in.day_number} already exists",
            )

    til = await til_crud.update_til(db, til, til_in)
    return TILResponse.model_validate(til)


@router.delete("/{til_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_til(
    db: DbSession,
    _: AdminAuth,
    til_id: UUID,
) -> None:
    """Delete a TIL (admin only)."""
    til = await til_crud.get_til_by_id(db, til_id)
    if not til:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="TIL not found",
        )
    await til_crud.delete_til(db, til)
