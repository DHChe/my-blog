"""Book and BookNote schemas for request/response validation."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.tag import TagResponse


# ============ Book Schemas ============


class BookBase(BaseModel):
    """Base schema for Book data."""

    title: str = Field(..., min_length=1, max_length=300)
    author: str = Field(..., min_length=1, max_length=200)
    total_chapters: int = Field(1, ge=1, description="Total number of chapters")


class BookCreate(BookBase):
    """Schema for creating a Book."""

    cover_image: Optional[str] = Field(None, max_length=500)
    status: str = Field("reading", pattern="^(reading|completed|on_hold)$")
    start_date: Optional[date] = None


class BookUpdate(BaseModel):
    """Schema for updating a Book (all fields optional)."""

    title: Optional[str] = Field(None, min_length=1, max_length=300)
    author: Optional[str] = Field(None, min_length=1, max_length=200)
    cover_image: Optional[str] = Field(None, max_length=500)
    total_chapters: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, pattern="^(reading|completed|on_hold)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class BookResponse(BookBase):
    """Schema for Book response."""

    id: UUID
    slug: str
    cover_image: Optional[str]
    status: str
    start_date: date
    end_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    notes_count: int = 0  # Computed field
    progress: float = 0.0  # Computed field (percentage)

    model_config = {"from_attributes": True}


class BookListResponse(BaseModel):
    """Schema for paginated Book list response."""

    items: list[BookResponse]
    total: int
    page: int
    size: int
    pages: int


# ============ BookNote Schemas ============


class BookNoteBase(BaseModel):
    """Base schema for BookNote data."""

    chapter_title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1, description="Markdown content")


class BookNoteCreate(BookNoteBase):
    """Schema for creating a BookNote."""

    chapter_number: Optional[int] = Field(None, ge=1)
    pages: Optional[str] = Field(None, max_length=50)
    key_takeaways: list[str] = Field(default_factory=list)
    questions: Optional[str] = None
    reading_date: Optional[date] = None
    tag_ids: list[UUID] = Field(default_factory=list, description="Tag IDs to link")
    is_published: bool = False


class BookNoteUpdate(BaseModel):
    """Schema for updating a BookNote (all fields optional)."""

    chapter_number: Optional[int] = Field(None, ge=1)
    chapter_title: Optional[str] = Field(None, min_length=1, max_length=300)
    pages: Optional[str] = Field(None, max_length=50)
    content: Optional[str] = Field(None, min_length=1)
    key_takeaways: Optional[list[str]] = None
    questions: Optional[str] = None
    ai_summary: Optional[str] = Field(None, max_length=500)
    reading_date: Optional[date] = None
    tag_ids: Optional[list[UUID]] = None
    is_published: Optional[bool] = None


class BookNoteResponse(BookNoteBase):
    """Schema for BookNote response."""

    id: UUID
    book_id: UUID
    slug: str
    chapter_number: Optional[int]
    pages: Optional[str]
    key_takeaways: Optional[list[str]]
    questions: Optional[str]
    ai_summary: Optional[str]
    reading_date: date
    is_published: bool
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse]

    model_config = {"from_attributes": True}


class BookNoteListResponse(BaseModel):
    """Schema for paginated BookNote list response."""

    items: list[BookNoteResponse]
    total: int
    page: int
    size: int
    pages: int


# ============ Book with Notes ============


class BookWithNotesResponse(BookResponse):
    """Book response with notes included."""

    notes: list[BookNoteResponse] = []


# ============ Reading Stats ============


class ReadingStatsResponse(BaseModel):
    """Schema for reading statistics."""

    total_books: int
    reading_books: int
    completed_books: int
    total_notes: int
    notes_this_month: int
