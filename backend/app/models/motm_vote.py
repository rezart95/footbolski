"""Man of the Match ballot.

Secrecy is a hard requirement, and it is enforced structurally rather than by
convention: no schema in `app.schemas` exposes `voter_player_id`, and no service
function returns individual rows. Only aggregate counts leave this table, and
only after the window closes.

Two integrity rules live in the database rather than in Python, so they hold even
if a future caller forgets them: one vote per voter per event, and no voting for
yourself.
"""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MotmVote(Base):
    __tablename__ = "motm_votes"
    __table_args__ = (
        UniqueConstraint("event_id", "voter_player_id", name="uq_motm_one_vote_per_voter"),
        CheckConstraint("voter_player_id <> nominee_player_id", name="ck_motm_no_self_vote"),
        Index("ix_motm_votes_event_id", "event_id"),
        Index("ix_motm_votes_nominee_player_id", "nominee_player_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    voter_player_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"), nullable=False
    )
    nominee_player_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
