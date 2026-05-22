import uuid
from datetime import time

from sqlalchemy import String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    address: Mapped[str | None] = mapped_column(String(255))
    default_day: Mapped[int | None]
    default_time: Mapped[time | None] = mapped_column(Time)
    players_per_side: Mapped[int]
    max_players: Mapped[int]

    events: Mapped[list["Event"]] = relationship(back_populates="venue")
