"""Fire-and-forget push notices for registration events.

Push is a dead channel in practice — adoption never happened and iOS only allows
it for an installed PWA — so nothing depends on these arriving. They are kept
because they cost nothing and the handful of players who did enable push still
get them. Anything that matters goes over WhatsApp instead.
"""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PushSubscription
from app.services.event_service import _send_pushes_bg


async def notify_player(
    session: AsyncSession, player_id: uuid.UUID | None, *, title: str, body: str, url: str
) -> None:
    """Push to every device this player registered. No-op if they have none."""
    if not player_id:
        return
    subscriptions = list(
        (
            await session.scalars(
                select(PushSubscription).where(PushSubscription.player_id == player_id)
            )
        ).all()
    )
    if not subscriptions:
        return
    payload = [
        {"endpoint": s.endpoint, "p256dh": s.p256dh, "auth": s.auth} for s in subscriptions
    ]
    asyncio.ensure_future(_send_pushes_bg(payload, title=title, body=body, url=url))
