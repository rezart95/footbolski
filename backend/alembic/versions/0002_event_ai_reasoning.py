from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON

revision = "0002_event_ai_reasoning"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("ai_reasoning", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("ai_swap_options", JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "ai_swap_options")
    op.drop_column("events", "ai_reasoning")
