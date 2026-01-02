"""TIL (Today I Learned) model."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utc_now() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# Many-to-many association table for TIL and Tag
til_tag_association = Table(
    "til_tags",
    Base.metadata,
    Column(
        "til_id",
        Uuid,
        ForeignKey("tils.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class TIL(Base):
    """TIL (Today I Learned) model for bootcamp daily learning records."""

    __tablename__ = "tils"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(220),
        nullable=False,
        unique=True,
        index=True,
    )
    day_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    excerpt: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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

    # Many-to-many relationship with Tag
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary=til_tag_association,
        back_populates="tils",
        lazy="selectin",
    )


# Import Tag for type hints (avoid circular import at module level)
from app.models.tag import Tag  # noqa: E402, F401
