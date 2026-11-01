"""Add the post-match total cost to events

Some venues (Fame Sport) accept Multisport cards, which lower the pitch bill by
a different amount every week, so the price can't be fixed in advance the way it
is at Parkowa. The organiser enters the amount actually paid after full time and
the per-person price is derived from it. `cost_set_at` records when that
happened, which is what the WhatsApp payment request is scheduled from.

Both columns are nullable: events with a fixed `price_per_person` never use them.

Revision ID: 0018_event_total_cost
Revises: 0017_backfill_passing_default
Create Date: 2026-11-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0018_event_total_cost"
down_revision = "0017_backfill_passing_default"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("total_cost", sa.Numeric(8, 2), nullable=True))
    op.add_column("events", sa.Column("cost_set_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "cost_set_at")
    op.drop_column("events", "total_cost")
