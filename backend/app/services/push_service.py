import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PushSubscription
from app.services.registration_service import _matching_player


async def upsert_subscription(
    session: AsyncSession,
    *,
    display_name: str,
    endpoint: str,
    p256dh: str,
    auth: str,
    user_agent: str | None,
) -> PushSubscription:
    player = await _matching_player(session, display_name)
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No player profile found for this name")

    existing = await session.scalar(select(PushSubscription).where(PushSubscription.endpoint == endpoint))
    if existing:
        existing.player_id = player.id
        existing.p256dh = p256dh
        existing.auth = auth
        existing.user_agent = user_agent
        existing.last_used_at = datetime.now(UTC)
        await session.commit()
        await session.refresh(existing)
        return existing

    subscription = PushSubscription(
        player_id=player.id,
        endpoint=endpoint,
        p256dh=p256dh,
        auth=auth,
        user_agent=user_agent,
    )
    session.add(subscription)
    await session.commit()
    await session.refresh(subscription)
    return subscription


async def delete_subscription(session: AsyncSession, endpoint: str) -> None:
    existing = await session.scalar(select(PushSubscription).where(PushSubscription.endpoint == endpoint))
    if existing:
        await session.delete(existing)
        await session.commit()


async def subscriptions_for_player(session: AsyncSession, player_id: uuid.UUID) -> list[PushSubscription]:
    stmt = select(PushSubscription).where(PushSubscription.player_id == player_id)
    return list((await session.scalars(stmt)).all())
