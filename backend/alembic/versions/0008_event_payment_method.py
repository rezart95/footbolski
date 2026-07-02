"""Add payment_method to events table.

Revision ID: 0008_event_payment_method
Revises: 0007_event_payment_fields
Create Date: 2026-07-03
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0008_event_payment_method"
down_revision = "0007_event_payment_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_cols = [c["name"] for c in inspector.get_columns("events")]

    if "payment_method" not in existing_cols:
        op.add_column("events", sa.Column("payment_method", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "payment_method")
