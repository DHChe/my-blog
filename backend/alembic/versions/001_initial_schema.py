"""Initial schema for posts and tags

Revision ID: 001
Revises:
Create Date: 2025-12-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create post_status enum
    post_status = postgresql.ENUM("draft", "published", name="post_status")
    post_status.create(op.get_bind())

    # Create posts table
    op.create_table(
        "posts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=250), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM("draft", "published", name="post_status", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("idx_posts_slug", "posts", ["slug"], unique=True)
    op.create_index("idx_posts_status_created", "posts", ["status", "created_at"])
    op.create_index("idx_posts_created_at", "posts", ["created_at"])

    # Create tags table
    op.create_table(
        "tags",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("slug", sa.String(length=60), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("idx_tags_name", "tags", ["name"], unique=True)
    op.create_index("idx_tags_slug", "tags", ["slug"], unique=True)

    # Create post_tags association table
    op.create_table(
        "post_tags",
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("tag_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("post_id", "tag_id"),
    )


def downgrade() -> None:
    op.drop_table("post_tags")
    op.drop_index("idx_tags_slug", table_name="tags")
    op.drop_index("idx_tags_name", table_name="tags")
    op.drop_table("tags")
    op.drop_index("idx_posts_created_at", table_name="posts")
    op.drop_index("idx_posts_status_created", table_name="posts")
    op.drop_index("idx_posts_slug", table_name="posts")
    op.drop_table("posts")

    # Drop enum
    post_status = postgresql.ENUM("draft", "published", name="post_status")
    post_status.drop(op.get_bind())
