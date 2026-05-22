from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    event_status = postgresql.ENUM("upcoming", "cancelled", "completed", name="event_status")
    list_status = postgresql.ENUM("confirmed", "waitlist", name="list_status")
    player_position = postgresql.ENUM("GK", "DEF", "MID", "ATT", name="player_position")
    event_status.create(op.get_bind(), checkfirst=True)
    list_status.create(op.get_bind(), checkfirst=True)
    player_position.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "venues",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("address", sa.String(255)),
        sa.Column("default_day", sa.SmallInteger()),
        sa.Column("default_time", sa.Time()),
        sa.Column("players_per_side", sa.Integer(), nullable=False),
        sa.Column("max_players", sa.Integer(), nullable=False),
    )
    op.create_table(
        "players",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("photo_url", sa.String(500)),
        sa.Column("skill_rating", sa.SmallInteger(), nullable=False, server_default="5"),
        sa.Column("primary_position", player_position, nullable=False, server_default="MID"),
        sa.Column("attributes", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "events",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("venue_id", sa.UUID(), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False, unique=True),
        sa.Column("event_time", sa.Time(), nullable=False),
        sa.Column("max_players", sa.Integer(), nullable=False),
        sa.Column("created_by_name", sa.String(255), nullable=False),
        sa.Column("status", event_status, nullable=False, server_default="upcoming"),
        sa.Column("teams_generated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("teams_locked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "registrations",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("event_id", sa.UUID(), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("player_id", sa.UUID(), sa.ForeignKey("players.id")),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("list_status", list_status, nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("has_paid", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("paid_at", sa.DateTime(timezone=True)),
        sa.Column("registered_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("event_id", "display_name"),
    )
    op.create_table(
        "teams",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("event_id", sa.UUID(), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("label", sa.String(50), nullable=False),
        sa.Column("color", sa.String(30), nullable=False),
        sa.Column("formation", sa.String(10)),
    )
    op.create_table(
        "team_players",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("team_id", sa.UUID(), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("player_id", sa.UUID(), sa.ForeignKey("players.id")),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("position_role", player_position, nullable=False),
        sa.Column("pitch_x", sa.Numeric(5, 2)),
        sa.Column("pitch_y", sa.Numeric(5, 2)),
    )


def downgrade() -> None:
    for table in ("team_players", "teams", "registrations", "events", "players", "venues"):
        op.drop_table(table)
    for enum_name in ("player_position", "list_status", "event_status"):
        postgresql.ENUM(name=enum_name).drop(op.get_bind())
