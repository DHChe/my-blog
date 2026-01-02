"""TIL schemas for request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.tag import TagResponse


class TILBase(BaseModel):
    """Base schema for TIL data."""

    title: str = Field(..., min_length=1, max_length=200)
    day_number: int = Field(..., ge=1, description="Bootcamp day number (e.g., 15)")
    excerpt: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1, description="Markdown content")


class TILCreate(TILBase):
    """Schema for creating a TIL."""

    tag_ids: list[UUID] = Field(default_factory=list, description="Tag IDs to link")
    is_published: bool = False


class TILUpdate(BaseModel):
    """Schema for updating a TIL (all fields optional)."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    day_number: Optional[int] = Field(None, ge=1)
    excerpt: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1)
    tag_ids: Optional[list[UUID]] = None
    is_published: Optional[bool] = None


class TILResponse(TILBase):
    """Schema for TIL response."""

    id: UUID
    slug: str
    is_published: bool
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse]

    model_config = {"from_attributes": True}


class TILListResponse(BaseModel):
    """Schema for paginated TIL list response."""

    items: list[TILResponse]
    total: int
    page: int
    size: int
    pages: int
