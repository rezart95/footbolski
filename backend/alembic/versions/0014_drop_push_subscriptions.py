"""Drop push_subscriptions — the push-notification channel is removed.

WhatsApp is the only proactive channel left. `ReminderChannel.PUSH` stays in
the Python enum (unchanged, no migration needed for it) so historical
`reminders` rows with channel='push' still read back correctly; only the
subscription table itself, which held no historical value, is dropped.

Revision ID: 0014_drop_push_subscriptions
Revises: 0013_ladder_and_motm
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0014_drop_push_subscriptions"
down_revision: Union[str, None] = "0013_ladder_and_motm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(op.f("ix_push_subscriptions_player_id"), table_name="push_subscriptions")
    op.drop_table("push_subscriptions")


def downgrade() -> None:
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("player_id", sa.UUID(), autoincrement=False, nullable=False),
        sa.Column("endpoint", sa.VARCHAR(length=2048), autoincrement=False, nullable=False),
        sa.Column("p256dh", sa.VARCHAR(length=255), autoincrement=False, nullable=False),
        sa.Column("auth", sa.VARCHAR(length=255), autoincrement=False, nullable=False),
        sa.Column("user_agent", sa.VARCHAR(length=500), autoincrement=False, nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("last_used_at", postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(
            ["player_id"], ["players.id"], name=op.f("push_subscriptions_player_id_fkey"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("push_subscriptions_pkey")),
        sa.UniqueConstraint("endpoint", name=op.f("push_subscriptions_endpoint_key")),
    )
    op.create_index(op.f("ix_push_subscriptions_player_id"), "push_subscriptions", ["player_id"], unique=False)
