import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, Registration
from app.schemas.player import PlayerCreate, PlayerUpdate

EDITOR_NAME = "Jetmir Çenko"
"""The one player who maintains everyone's ratings. Player cards are
otherwise view-only — see `_assert_is_editor`. A plain constant rather than
a setting: this is a specific, named person by explicit request, not a
configurable role."""


def _assert_is_editor(requested_by: str) -> None:
    """Only `EDITOR_NAME` may create or edit player cards. Matched
    case-insensitively, and on first name alone, because the session name is
    free text with no auth (same convention as the event-creator checks)."""
    claimed = requested_by.casefold()
    stored = EDITOR_NAME.casefold()
    if claimed != stored and claimed != stored.split()[0]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Only {EDITOR_NAME} can edit player cards")


async def list_players(session: AsyncSession) -> list[Player]:
    return list((await session.scalars(select(Player).order_by(Player.name))).all())


async def get_player(session: AsyncSession, player_id: uuid.UUID) -> Player:
    player = await session.get(Player, player_id)
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return player


async def _backfill_registrations(session: AsyncSession, player: Player) -> None:
    """Link any registrations whose display_name matches this player but have no player_id."""
    name_lower = player.name.casefold()
    first_lower = name_lower.split()[0]
    stmt = (
        update(Registration)
        .where(
            Registration.player_id.is_(None),
            func.lower(Registration.display_name).in_([name_lower, first_lower]),
        )
        .values(player_id=player.id)
    )
    await session.execute(stmt)


async def relink_all_registrations(session: AsyncSession) -> int:
    """Back-fill player_id across all registrations for all known players. Returns number of rows updated."""
    players = await list_players(session)
    total = 0
    for player in players:
        name_lower = player.name.casefold()
        first_lower = name_lower.split()[0]
        result = await session.execute(
            update(Registration)
            .where(
                Registration.player_id.is_(None),
                func.lower(Registration.display_name).in_([name_lower, first_lower]),
            )
            .values(player_id=player.id)
        )
        total += result.rowcount
    await session.commit()
    return total


async def create_player(session: AsyncSession, payload: PlayerCreate) -> Player:
    _assert_is_editor(payload.requested_by)
    player = Player(**payload.model_dump(exclude={"requested_by"}))
    session.add(player)
    await session.flush()  # get the player.id before backfill
    await _backfill_registrations(session, player)
    await session.commit()
    await session.refresh(player)
    return player


async def update_player(session: AsyncSession, player_id: uuid.UUID, payload: PlayerUpdate) -> Player:
    """Apply only the fields the caller actually sent.

    `exclude_unset` matters here: without it an omitted field is filled from the
    schema default and silently overwrites stored data. Explicit nulls are still
    applied, so clearing a field from the form keeps working.
    """
    _assert_is_editor(payload.requested_by)
    player = await get_player(session, player_id)
    for key, value in payload.model_dump(exclude_unset=True, exclude={"requested_by"}).items():
        setattr(player, key, value)
    await session.flush()
    await _backfill_registrations(session, player)
    await session.commit()
    await session.refresh(player)
    return player


async def set_player_phone(session: AsyncSession, player_id: uuid.UUID, phone_number: str | None) -> Player:
    """Write a player's phone number. Callable only from the admin router."""
    player = await get_player(session, player_id)
    player.phone_number = phone_number
    await session.commit()
    await session.refresh(player)
    return player


async def set_player_tier(session: AsyncSession, player_id: uuid.UUID, tier: str) -> Player:
    """Write a player's invite-ladder tier. Callable only from the admin router."""
    player = await get_player(session, player_id)
    player.tier = tier
    await session.commit()
    await session.refresh(player)
    return player
