"""Add price_per_person and pay_to_name to events table.

Revision ID: 0007_event_payment_fields
Revises: 0006_creator_date_unique
Create Date: 2026-06-07
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0007_event_payment_fields"
down_revision = "0006_creator_date_unique"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_cols = [c["name"] for c in inspector.get_columns("events")]

    if "price_per_person" not in existing_cols:
        op.add_column("events", sa.Column("price_per_person", sa.Numeric(8, 2), nullable=True))

    if "pay_to_name" not in existing_cols:
        op.add_column("events", sa.Column("pay_to_name", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "pay_to_name")
    op.drop_column("events", "price_per_person")
