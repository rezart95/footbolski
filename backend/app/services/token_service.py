"""Resolving and redeeming the single-use links we send in messages.

Tokens are **soft-consumed**: redeeming stamps `used_at` rather than deleting the
row, so a second tap can still tell the person what happened and offer a way
through. A dead end is the wrong answer for the person most likely to hit it,
who is usually somebody actively trying to play.
"""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    ActionToken,
    Event,
    EventStatus,
    ListStatus,
    Player,
    Registration,
    TokenPurpose,
)
from app.services import registration_service


class ResolvedToken:
    """A token plus the event and player it refers to."""

    def __init__(self, token: ActionToken, event: Event, player: Player) -> None:
        self.token = token
        self.event = event
        self.player = player

    @property
    def is_spent(self) -> bool:
        return self.token.used_at is not None


async def resolve(session: AsyncSession, raw_token: str, purpose: TokenPurpose) -> ResolvedToken:
    """Look up a token. Spent tokens resolve successfully; the caller decides."""
    token = await session.scalar(
        select(ActionToken).where(
            ActionToken.token == raw_token, ActionToken.purpose == purpose.value
        )
    )
    if token is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link is not valid.")

    event = await session.scalar(
        select(Event).options(selectinload(Event.venue)).where(Event.id == token.event_id)
    )
    player = await session.get(Player, token.player_id)
    if event is None or player is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link is no longer valid.")

    if token.expires_at is not None and token.expires_at < datetime.now(UTC):
        token.used_at = token.used_at or datetime.now(UTC)

    return ResolvedToken(token, event, player)


def _spend(token: ActionToken) -> None:
    token.used_at = datetime.now(UTC)


async def _existing_registration(
    session: AsyncSession, event_id: uuid.UUID, player: Player
) -> Registration | None:
    """Find this player's registration, by link first then by name.

    The name fallback matters because registrations created before player cards
    existed are matched only by display name.
    """
    by_player = await session.scalar(
        select(Registration).where(
            Registration.event_id == event_id, Registration.player_id == player.id
        )
    )
    if by_player is not None:
        return by_player

    candidates = await session.scalars(
        select(Registration).where(Registration.event_id == event_id)
    )
    folded = player.name.casefold()
    return next((r for r in candidates if r.display_name.casefold() == folded), None)


async def redeem_invite(session: AsyncSession, raw_token: str) -> dict:
    """Claim a place from an invite link.

    Returns a description of the outcome rather than raising for the ordinary
    cases, because every one of them is a screen the player needs to see:
    already in, event full so waitlisted, event cancelled, link already used.
    """
    resolved = await resolve(session, raw_token, TokenPurpose.INVITE)
    event, player = resolved.event, resolved.player

    if event.status is EventStatus.CANCELLED:
        return {"outcome": "event_cancelled", "event_id": str(event.id)}

    existing = await _existing_registration(session, event.id, player)
    if existing is not None:
        _spend(resolved.token)
        await session.commit()
        return {
            "outcome": "already_registered",
            "list_status": existing.list_status.value,
            "position": existing.position,
            "event_id": str(event.id),
        }

    registration = await registration_service.register(session, event.id, player.name)
    _spend(resolved.token)
    await session.commit()

    waitlisted = registration.list_status is ListStatus.WAITLIST
    return {
        "outcome": "waitlisted" if waitlisted else "confirmed",
        "list_status": registration.list_status.value,
        "position": registration.position,
        "event_id": str(event.id),
    }
