"""Initial schema for tags

Revision ID: 001
Revises:
Create Date: 2025-12-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index("idx_tags_slug", table_name="tags")
    op.drop_index("idx_tags_name", table_name="tags")
    op.drop_table("tags")
