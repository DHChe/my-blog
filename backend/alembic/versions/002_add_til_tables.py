"""Add TIL tables and til_tags association table

Revision ID: 002
Revises: 001
Create Date: 2025-12-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tils table
    op.create_table(
        "tils",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.Column("excerpt", sa.String(length=500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False, default=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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

    # Create indexes for tils
    op.create_index("idx_tils_slug", "tils", ["slug"], unique=True)
    op.create_index("idx_tils_day_number", "tils", ["day_number"], unique=False)
    op.create_index("idx_tils_is_published", "tils", ["is_published"], unique=False)

    # Create til_tags association table
    op.create_table(
        "til_tags",
        sa.Column("til_id", sa.UUID(), nullable=False),
        sa.Column("tag_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["til_id"],
            ["tils.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["tags.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("til_id", "tag_id"),
    )

    # Create indexes for til_tags
    op.create_index("idx_til_tags_til_id", "til_tags", ["til_id"], unique=False)
    op.create_index("idx_til_tags_tag_id", "til_tags", ["tag_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_til_tags_tag_id", table_name="til_tags")
    op.drop_index("idx_til_tags_til_id", table_name="til_tags")
    op.drop_table("til_tags")

    op.drop_index("idx_tils_is_published", table_name="tils")
    op.drop_index("idx_tils_day_number", table_name="tils")
    op.drop_index("idx_tils_slug", table_name="tils")
    op.drop_table("tils")
