"""HTTP wrapper around the delivery layer for the organiser's Remind button.

This module exists to turn a `DeliveryOutcome` into an HTTP response. All the
sending, rate limiting and audit logging happens in `message_delivery` and
`push_delivery`, which never raise, so the same code paths can be reused by the
scheduler sweeps where an exception would abort the whole run.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import Event, Registration, ReminderChannel, ReminderKind
from app.schemas.reminder import ReminderResult
from app.services import (
    localised_dates,
    message_delivery,
    message_log,
    message_templates,
    push_delivery,
)
from app.services.message_outcome import DeliveryOutcome, DeliveryReason

#: How each refusal is reported to the organiser pressing the button.
_HTTP_STATUS_FOR_REASON = {
    DeliveryReason.ALREADY_PAID: status.HTTP_409_CONFLICT,
    DeliveryReason.NO_PLAYER_CARD: status.HTTP_409_CONFLICT,
    DeliveryReason.NO_PHONE_NUMBER: status.HTTP_409_CONFLICT,
    DeliveryReason.INVALID_PHONE_NUMBER: status.HTTP_409_CONFLICT,
    DeliveryReason.NOT_VERIFIED: status.HTTP_409_CONFLICT,
    DeliveryReason.OPTED_OUT: status.HTTP_409_CONFLICT,
    DeliveryReason.NO_PUSH_SUBSCRIPTION: status.HTTP_409_CONFLICT,
    DeliveryReason.COOLDOWN_ACTIVE: status.HTTP_429_TOO_MANY_REQUESTS,
    DeliveryReason.BUDGET_EXHAUSTED: status.HTTP_429_TOO_MANY_REQUESTS,
    DeliveryReason.CHANNEL_NOT_CONFIGURED: status.HTTP_503_SERVICE_UNAVAILABLE,
    DeliveryReason.PROVIDER_FAILED: status.HTTP_502_BAD_GATEWAY,
}

#: Wording the organiser sees. The raw provider detail is kept in the audit trail.
_MESSAGE_FOR_REASON = {
    DeliveryReason.NO_PHONE_NUMBER: "No phone number on file for this player.",
    DeliveryReason.INVALID_PHONE_NUMBER: "This player's phone number could not be read.",
    DeliveryReason.NOT_VERIFIED: "This player has not confirmed their number yet. They need to reply to the opt-in message first.",
    DeliveryReason.OPTED_OUT: "This player has opted out of messages.",
    DeliveryReason.NO_PUSH_SUBSCRIPTION: "This player has not enabled notifications.",
    DeliveryReason.COOLDOWN_ACTIVE: "A reminder was just sent. Give it a few minutes.",
    DeliveryReason.BUDGET_EXHAUSTED: "This player has already received the maximum number of messages for this event.",
    DeliveryReason.CHANNEL_NOT_CONFIGURED: "Messaging is not configured on this server yet.",
}


async def _load_registration(
    session: AsyncSession, event_id: uuid.UUID, registration_id: uuid.UUID
) -> Registration:
    stmt = (
        select(Registration)
        .where(Registration.id == registration_id, Registration.event_id == event_id)
        .options(
            selectinload(Registration.player),
            selectinload(Registration.event).selectinload(Event.venue),
        )
    )
    registration = await session.scalar(stmt)
    if not registration:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    return registration


def _payment_body(registration: Registration, language: str | None) -> str:
    event = registration.event
    settings = get_settings()
    when = localised_dates.format_when(event.event_date, event.event_time, language)
    amount = f"{event.price_per_person:g} zł" if event.price_per_person else "your share"
    return message_templates.render(
        message_templates.PAYMENT_REMINDER,
        language,
        name=message_templates.first_name(registration.display_name),
        when=when,
        amount=amount,
        handle=event.payment_details or event.pay_to_name or "the organiser",
        method=(event.payment_method or "transfer").replace("_", " "),
        link=f"{settings.app_public_url}/events/{event.id}",
    )


def _raise_for(outcome: DeliveryOutcome) -> None:
    code = _HTTP_STATUS_FOR_REASON.get(outcome.reason, status.HTTP_502_BAD_GATEWAY)
    message = _MESSAGE_FOR_REASON.get(outcome.reason) or outcome.detail or "Message could not be sent."
    raise HTTPException(code, message)


async def send_reminder(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    channel: ReminderChannel,
    sent_by: str | None = None,
) -> ReminderResult:
    """Send a payment reminder on the organiser's instruction."""
    registration = await _load_registration(session, event_id, registration_id)

    if registration.has_paid:
        raise HTTPException(status.HTTP_409_CONFLICT, "This player has already paid.")
    if not registration.player_id or not registration.player:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This player has no player card. Ask them to create one in the Players tab first.",
        )

    player = registration.player
    body = _payment_body(registration, player.preferred_language)

    if channel is ReminderChannel.PUSH:
        outcome, _row = await push_delivery.deliver_push(
            session,
            player_id=player.id,
            event_id=event_id,
            kind=ReminderKind.PAYMENT,
            title="Footbolski payment reminder",
            body=body,
            url=f"{get_settings().app_public_url}/events/{event_id}",
            registration_id=registration.id,
            sent_by=sent_by,
        )
    else:
        outcome, _row = await message_delivery.deliver(
            session,
            player=player,
            event_id=event_id,
            kind=ReminderKind.PAYMENT,
            body=body,
            registration_id=registration.id,
            sent_by=sent_by,
            enforce_cooldown=True,
        )

    await session.commit()

    if not outcome.delivered:
        _raise_for(outcome)

    sent_count = await message_log.messages_sent_for_event(session, event_id, player.id)
    remaining = max(0, get_settings().max_messages_per_event - sent_count)
    return ReminderResult(
        channel=channel,
        status=outcome.status,
        detail="Reminder sent",
        sms_sent_count=sent_count,
        sms_remaining=remaining,
    )
