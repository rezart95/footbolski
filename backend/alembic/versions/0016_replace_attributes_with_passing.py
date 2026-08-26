"""Drop player style-label attributes, add passing rating

The eight free-text style tags (fast, playmaker, physical, leader,
goalkeeper, creative, defensive, clinical) were never used by the
AI team-splitter as anything but loosely-defined flavor text, and
duplicated information the numeric ratings already capture better.
Passing is a numeric rating in the same spirit as the existing
speed/technique/defending/shooting/aerial/stamina/work_rate columns,
and gives the AI splitter a real signal for playmaking ability instead
of a "playmaker" tag it could not weigh.

Revision ID: 0016_replace_attributes_with_passing
Revises: 0015_motm_result_kind
Create Date: 2026-08-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0016_replace_attributes_with_passing"
down_revision = "0015_motm_result_kind"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("players", sa.Column("passing", sa.SmallInteger(), nullable=True))
    op.drop_column("players", "attributes")


def downgrade() -> None:
    op.add_column(
        "players",
        sa.Column("attributes", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )
    op.drop_column("players", "passing")