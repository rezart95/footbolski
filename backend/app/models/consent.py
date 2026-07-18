"""Record of a person accepting the terms.

This is the lawful basis for messaging anyone (design doc §5.12), so it has to be
evidence rather than a flag: who accepted, which version of the text they saw, and
when. A boolean would tell us nothing once the terms change.

Identity here is the same identity the rest of the app uses — a display name from
localStorage. That is weak, and deliberately recorded as such: `display_name` is
matched case-insensitively and back-filled to `player_id` when a player card
exists, mirroring how registrations link up.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

CURRENT_TERMS_VERSION = "2026-07-18"
"""Bump this whenever the terms text changes materially.

Everyone is re-prompted on the next visit, because acceptance is stored per
version rather than as a boolean.
"""


class ConsentRecord(Base):
    __tablename__ = "consent_records"
    __table_args__ = (
        # One acceptance per person per version; re-accepting is idempotent.
        Index("uq_consent_name_version", "display_name_lower", "terms_version", unique=True),
        Index("ix_consent_records_player_id", "player_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Stored folded so the unique index is genuinely case-insensitive rather than
    # relying on every caller remembering to normalise.
    display_name_lower: Mapped[str] = mapped_column(String(255), nullable=False)
    player_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("players.id", ondelete="SET NULL"))
    terms_version: Mapped[str] = mapped_column(String(32), nullable=False)
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
