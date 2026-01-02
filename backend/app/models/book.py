"""Book and BookNote models for reading records."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.tag import Tag


def _utc_now() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)



def _today() -> date:
    """Return current date."""
    return date.today()


# Many-to-many association table for BookNote and Tag
book_note_tag_association = Table(
    "book_note_tags",
    Base.metadata,
    Column(
        "book_note_id",
        Uuid,
        ForeignKey("book_notes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Book(Base):
    """Book model for tracking books being read."""

    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    author: Mapped[str] = mapped_column(String(200), nullable=False)
    cover_image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    total_chapters: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="reading"
    )  # reading, completed, on_hold
    start_date: Mapped[date] = mapped_column(Date, nullable=False, default=_today)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    slug: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        unique=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        onupdate=_utc_now,
    )

    # One-to-many relationship with BookNote
    notes: Mapped[list[BookNote]] = relationship(
        "BookNote",
        back_populates="book",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class BookNote(Base):
    """BookNote model for chapter/daily reading notes."""

    __tablename__ = "book_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chapter_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chapter_title: Mapped[str] = mapped_column(String(300), nullable=False)
    pages: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # e.g., "45-72"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    key_takeaways: Mapped[Optional[list]] = mapped_column(
        JSONB, nullable=True, default=list
    )  # Array of key points
    questions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # Short AI-generated summary
    reading_date: Mapped[date] = mapped_column(Date, nullable=False, default=_today)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    slug: Mapped[str] = mapped_column(
        String(340),
        nullable=False,
        unique=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utc_now,
        onupdate=_utc_now,
    )

    # Many-to-one relationship with Book
    book: Mapped[Book] = relationship("Book", back_populates="notes")

    # Many-to-many relationship with Tag
    tags: Mapped[list[Tag]] = relationship(
        "Tag",
        secondary=book_note_tag_association,
        lazy="selectin",
    )
