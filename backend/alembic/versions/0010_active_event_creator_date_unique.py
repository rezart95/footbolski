"""Allow cancel-instead-of-delete by excluding cancelled events from the unique rule.

`uq_event_creator_date` was a plain UNIQUE (created_by_name, event_date), so once an
organiser cancelled an event they could not create another on the same date without
deleting the original — which destroys the registration history the fill-rate metrics
are measured from. A partial unique index enforces the same rule for live events only.

Revision ID: 0010_active_creator_date
Revises: 0009_event_payment_details
"""

from alembic import op

revision = "0010_active_creator_date"
down_revision = "0009_event_payment_details"
branch_labels = None
depends_on = None

INDEX_NAME = "uq_event_creator_date_active"


def upgrade() -> None:
    # Drop the old blanket constraint if it is still present.
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS uq_event_creator_date")
    # Partial unique index: cancelled events no longer occupy their creator's slot.
    op.execute(
        f"CREATE UNIQUE INDEX IF NOT EXISTS {INDEX_NAME} "
        "ON events (created_by_name, event_date) "
        "WHERE status <> 'cancelled'"
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {INDEX_NAME}")
    op.execute(
        "ALTER TABLE events ADD CONSTRAINT uq_event_creator_date UNIQUE (created_by_name, event_date)"
    )
