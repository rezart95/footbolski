"""Add phone_number, push_subscriptions, and reminders tables.

Revision ID: 0005_notifications
Revises: 0004_event_ai_reasoning
Create Date: 2026-05-31
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql

revision = "0005_notifications"
down_revision = "0004_event_ai_reasoning"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    # Add phone_number column if not already there (partial previous run)
    existing_cols = [c["name"] for c in inspector.get_columns("players")]
    if "phone_number" not in existing_cols:
        op.add_column("players", sa.Column("phone_number", sa.String(32), nullable=True))

    reminder_channel = postgresql.ENUM("push", "sms", name="reminder_channel", create_type=False)
    reminder_status = postgresql.ENUM("sent", "failed", "skipped", name="reminder_status", create_type=False)
    postgresql.ENUM("push", "sms", name="reminder_channel").create(conn, checkfirst=True)
    postgresql.ENUM("sent", "failed", "skipped", name="reminder_status").create(conn, checkfirst=True)

    if not inspector.has_table("push_subscriptions"):
        op.create_table(
            "push_subscriptions",
            sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("player_id", sa.UUID(), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
            sa.Column("endpoint", sa.String(2048), nullable=False, unique=True),
            sa.Column("p256dh", sa.String(255), nullable=False),
            sa.Column("auth", sa.String(255), nullable=False),
            sa.Column("user_agent", sa.String(500)),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("last_used_at", sa.DateTime(timezone=True)),
        )
        op.create_index("ix_push_subscriptions_player_id", "push_subscriptions", ["player_id"])

    if not inspector.has_table("reminders"):
        op.create_table(
            "reminders",
            sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
            sa.Column("registration_id", sa.UUID(), sa.ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False),
            sa.Column("event_id", sa.UUID(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
            sa.Column("player_id", sa.UUID(), sa.ForeignKey("players.id", ondelete="SET NULL")),
            sa.Column("channel", reminder_channel, nullable=False),
            sa.Column("status", reminder_status, nullable=False),
            sa.Column("detail", sa.Text()),
            sa.Column("sent_by", sa.String(255)),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )
        op.create_index("ix_reminders_registration_id", "reminders", ["registration_id"])
        op.create_index("ix_reminders_event_id", "reminders", ["event_id"])


def downgrade() -> None:
    op.drop_index("ix_reminders_event_id", table_name="reminders")
    op.drop_index("ix_reminders_registration_id", table_name="reminders")
    op.drop_table("reminders")
    op.drop_index("ix_push_subscriptions_player_id", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    postgresql.ENUM(name="reminder_status").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="reminder_channel").drop(op.get_bind(), checkfirst=True)
    op.drop_column("players", "phone_number")
