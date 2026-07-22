"""Groundwork for the invite ladder, payment reminders and Man of the Match.

Adds:
- players.phone_verified_at, opted_out_at, tier, preferred_language, nationality
- action_tokens, which doubles as the dispatch ledger. The unique constraint on
  (purpose, event_id, player_id) is what makes delivery exactly-once per
  recipient rather than per ladder rung.
- motm_votes, with one-vote-per-voter and no-self-vote enforced in the database
  so they hold even if a future caller forgets them.
- system_state, holding the scheduler heartbeat. Without it, a dead scheduler is
  indistinguishable from a quiet week.

Idempotent throughout.

Revision ID: 0013_ladder_and_motm
Revises: 0012_consent_records
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0013_ladder_and_motm"
down_revision = "0012_consent_records"
branch_labels = None
depends_on = None

PLAYER_COLUMNS = [
    ("phone_verified_at", sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True)),
    ("opted_out_at", sa.Column("opted_out_at", sa.DateTime(timezone=True), nullable=True)),
    (
        "tier",
        sa.Column("tier", sa.String(10), nullable=False, server_default="rest"),
    ),
    (
        "preferred_language",
        sa.Column("preferred_language", sa.String(5), nullable=False, server_default="en"),
    ),
    ("nationality", sa.Column("nationality", sa.String(2), nullable=True)),
]


def _table_names() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _column_names(table: str) -> set[str]:
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    existing = _column_names("players")
    for name, column in PLAYER_COLUMNS:
        if name not in existing:
            op.add_column("players", column)

    tables = _table_names()

    if "action_tokens" not in tables:
        op.create_table(
            "action_tokens",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("token", sa.String(64), nullable=False),
            sa.Column("purpose", sa.String(16), nullable=False),
            sa.Column(
                "event_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("events.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "player_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("players.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
            ),
            sa.UniqueConstraint("purpose", "event_id", "player_id", name="uq_action_token_dispatch"),
        )
        op.create_index("ix_action_tokens_token", "action_tokens", ["token"], unique=True)
        op.create_index("ix_action_tokens_event_id", "action_tokens", ["event_id"])
        op.create_index("ix_action_tokens_player_id", "action_tokens", ["player_id"])

    if "motm_votes" not in tables:
        op.create_table(
            "motm_votes",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "event_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("events.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "voter_player_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("players.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "nominee_player_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("players.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
            ),
            sa.UniqueConstraint("event_id", "voter_player_id", name="uq_motm_one_vote_per_voter"),
            sa.CheckConstraint("voter_player_id <> nominee_player_id", name="ck_motm_no_self_vote"),
        )
        op.create_index("ix_motm_votes_event_id", "motm_votes", ["event_id"])
        op.create_index("ix_motm_votes_nominee_player_id", "motm_votes", ["nominee_player_id"])

    if "system_state" not in tables:
        op.create_table(
            "system_state",
            sa.Column("key", sa.String(64), primary_key=True),
            sa.Column("value", sa.Text(), nullable=True),
            sa.Column(
                "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
            ),
        )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS system_state")
    op.execute("DROP TABLE IF EXISTS motm_votes")
    op.execute("DROP TABLE IF EXISTS action_tokens")
    for name, _column in PLAYER_COLUMNS:
        op.execute(f"ALTER TABLE players DROP COLUMN IF EXISTS {name}")
