"""Add detailed player attributes

Revision ID: 0002_player_attributes
Revises: 0001_initial_schema
Create Date: 2026-05-25
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0002_player_attributes"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("players", sa.Column("age", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("height_cm", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("build", sa.String(50), nullable=True))
    op.add_column("players", sa.Column("preferred_role", sa.String(100), nullable=True))
    op.add_column("players", sa.Column("speed", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("technique", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("defending", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("shooting", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("aerial", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("stamina", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("work_rate", sa.SmallInteger(), nullable=True))
    op.add_column("players", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    for col in ("notes", "work_rate", "stamina", "aerial", "shooting",
                "defending", "technique", "speed", "preferred_role", "build",
                "height_cm", "age"):
        op.drop_column("players", col)
