"""Add books and book_notes tables

Revision ID: 003
Revises: 002
Create Date: 2025-12-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create books table
    op.create_table(
        "books",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("author", sa.String(length=200), nullable=False),
        sa.Column("cover_image", sa.String(length=500), nullable=True),
        sa.Column("total_chapters", sa.Integer(), nullable=False, default=1),
        sa.Column("status", sa.String(length=20), nullable=False, default="reading"),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("slug", sa.String(length=320), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for books
    op.create_index("idx_books_slug", "books", ["slug"], unique=True)
    op.create_index("idx_books_status", "books", ["status"], unique=False)

    # Create book_notes table
    op.create_table(
        "book_notes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("book_id", sa.UUID(), nullable=False),
        sa.Column("chapter_number", sa.Integer(), nullable=True),
        sa.Column("chapter_title", sa.String(length=300), nullable=False),
        sa.Column("pages", sa.String(length=50), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("key_takeaways", JSONB(), nullable=True),
        sa.Column("questions", sa.Text(), nullable=True),
        sa.Column("ai_summary", sa.String(length=500), nullable=True),
        sa.Column("reading_date", sa.Date(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False, default=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("slug", sa.String(length=340), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["book_id"],
            ["books.id"],
            ondelete="CASCADE",
        ),
    )

    # Create indexes for book_notes
    op.create_index("idx_book_notes_slug", "book_notes", ["slug"], unique=True)
    op.create_index("idx_book_notes_book_id", "book_notes", ["book_id"], unique=False)
    op.create_index(
        "idx_book_notes_is_published", "book_notes", ["is_published"], unique=False
    )

    # Create book_note_tags association table
    op.create_table(
        "book_note_tags",
        sa.Column("book_note_id", sa.UUID(), nullable=False),
        sa.Column("tag_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["book_note_id"],
            ["book_notes.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tags.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("book_note_id", "tag_id"),
    )

    # Create indexes for book_note_tags
    op.create_index(
        "idx_book_note_tags_book_note_id",
        "book_note_tags",
        ["book_note_id"],
        unique=False,
    )
    op.create_index(
        "idx_book_note_tags_tag_id", "book_note_tags", ["tag_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("idx_book_note_tags_tag_id", table_name="book_note_tags")
    op.drop_index("idx_book_note_tags_book_note_id", table_name="book_note_tags")
    op.drop_table("book_note_tags")

    op.drop_index("idx_book_notes_is_published", table_name="book_notes")
    op.drop_index("idx_book_notes_book_id", table_name="book_notes")
    op.drop_index("idx_book_notes_slug", table_name="book_notes")
    op.drop_table("book_notes")

    op.drop_index("idx_books_status", table_name="books")
    op.drop_index("idx_books_slug", table_name="books")
    op.drop_table("books")
