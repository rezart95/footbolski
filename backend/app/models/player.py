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

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
