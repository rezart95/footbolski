import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import PlayerPosition


class Player(Base):
    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    skill_rating: Mapped[int] = mapped_column(default=5)
    primary_position: Mapped[PlayerPosition] = mapped_column(
        Enum(PlayerPosition, name="player_position"),
        default=PlayerPosition.MID,
    )
    attributes: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Physical profile
    age: Mapped[int | None] = mapped_column(SmallInteger)
    height_cm: Mapped[int | None] = mapped_column(SmallInteger)
    build: Mapped[str | None] = mapped_column(String(50))
    preferred_role: Mapped[str | None] = mapped_column(String(100))

    # Attribute ratings (1–10)
    speed: Mapped[int | None] = mapped_column(SmallInteger)
    technique: Mapped[int | None] = mapped_column(SmallInteger)
    defending: Mapped[int | None] = mapped_column(SmallInteger)
    shooting: Mapped[int | None] = mapped_column(SmallInteger)
    aerial: Mapped[int | None] = mapped_column(SmallInteger)
    stamina: Mapped[int | None] = mapped_column(SmallInteger)
    work_rate: Mapped[int | None] = mapped_column(SmallInteger)
    notes: Mapped[str | None] = mapped_column(Text)

    # Contact and messaging.
    #
    # phone_number and tier are BOTH confidential: neither may appear in any
    # client-facing schema. A visible core/rest label in a group of friends is a
    # social problem with no product upside, and the timing difference between
    # ladder rungs is defensible only as wave-based messaging, not as a rank.
    phone_number: Mapped[str | None] = mapped_column(String(32))
    phone_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    """Set from the inbound webhook when the player first replies.

    That single reply proves they control the number, opens WhatsApp's 24-hour
    service window, and creates the consent record, all at once.
    """

    opted_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    """Set when the player replies STOP. Their number is cleared at the same time."""

    tier: Mapped[str] = mapped_column(String(10), nullable=False, default="rest", server_default="rest")
    """'core' or 'rest'. Controls which rung of the invite ladder reaches them."""

    preferred_language: Mapped[str] = mapped_column(
        String(5), nullable=False, default="en", server_default="en"
    )
    nationality: Mapped[str | None] = mapped_column(String(2))
    """ISO 3166-1 alpha-2. Recorded separately because nationality is not a
    reliable proxy for preferred language."""

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

