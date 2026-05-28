"""Add AI reasoning columns to events

Revision ID: 0004_event_ai_reasoning
Revises: 0003_registration_guest_rating
"""

from alembic import op

revision = "0004_event_ai_reasoning"
down_revision = "0003_registration_guest_rating"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use IF NOT EXISTS — columns may already exist if added via raw SQL
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_reasoning TEXT")
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS ai_swap_options JSONB")


def downgrade() -> None:
    op.execute("ALTER TABLE events DROP COLUMN IF EXISTS ai_swap_options")
    op.execute("ALTER TABLE events DROP COLUMN IF EXISTS ai_reasoning")
