"""Handling everything Twilio sends back to us.

Three kinds of callback arrive at the same webhook:

1. A **delivery receipt** (`MessageStatus`), matched to its audit row by
   `provider_message_id`. This is what makes "zero seats lost without a
   delivered notification" verifiable rather than aspirational.
2. An **opt-out** (`STOP` and its variants). Handled first and unconditionally.
3. Any **other inbound message**, which counts as opt-in: it proves the person
   controls the number and opens WhatsApp's 24-hour service window.

Nothing here trusts the payload's `From` beyond using it to look up a player we
already know. An unknown number is ignored rather than creating anything.
"""

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, Reminder
from app.services import notification_service

logger = logging.getLogger(__name__)

#: Twilio and Meta both honour these; we mirror them so our records agree.
STOP_KEYWORDS = frozenset({"stop", "unsubscribe", "cancel", "end", "quit", "stopall", "revoke"})
START_KEYWORDS = frozenset({"start", "unstop", "yes", "tak", "si", "sim", "po", "так"})

DELIVERED_STATUSES = frozenset({"delivered", "read"})
READ_STATUSES = frozenset({"read"})


def strip_channel_prefix(address: str | None) -> str | None:
    """Turn "whatsapp:+48514437184" into "+48514437184"."""
    if not address:
        return None
    return address.split(":", 1)[1] if ":" in address else address


async def _find_player_by_number(session: AsyncSession, address: str | None) -> Player | None:
    number = notification_service.normalize_phone(strip_channel_prefix(address))
    if not number:
        return None
    # Stored numbers are not guaranteed normalised, so compare on the normalised
    # form of each candidate rather than trusting an equality match in SQL.
    for player in (await session.scalars(select(Player).where(Player.phone_number.isnot(None)))).all():
        if notification_service.normalize_phone(player.phone_number) == number:
            return player
    return None


async def record_delivery_receipt(
    session: AsyncSession, *, provider_message_id: str, message_status: str
) -> bool:
    """Stamp delivered_at / read_at on the audit row. Returns True if matched."""
    reminder = await session.scalar(
        select(Reminder).where(Reminder.provider_message_id == provider_message_id)
    )
    if reminder is None:
        return False

    now = datetime.now(UTC)
    status = (message_status or "").lower()
    if status in DELIVERED_STATUSES and reminder.delivered_at is None:
        reminder.delivered_at = now
    if status in READ_STATUSES and reminder.read_at is None:
        reminder.read_at = now
    return True


async def handle_opt_out(session: AsyncSession, player: Player) -> None:
    """Stop messaging and delete the number.

    The terms promise deletion on STOP, not merely suppression, so the number is
    cleared rather than flagged. `opted_out_at` remains as evidence that consent
    was withdrawn and when.
    """
    player.opted_out_at = datetime.now(UTC)
    player.phone_number = None
    player.phone_verified_at = None


async def handle_opt_in(session: AsyncSession, player: Player) -> bool:
    """Mark the number verified on the player's first reply. Returns True if newly verified."""
    player.opted_out_at = None
    if player.phone_verified_at is not None:
        return False
    player.phone_verified_at = datetime.now(UTC)
    return True


async def process_inbound(
    session: AsyncSession, form: dict[str, str]
) -> dict[str, object]:
    """Route one Twilio callback. Never raises on unknown shapes."""
    provider_message_id = form.get("MessageSid") or form.get("SmsSid")
    message_status = form.get("MessageStatus") or form.get("SmsStatus")
    body = (form.get("Body") or "").strip()
    sender = form.get("From")

    # A status callback carries a status but no body.
    if message_status and not body:
        matched = False
        if provider_message_id:
            matched = await record_delivery_receipt(
                session, provider_message_id=provider_message_id, message_status=message_status
            )
        return {"handled": "status", "status": message_status, "matched": matched}

    player = await _find_player_by_number(session, sender)
    if player is None:
        # Unknown numbers are ignored deliberately: replying to them would leak
        # that this service exists, and creating records from an unverified
        # inbound message is how spam gets into the database.
        logger.info("Inbound WhatsApp from an unrecognised number, ignoring")
        return {"handled": "ignored", "reason": "unknown sender"}

    keyword = body.lower().strip(" .!?")
    if keyword in STOP_KEYWORDS:
        await handle_opt_out(session, player)
        return {"handled": "opt_out", "player": player.name}

    newly_verified = await handle_opt_in(session, player)
    return {
        "handled": "opt_in" if newly_verified else "message",
        "player": player.name,
        "newly_verified": newly_verified,
        "is_start_keyword": keyword in START_KEYWORDS,
    }
