"""Add motm_result to reminder_kind — the MOTM winner announcement.

Revision ID: 0015_motm_result_kind
Revises: 0014_drop_push_subscriptions
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0015_motm_result_kind"
down_revision: Union[str, None] = "0014_drop_push_subscriptions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside the migration's normal
    # transaction on Postgres, hence the autocommit block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE reminder_kind ADD VALUE 'motm_result'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enums. Safe no-op: rebuilding the type
    # would require rewriting every dependent column, and downgrading past
    # this revision is only ever expected before any row uses the new value.
    pass
