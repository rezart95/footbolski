"""Backfill passing=5 for players that predate the passing column"""

import sqlalchemy as sa
from alembic import op

revision = "0017_backfill_passing_default"
down_revision = "0016_replace_attrs_passing"
branch_labels = None
depends_on = None

players = sa.table("players", sa.column("passing", sa.SmallInteger))


def upgrade() -> None:
    op.execute(players.update().where(players.c.passing.is_(None)).values(passing=5))


def downgrade() -> None:
    # Backfills aren't reversible to their prior (NULL) state without knowing
    # which rows this migration actually touched vs. rows a user genuinely
    # set to 5 afterward, so downgrade is intentionally a no-op rather than
    # guessing and discarding real data.
    pass