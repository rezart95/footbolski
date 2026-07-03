import uuid
from datetime import date, datetime, time
from typing import Any

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, Time, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import EventStatus


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (UniqueConstraint("created_by_name", "event_date", name="uq_event_creator_date"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venue_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("venues.id"), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_time: Mapped[time] = mapped_column(Time, nullable=False)
    max_players: Mapped[int]
    created_by_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status", values_callable=lambda x: [e.value for e in x]),
        default=EventStatus.UPCOMING,
    )
    teams_generated: Mapped[bool] = mapped_column(default=False)
    teams_locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_reasoning: Mapped[str | None] = mapped_column(Text)
    ai_swap_options: Mapped[list[Any] | None] = mapped_column(JSON)
    price_per_person: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    pay_to_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    payment_details: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    venue: Mapped["Venue"] = relationship(back_populates="events")
    registrations: Mapped[list["Registration"]] = relationship(back_populates="event")
    teams: Mapped[list["Team"]] = relationship(back_populates="event")
