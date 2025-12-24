from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.post import PostStatus
from app.schemas.tag import TagResponse


class PostCreate(BaseModel):
    """Schema for creating a new post."""

    title: str = Field(..., min_length=1, max_length=200)
    content: str | None = Field(None, max_length=50000)
    status: PostStatus = PostStatus.DRAFT
    tags: list[str] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        """Validate that title is not empty or whitespace only."""
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip()


class PostUpdate(BaseModel):
    """Schema for updating an existing post."""

    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, max_length=50000)
    status: PostStatus | None = None
    tags: list[str] | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str | None) -> str | None:
        """Validate that title is not empty or whitespace only."""
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip() if v else v


class PostResponse(BaseModel):
    """Full response schema for a single post."""

    id: UUID
    title: str
    slug: str
    content: str | None
    status: PostStatus
    created_at: datetime
    updated_at: datetime | None
    published_at: datetime | None
    tags: list[TagResponse]

    model_config = {"from_attributes": True}


class PostListItem(BaseModel):
    """Schema for a post in the list view."""

    id: UUID
    title: str
    slug: str
    status: PostStatus
    created_at: datetime
    excerpt: str | None
    tags: list[TagResponse]

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    """Paginated response schema for post list."""

    items: list[PostListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
