"""Extend the reminders audit trail and index every foreign key.

Two unrelated-looking changes that share a migration because both are pure
groundwork for the invite ladder:

1. `reminders` gains `kind`, `provider_message_id`, `delivered_at` and `read_at`,
   and `registration_id` becomes nullable. Invites are sent to players who have
   no registration yet, so a NOT NULL registration_id makes the one thing we most
   need to audit impossible to record. Delivery receipts arrive keyed only by the
   provider's message id, so without that column a receipt cannot be matched to a row.

2. The database had **zero** foreign-key indexes. Postgres does not create them
   automatically, so every join and every ON DELETE CASCADE was a sequential scan.

Idempotent throughout, matching the convention in 0005/0008/0009.

Revision ID: 0011_reminder_audit_fks
Revises: 0010_active_creator_date
"""

import sqlalchemy as sa
from alembic import op

revision = "0011_reminder_audit_fks"
down_revision = "0010_active_creator_date"
branch_labels = None
depends_on = None

# (table, columns, index name) for every FK that lacked a leading-column index.
# registrations.event_id is deliberately absent: it is already the leading column
# of registrations_event_id_display_name_key.
FK_INDEXES = [
    ("events", "venue_id", "ix_events_venue_id"),
    ("push_subscriptions", "player_id", "ix_push_subscriptions_player_id"),
    ("registrations", "player_id", "ix_registrations_player_id"),
    ("reminders", "event_id", "ix_reminders_event_id"),
    ("reminders", "player_id", "ix_reminders_player_id"),
    ("reminders", "registration_id", "ix_reminders_registration_id"),
    ("team_players", "player_id", "ix_team_players_player_id"),
    ("team_players", "team_id", "ix_team_players_team_id"),
    ("teams", "event_id", "ix_teams_event_id"),
]


def _existing_columns(table: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade() -> None:
    # --- 1. reminders audit trail -------------------------------------------
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE reminder_kind AS ENUM ('manual','invite','payment','motm','promotion'); "
        "EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    # WhatsApp joins the existing channel enum.
    op.execute("ALTER TYPE reminder_channel ADD VALUE IF NOT EXISTS 'whatsapp'")

    reminder_columns = _existing_columns("reminders")
    if "kind" not in reminder_columns:
        op.execute(
            "ALTER TABLE reminders ADD COLUMN kind reminder_kind NOT NULL DEFAULT 'manual'"
        )
    if "provider_message_id" not in reminder_columns:
        op.add_column("reminders", sa.Column("provider_message_id", sa.String(128), nullable=True))
    if "delivered_at" not in reminder_columns:
        op.add_column("reminders", sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
    if "read_at" not in reminder_columns:
        op.add_column("reminders", sa.Column("read_at", sa.DateTime(timezone=True), nullable=True))

    # Invites have no registration yet — see the module docstring.
    op.execute("ALTER TABLE reminders ALTER COLUMN registration_id DROP NOT NULL")

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_reminders_provider_message_id "
        "ON reminders (provider_message_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_reminders_event_player ON reminders (event_id, player_id)"
    )

    # --- 2. foreign-key indexes ---------------------------------------------
    for table, column, index_name in FK_INDEXES:
        op.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({column})")


def downgrade() -> None:
    for _table, _column, index_name in FK_INDEXES:
        op.execute(f"DROP INDEX IF EXISTS {index_name}")
    op.execute("DROP INDEX IF EXISTS ix_reminders_event_player")
    op.execute("DROP INDEX IF EXISTS ix_reminders_provider_message_id")

    # Restoring NOT NULL would fail against any invite rows; drop them first.
    op.execute("DELETE FROM reminders WHERE registration_id IS NULL")
    op.execute("ALTER TABLE reminders ALTER COLUMN registration_id SET NOT NULL")

    for column in ("read_at", "delivered_at", "provider_message_id", "kind"):
        op.execute(f"ALTER TABLE reminders DROP COLUMN IF EXISTS {column}")
    op.execute("DROP TYPE IF EXISTS reminder_kind")
    # reminder_channel keeps 'whatsapp': Postgres cannot remove an enum value.
