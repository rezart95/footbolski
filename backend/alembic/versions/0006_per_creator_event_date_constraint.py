"""Replace global event_date unique with per-creator unique

Revision ID: 0006_per_creator_event_date_constraint
Revises: 0005_notifications
Branch_labels: None
Depends_on: None
"""

from alembic import op

revision = "0006_creator_date_unique"
down_revision = "0005_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the old global unique constraint on event_date
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_date_key")
    # Add per-creator unique constraint: same creator cannot create two events on the same day
    op.execute(
        "ALTER TABLE events ADD CONSTRAINT uq_event_creator_date UNIQUE (created_by_name, event_date)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS uq_event_creator_date")
    op.execute("ALTER TABLE events ADD CONSTRAINT events_event_date_key UNIQUE (event_date)")
