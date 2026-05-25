"""Add guest_profile JSONB to registrations

Revision ID: 0003_registration_guest_rating
Revises: 0002_player_attributes
Create Date: 2026-05-25
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003_registration_guest_rating"
down_revision = "0002_player_attributes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "registrations",
        sa.Column("guest_profile", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("registrations", "guest_profile")
