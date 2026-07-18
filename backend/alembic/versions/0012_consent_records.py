"""Add consent_records: evidence of terms acceptance.

Acceptance is stored per (person, terms version) rather than as a boolean, so
bumping the version re-prompts everyone and the record still shows exactly which
text each person agreed to. This is the lawful basis for messaging players
(design doc §5.12).

Revision ID: 0012_consent_records
Revises: 0011_reminder_audit_fks
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0012_consent_records"
down_revision = "0011_reminder_audit_fks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "consent_records" in inspector.get_table_names():
        return

    op.create_table(
        "consent_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("display_name_lower", sa.String(255), nullable=False),
        sa.Column(
            "player_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("players.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("terms_version", sa.String(32), nullable=False),
        sa.Column(
            "accepted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "uq_consent_name_version",
        "consent_records",
        ["display_name_lower", "terms_version"],
        unique=True,
    )
    op.create_index("ix_consent_records_player_id", "consent_records", ["player_id"])


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS consent_records")
