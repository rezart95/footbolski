"""Audit trail for every message the system sends a player.

One row per send attempt, written *before* the send so a crash mid-batch cannot
produce a silent gap. `registration_id` is nullable because invites go out to
players who have not registered yet — that is the whole point of an invite — so
keying the audit trail on a registration would make invites unauditable.

`provider_message_id` is what inbound delivery receipts are matched against;
without it a webhook has no way to know which row it refers to.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ReminderChannel(str, enum.Enum):
    PUSH = "push"
    SMS = "sms"
    WHATSAPP = "whatsapp"


class ReminderStatus(str, enum.Enum):
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


class ReminderKind(str, enum.Enum):
    """Why the message was sent. Drives both the budget rule and the audit trail."""

    MANUAL = "manual"
    """Organiser pressed Remind."""

    INVITE = "invite"
    """A rung of the T-5 / T-3 invite ladder."""

    PAYMENT = "payment"
    """T-1 payment reminder."""

    MOTM = "motm"
    """Man of the Match ballot link."""

    PROMOTION = "promotion"
    """A seat opened up and the player moved off the waitlist.

    Exempt from the per-event message budget: a silently promoted player who does
    not turn up is the exact failure the invite ladder exists to prevent.
    """


BUDGET_EXEMPT_KINDS = frozenset({ReminderKind.PROMOTION})
"""Kinds that do not count toward the per-player, per-event message cap."""


class Reminder(Base):
    __tablename__ = "reminders"
    __table_args__ = (
        Index("ix_reminders_event_id", "event_id"),
        Index("ix_reminders_player_id", "player_id"),
        Index("ix_reminders_registration_id", "registration_id"),
        # Delivery receipts arrive keyed only by the provider's message id.
        Index("ix_reminders_provider_message_id", "provider_message_id"),
        # The budget check counts rows per (event, player) on every send.
        Index("ix_reminders_event_player", "event_id", "player_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Nullable: an invite predates the registration it is trying to create.
    registration_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("registrations.id", ondelete="CASCADE")
    )
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    player_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("players.id", ondelete="SET NULL"))
    channel: Mapped[ReminderChannel] = mapped_column(
        Enum(ReminderChannel, name="reminder_channel", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    kind: Mapped[ReminderKind] = mapped_column(
        Enum(ReminderKind, name="reminder_kind", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ReminderKind.MANUAL,
        server_default=ReminderKind.MANUAL.value,
    )
    status: Mapped[ReminderStatus] = mapped_column(
        Enum(ReminderStatus, name="reminder_status", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    detail: Mapped[str | None] = mapped_column(Text)
    sent_by: Mapped[str | None] = mapped_column(String(255))
    provider_message_id: Mapped[str | None] = mapped_column(String(128))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
