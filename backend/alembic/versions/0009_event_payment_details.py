"""Add payment_details to events table (BLIK phone / Revolut username).

Revision ID: 0009_event_payment_details
Revises: 0008_event_payment_method
Create Date: 2026-07-03
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0009_event_payment_details"
down_revision = "0008_event_payment_method"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_cols = [c["name"] for c in inspector.get_columns("events")]

    if "payment_details" not in existing_cols:
        op.add_column("events", sa.Column("payment_details", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "payment_details")
