"""Delivering one message to one player, safely enough to run in a loop.

Every function here returns a `DeliveryOutcome` and never raises for an ordinary
refusal: no number, unverified, opted out, budget spent, provider rejected. A
sweep over the squad must be able to skip somebody and keep going. Only genuine
programming errors propagate.

Callers pass a template id and its field values rather than a rendered string —
Meta's Cloud API requires every proactive message to be a structured template
invocation, not free text. `message_templates.build_components()` does that
conversion in one place.

Callers are responsible for committing. That lets a sweep write the dispatch
token and the audit row in one transaction, so a crash cannot leave a message
sent but unrecorded.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, Reminder, ReminderChannel, ReminderKind
from app.services import message_log, message_templates, meta_whatsapp_gateway, notification_service
from app.services.message_outcome import DeliveryOutcome, DeliveryReason


def _addressable(player: Player) -> tuple[str | None, DeliveryOutcome | None]:
    """Return the E.164 number to send to, or the outcome explaining why not."""
    if player.opted_out_at is not None:
        return None, DeliveryOutcome.skipped(
            DeliveryReason.OPTED_OUT, "player replied STOP"
        )
    if not player.phone_number:
        return None, DeliveryOutcome.skipped(
            DeliveryReason.NO_PHONE_NUMBER, "no phone number on file"
        )
    number = notification_service.normalize_phone(player.phone_number)
    if not number:
        return None, DeliveryOutcome.skipped(
            DeliveryReason.INVALID_PHONE_NUMBER, f"unparseable number: {player.phone_number!r}"
        )
    return number, None


async def deliver(
    session: AsyncSession,
    *,
    player: Player,
    event_id: uuid.UUID,
    kind: ReminderKind,
    template_id: str,
    template_fields: dict,
    registration_id: uuid.UUID | None = None,
    sent_by: str | None = None,
    require_verified: bool = True,
    enforce_cooldown: bool = False,
) -> tuple[DeliveryOutcome, Reminder]:
    """Send one WhatsApp template message and record the attempt.

    Returns the outcome and the audit row. The row is added to the session but
    not committed, so the caller controls the transaction boundary.

    `require_verified` is on by default: WhatsApp only permits proactive
    messages to a number whose owner has replied at least once, which is also
    what proves they control it. The opt-in message itself is the exception.
    """

    def record(outcome: DeliveryOutcome) -> tuple[DeliveryOutcome, Reminder]:
        row = message_log.record(
            session,
            event_id=event_id,
            player_id=player.id,
            registration_id=registration_id,
            channel=ReminderChannel.WHATSAPP,
            kind=kind,
            outcome=outcome,
            sent_by=sent_by,
        )
        return outcome, row

    number, refusal = _addressable(player)
    if refusal is not None:
        return record(refusal)

    if require_verified and player.phone_verified_at is None:
        return record(
            DeliveryOutcome.skipped(
                DeliveryReason.NOT_VERIFIED, "player has not yet replied to confirm their number"
            )
        )

    if not meta_whatsapp_gateway.is_configured():
        return record(
            DeliveryOutcome.failed(
                "WhatsApp sender is not configured", DeliveryReason.CHANNEL_NOT_CONFIGURED
            )
        )

    if enforce_cooldown and await message_log.in_cooldown(session, event_id, player.id):
        return record(
            DeliveryOutcome.skipped(DeliveryReason.COOLDOWN_ACTIVE, "messaged very recently")
        )

    if not await message_log.has_budget(session, event_id, player.id, kind):
        return record(
            DeliveryOutcome.skipped(
                DeliveryReason.BUDGET_EXHAUSTED, "per-event message budget reached"
            )
        )

    template = message_templates.build_components(
        template_id, player.preferred_language, **template_fields
    )
    sent, detail, provider_message_id = await meta_whatsapp_gateway.send_template(
        to=number, template=template
    )
    if sent:
        return record(DeliveryOutcome.delivered_via(detail, provider_message_id))
    return record(DeliveryOutcome.failed(detail))
