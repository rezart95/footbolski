"""Telling a player their waiting-list place became a confirmed one.

This is the highest-value message in the system and the one the design review
found missing. Promotion already happened automatically; nothing told the
player. So somebody who was told "you are number one on the list" on Saturday
could be holding a seat by Wednesday without knowing, not turn up, and leave the
squad a man short at an event the database reported as full. That is precisely
the failure the invite ladder exists to prevent, arriving through the one door
nobody was watching.

Sent over WhatsApp, and **exempt from the per-event message budget**: a player
who has already had three messages is exactly the one whose seat you most want
filled. Push is attempted too, but it is a dead channel and is not relied upon.
"""

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import Event, Player, ReminderKind
from app.services import localised_dates, message_delivery, message_templates

logger = logging.getLogger(__name__)


async def notify_promoted(
    session: AsyncSession,
    *,
    player_id: uuid.UUID,
    event: Event,
    venue_name: str,
    registration_id: uuid.UUID | None = None,
) -> str:
    """Message a promoted player. Returns the outcome reason for logging.

    Never raises: a messaging failure must not roll back the promotion itself,
    which has already been committed and is the thing that actually matters.
    """
    player = await session.get(Player, player_id)
    if player is None:
        return "no_player_card"

    settings = get_settings()
    language = player.preferred_language
    fields = {
        "name": message_templates.first_name(player.name),
        "when": localised_dates.format_when(event.event_date, event.event_time, language),
        "venue": venue_name,
        "link": f"{settings.app_public_url}/events/{event.id}",
    }

    try:
        outcome, _row = await message_delivery.deliver(
            session,
            player=player,
            event_id=event.id,
            kind=ReminderKind.PROMOTION,
            template_id=message_templates.WAITLIST_PROMOTED,
            template_fields=fields,
            registration_id=registration_id,
        )
        await session.commit()
        return outcome.reason.value
    except Exception:
        await session.rollback()
        logger.exception("Failed to notify promoted player %s", player_id)
        return "error"
