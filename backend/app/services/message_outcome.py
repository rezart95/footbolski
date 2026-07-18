"""The result of trying to deliver one message.

The delivery layer returns these instead of raising. A batch sweep over forty
players must be able to skip one bad number and carry on; raising an HTTP
exception from inside a loop aborts the whole run and leaves the remaining
players silently unmessaged, which looks identical to "nobody replied".

`reason` carries enough detail for the HTTP wrapper to choose a status code, so
the manual Remind button still gives the organiser a precise error.
"""

import enum
from dataclasses import dataclass

from app.models import ReminderStatus


class DeliveryReason(enum.StrEnum):
    """Why a delivery attempt ended the way it did."""

    DELIVERED = "delivered"

    # Refusals that are the caller's fault or simply not applicable.
    ALREADY_PAID = "already_paid"
    NO_PLAYER_CARD = "no_player_card"
    NO_PHONE_NUMBER = "no_phone_number"
    INVALID_PHONE_NUMBER = "invalid_phone_number"
    NOT_VERIFIED = "not_verified"
    OPTED_OUT = "opted_out"
    NO_PUSH_SUBSCRIPTION = "no_push_subscription"

    # Rate limiting.
    COOLDOWN_ACTIVE = "cooldown_active"
    BUDGET_EXHAUSTED = "budget_exhausted"

    # Something outside our control.
    PROVIDER_FAILED = "provider_failed"
    CHANNEL_NOT_CONFIGURED = "channel_not_configured"


#: Reasons that mean "we chose not to send", as opposed to "we tried and failed".
SKIP_REASONS = frozenset(
    {
        DeliveryReason.ALREADY_PAID,
        DeliveryReason.NO_PLAYER_CARD,
        DeliveryReason.NO_PHONE_NUMBER,
        DeliveryReason.INVALID_PHONE_NUMBER,
        DeliveryReason.NOT_VERIFIED,
        DeliveryReason.OPTED_OUT,
        DeliveryReason.NO_PUSH_SUBSCRIPTION,
        DeliveryReason.COOLDOWN_ACTIVE,
        DeliveryReason.BUDGET_EXHAUSTED,
    }
)


@dataclass(frozen=True)
class DeliveryOutcome:
    """What happened when we tried to send one message to one person."""

    reason: DeliveryReason
    detail: str
    provider_message_id: str | None = None

    @property
    def delivered(self) -> bool:
        return self.reason is DeliveryReason.DELIVERED

    @property
    def status(self) -> ReminderStatus:
        """How this outcome is recorded in the reminders audit trail."""
        if self.delivered:
            return ReminderStatus.SENT
        if self.reason in SKIP_REASONS:
            return ReminderStatus.SKIPPED
        return ReminderStatus.FAILED

    @classmethod
    def delivered_via(cls, detail: str, provider_message_id: str | None = None) -> "DeliveryOutcome":
        return cls(DeliveryReason.DELIVERED, detail, provider_message_id)

    @classmethod
    def skipped(cls, reason: DeliveryReason, detail: str) -> "DeliveryOutcome":
        return cls(reason, detail)

    @classmethod
    def failed(cls, detail: str, reason: DeliveryReason = DeliveryReason.PROVIDER_FAILED) -> "DeliveryOutcome":
        return cls(reason, detail)
