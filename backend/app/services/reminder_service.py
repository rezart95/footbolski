"""Send a reminder for an unpaid registration through push or SMS."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import (
    Event,
    Player,
    PushSubscription,
    Registration,
    Reminder,
    ReminderChannel,
    ReminderStatus,
)
from app.schemas.reminder import ReminderResult
from app.services import notification_service, push_service


async def _registration(session: AsyncSession, event_id: uuid.UUID, registration_id: uuid.UUID) -> Registration:
    stmt = (
        select(Registration)
        .where(Registration.id == registration_id, Registration.event_id == event_id)
        .options(selectinload(Registration.player), selectinload(Registration.event).selectinload(Event.venue))
    )
    registration = await session.scalar(stmt)
    if not registration:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    return registration


async def _enforce_cooldown(session: AsyncSession, registration_id: uuid.UUID) -> None:
    settings = get_settings()
    if settings.reminder_cooldown_minutes <= 0:
        return
    since = datetime.now(UTC) - timedelta(minutes=settings.reminder_cooldown_minutes)
    stmt = select(func.count()).select_from(Reminder).where(
        Reminder.registration_id == registration_id,
        Reminder.status == ReminderStatus.SENT,
        Reminder.created_at >= since,
    )
    recent = int(await session.scalar(stmt) or 0)
    if recent > 0:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Please wait before sending another reminder ({settings.reminder_cooldown_minutes} min cooldown)",
        )


async def _sms_count(session: AsyncSession, registration_id: uuid.UUID) -> int:
    stmt = select(func.count()).select_from(Reminder).where(
        Reminder.registration_id == registration_id,
        Reminder.channel == ReminderChannel.SMS,
        Reminder.status == ReminderStatus.SENT,
    )
    return int(await session.scalar(stmt) or 0)


def _build_message(registration: Registration) -> tuple[str, str, str]:
    event = registration.event
    venue = event.venue
    when = f"{event.event_date.strftime('%a %d %b')} at {event.event_time.strftime('%H:%M')}"
    title = "Footbolski – payment reminder"
    body = (
        f"Hi {registration.display_name.split()[0]}, friendly reminder to pay for "
        f"football on {when} at {venue.name}. Thanks!"
    )
    url = f"{get_settings().app_public_url}/events/{event.id}"
    return title, body, url


async def _log(
    session: AsyncSession,
    *,
    registration: Registration,
    channel: ReminderChannel,
    status_: ReminderStatus,
    detail: str | None,
    sent_by: str | None,
) -> None:
    session.add(
        Reminder(
            registration_id=registration.id,
            event_id=registration.event_id,
            player_id=registration.player_id,
            channel=channel,
            status=status_,
            detail=detail,
            sent_by=sent_by,
        )
    )
    await session.commit()


async def send_reminder(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    channel: ReminderChannel,
    sent_by: str | None = None,
) -> ReminderResult:
    settings = get_settings()
    registration = await _registration(session, event_id, registration_id)

    if registration.has_paid:
        raise HTTPException(status.HTTP_409_CONFLICT, "This player has already paid")
    if not registration.player_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Guests cannot receive reminders")

    await _enforce_cooldown(session, registration_id)

    player: Player | None = registration.player
    title, body, url = _build_message(registration)

    if channel == ReminderChannel.PUSH:
        subs = await push_service.subscriptions_for_player(session, registration.player_id)
        if not subs:
            await _log(session, registration=registration, channel=channel, status_=ReminderStatus.SKIPPED,
                       detail="no push subscriptions", sent_by=sent_by)
            raise HTTPException(status.HTTP_409_CONFLICT, "This player has not enabled push notifications")

        sent_any = False
        last_detail: str | None = None
        for sub in subs:
            ok, detail = notification_service.send_push(
                endpoint=sub.endpoint, p256dh=sub.p256dh, auth=sub.auth,
                title=title, body=body, url=url,
            )
            if ok:
                sub.last_used_at = datetime.now(UTC)
                sent_any = True
            else:
                last_detail = detail
                if notification_service.is_push_gone(detail):
                    await session.delete(sub)
        if sent_any:
            await _log(session, registration=registration, channel=channel, status_=ReminderStatus.SENT,
                       detail=f"delivered to {len(subs)} device(s)", sent_by=sent_by)
            return ReminderResult(channel=channel, status=ReminderStatus.SENT,
                                  detail="Push notification sent")
        await _log(session, registration=registration, channel=channel, status_=ReminderStatus.FAILED,
                   detail=last_detail, sent_by=sent_by)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Push delivery failed: {last_detail or 'unknown error'}")

    # SMS
    if not player or not player.phone_number:
        await _log(session, registration=registration, channel=channel, status_=ReminderStatus.SKIPPED,
                   detail="no phone number on player", sent_by=sent_by)
        raise HTTPException(status.HTTP_409_CONFLICT, "No phone number on file for this player")

    to = notification_service.normalize_phone(player.phone_number)
    if not to:
        await _log(session, registration=registration, channel=channel, status_=ReminderStatus.SKIPPED,
                   detail="invalid phone number", sent_by=sent_by)
        raise HTTPException(status.HTTP_409_CONFLICT, "Player phone number is invalid")

    sent = await _sms_count(session, registration_id)
    if sent >= settings.sms_max_per_event:
        await _log(session, registration=registration, channel=channel, status_=ReminderStatus.SKIPPED,
                   detail=f"sms cap reached ({settings.sms_max_per_event}/event)", sent_by=sent_by)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"SMS limit reached ({settings.sms_max_per_event} per player per event)",
        )

    ok, detail = notification_service.send_sms(to=to, body=body)
    if ok:
        await _log(session, registration=registration, channel=channel, status_=ReminderStatus.SENT,
                   detail=detail, sent_by=sent_by)
        return ReminderResult(
            channel=channel,
            status=ReminderStatus.SENT,
            detail="SMS sent",
            sms_sent_count=sent + 1,
            sms_remaining=max(0, settings.sms_max_per_event - (sent + 1)),
        )
    await _log(session, registration=registration, channel=channel, status_=ReminderStatus.FAILED,
               detail=detail, sent_by=sent_by)
    raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"SMS delivery failed: {detail or 'unknown error'}")
