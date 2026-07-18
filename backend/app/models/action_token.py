"""Single-use tokens behind the links we send in messages.

This table doubles as the **dispatch ledger**. The unique constraint on
(purpose, event_id, player_id) is what makes delivery exactly-once *per
recipient*, not merely per ladder rung: the row is committed before the message
goes out, so a crash mid-sweep can neither double-send nor silently skip.

Tokens are **soft-consumed**. `used_at` is stamped rather than the row deleted,
because a spent token must still resolve its event: somebody tapping an old link
gets told what happened and is offered a way through, instead of a dead end.
"""

import enum
import secrets
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

TOKEN_BYTES = 24
"""~32 URL-safe characters. Long enough that guessing one is not worth trying,
short enough to keep the message under a WhatsApp segment boundary."""


class TokenPurpose(str, enum.Enum):
    INVITE = "invite"
    """Claim a place at an event."""

    MOTM = "motm"
    """Cast a Man of the Match vote."""


def generate_token() -> str:
    return secrets.token_urlsafe(TOKEN_BYTES)


class ActionToken(Base):
    __tablename__ = "action_tokens"
    __table_args__ = (
        # The dispatch ledger: one token per purpose, per event, per player.
        UniqueConstraint("purpose", "event_id", "player_id", name="uq_action_token_dispatch"),
        Index("ix_action_tokens_token", "token", unique=True),
        Index("ix_action_tokens_event_id", "event_id"),
        Index("ix_action_tokens_player_id", "player_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token: Mapped[str] = mapped_column(String(64), nullable=False, default=generate_token)
    purpose: Mapped[TokenPurpose] = mapped_column(
        String(16), nullable=False
    )
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    player_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)

    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def is_spent(self) -> bool:
        return self.used_at is not None
