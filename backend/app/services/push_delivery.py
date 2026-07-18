"""Web-push delivery, expressed as outcomes rather than exceptions.

Push is a legacy channel here. Few players ever enabled it, and iOS only allows
it for an installed PWA, which is why WhatsApp became the primary channel. It is
kept because the organiser's manual Remind button still offers it and it costs
nothing to send.

Dead subscriptions are pruned as a side effect: a 404 or 410 from the push
service means the browser threw the subscription away, and keeping it would mean
retrying forever.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Reminder, ReminderChannel, ReminderKind
from app.services import message_log, notification_service, push_service
from app.services.message_outcome import DeliveryOutcome, DeliveryReason


async def deliver_push(
    session: AsyncSession,
    *,
    player_id: uuid.UUID,
    event_id: uuid.UUID,
    kind: ReminderKind,
    title: str,
    body: str,
    url: str,
    registration_id: uuid.UUID | None = None,
    sent_by: str | None = None,
) -> tuple[DeliveryOutcome, Reminder]:
    """Push to every device this player has registered. Success means at least one."""
    subscriptions = await push_service.subscriptions_for_player(session, player_id)

    def record(outcome: DeliveryOutcome) -> tuple[DeliveryOutcome, Reminder]:
        row = message_log.record(
            session,
            event_id=event_id,
            player_id=player_id,
            registration_id=registration_id,
            channel=ReminderChannel.PUSH,
            kind=kind,
            outcome=outcome,
            sent_by=sent_by,
        )
        return outcome, row

    if not subscriptions:
        return record(
            DeliveryOutcome.skipped(
                DeliveryReason.NO_PUSH_SUBSCRIPTION, "player has no push subscriptions"
            )
        )

    delivered = 0
    last_failure: str | None = None
    for subscription in subscriptions:
        ok, detail = notification_service.send_push(
            endpoint=subscription.endpoint,
            p256dh=subscription.p256dh,
            auth=subscription.auth,
            title=title,
            body=body,
            url=url,
        )
        if ok:
            subscription.last_used_at = datetime.now(UTC)
            delivered += 1
            continue
        last_failure = detail
        if notification_service.is_push_gone(detail):
            await session.delete(subscription)

    if delivered:
        return record(DeliveryOutcome.delivered_via(f"delivered to {delivered} device(s)"))
    return record(DeliveryOutcome.failed(last_failure or "push delivery failed"))
