import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ListStatus


class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = (UniqueConstraint("event_id", "display_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    player_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("players.id"))
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    list_status: Mapped[ListStatus] = mapped_column(Enum(ListStatus, name="list_status", values_callable=lambda x: [e.value for e in x]))
    position: Mapped[int]
    has_paid: Mapped[bool] = mapped_column(default=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    guest_profile: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="registrations")
    player: Mapped["Player | None"] = relationship()
