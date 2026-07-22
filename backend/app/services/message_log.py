"""Writing the message audit trail, and the rate limits derived from it.

Limits are keyed on **(event, player)**, not on a registration. Invites are sent
to players who have no registration for the event yet, so keying on registration
would leave every ladder message invisible to the cap and let a player be
messaged without limit.

`record` is deliberately caller-committed: a batch sweep writes the token row and
the audit row in one transaction so a crash cannot leave a message sent but
unrecorded.
"""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import BUDGET_EXEMPT_KINDS, Reminder, ReminderChannel, ReminderKind, ReminderStatus
from app.services.message_outcome import DeliveryOutcome


def record(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    player_id: uuid.UUID | None,
    registration_id: uuid.UUID | None,
    channel: ReminderChannel,
    kind: ReminderKind,
    outcome: DeliveryOutcome,
    sent_by: str | None = None,
) -> Reminder:
    """Add an audit row for one delivery attempt. Does not commit."""
    reminder = Reminder(
        event_id=event_id,
        player_id=player_id,
        registration_id=registration_id,
        channel=channel,
        kind=kind,
        status=outcome.status,
        detail=outcome.detail[:2000] if outcome.detail else None,
        provider_message_id=outcome.provider_message_id,
        sent_by=sent_by,
    )
    session.add(reminder)
    return reminder


async def messages_sent_for_event(
    session: AsyncSession, event_id: uuid.UUID, player_id: uuid.UUID
) -> int:
    """Count messages that consume this player's budget for this event.

    Budget-exempt kinds (waitlist promotion) are excluded: telling somebody a
    seat opened up must never be blocked by a cap, because a silently promoted
    player who does not turn up is the failure the whole system exists to avoid.
    """
    exempt = [kind.value for kind in BUDGET_EXEMPT_KINDS]
    stmt = (
        select(func.count())
        .select_from(Reminder)
        .where(
            Reminder.event_id == event_id,
            Reminder.player_id == player_id,
            Reminder.status == ReminderStatus.SENT,
            Reminder.kind.notin_(exempt),
        )
    )
    return int(await session.scalar(stmt) or 0)


async def has_budget(
    session: AsyncSession, event_id: uuid.UUID, player_id: uuid.UUID, kind: ReminderKind
) -> bool:
    if kind in BUDGET_EXEMPT_KINDS:
        return True
    sent = await messages_sent_for_event(session, event_id, player_id)
    return sent < get_settings().max_messages_per_event


async def in_cooldown(
    session: AsyncSession, event_id: uuid.UUID, player_id: uuid.UUID
) -> bool:
    """True if this player was messaged about this event very recently.

    Guards against an organiser double-tapping Remind. Exempt kinds bypass it
    for the same reason they bypass the budget.
    """
    cooldown_minutes = get_settings().reminder_cooldown_minutes
    if cooldown_minutes <= 0:
        return False
    since = datetime.now(UTC) - timedelta(minutes=cooldown_minutes)
    exempt = [kind.value for kind in BUDGET_EXEMPT_KINDS]
    stmt = (
        select(func.count())
        .select_from(Reminder)
        .where(
            Reminder.event_id == event_id,
            Reminder.player_id == player_id,
            Reminder.status == ReminderStatus.SENT,
            Reminder.kind.notin_(exempt),
            Reminder.created_at >= since,
        )
    )
    return int(await session.scalar(stmt) or 0) > 0


async def already_sent(
    session: AsyncSession, event_id: uuid.UUID, player_id: uuid.UUID, kind: ReminderKind
) -> bool:
    """True if this player already got a message of this kind for this event.

    The audience-delta rule for the invite ladder: a core player invited at T-5
    must not be invited again at T-3.
    """
    stmt = (
        select(func.count())
        .select_from(Reminder)
        .where(
            Reminder.event_id == event_id,
            Reminder.player_id == player_id,
            Reminder.kind == kind,
            Reminder.status == ReminderStatus.SENT,
        )
    )
    return int(await session.scalar(stmt) or 0) > 0
