import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, Registration, TeamPlayer
from app.schemas.player import PlayerContactStatus, PlayerCreate, PlayerUpdate
from app.services.notification_service import normalize_phone

EDITOR_NAME = "Jetmir Çenko"
"""The one player who maintains everyone's ratings. Player cards are
otherwise view-only — see `_assert_is_editor`. A plain constant rather than
a setting: this is a specific, named person by explicit request, not a
configurable role."""

ADMIN_NAMES = ("Rezart Abazi", "Jetmir Çenko", "Bledar Ndreca")
"""Who can reach the admin portal: delete cards and read/write scouting notes.
The same weak name-based identity as everywhere else in this app, deliberately
so — see `_assert_is_admin`. Kept separate from `EDITOR_NAME` because the two
roles differ: Jetmir alone maintains ratings, but card deletion and notes are
shared with the organiser."""


def _matches(claimed: str, name: str) -> bool:
    """Case-insensitive match on the full name or the first name alone —
    the session name is free text with no auth, so we can't be stricter."""
    claimed = claimed.casefold()
    stored = name.casefold()
    return claimed == stored or claimed == stored.split()[0]


def _assert_is_editor(requested_by: str) -> None:
    """Only `EDITOR_NAME` may *edit* an existing player card. Creation is
    looser — see `_assert_can_create`."""
    if not _matches(requested_by, EDITOR_NAME):
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Only {EDITOR_NAME} can edit player cards")


async def _assert_can_create(session: AsyncSession, *, name: str, requested_by: str) -> None:
    """Who may *create* a card.

    The editor can create anyone's card. Anyone else may create exactly one
    card, for their own name — that's how a new member self-onboards so they
    can enrol in events. After that the card is editor-only (see
    `update_player`), so a member sets their starting values once but can't
    keep re-rating themselves.
    """
    if _matches(requested_by, EDITOR_NAME):
        return
    if name.strip().casefold() != requested_by.strip().casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only create your own card")
    existing = await session.scalar(
        select(Player).where(func.lower(Player.name) == name.strip().casefold())
    )
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "A card with this name already exists")


def _assert_is_admin(requested_by: str) -> None:
    """Only an `ADMIN_NAMES` member may delete cards or edit notes."""
    if not any(_matches(requested_by, name) for name in ADMIN_NAMES):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")


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
    await _assert_can_create(session, name=payload.name, requested_by=payload.requested_by)
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


def to_contact_status(player: Player) -> PlayerContactStatus:
    return PlayerContactStatus(
        id=player.id,
        name=player.name,
        has_phone=bool(player.phone_number),
        tier=player.tier,
    )


async def list_contact_status(session: AsyncSession) -> list[PlayerContactStatus]:
    return [to_contact_status(player) for player in await list_players(session)]


async def list_contact_status_for_admin(session: AsyncSession, requested_by: str) -> list[PlayerContactStatus]:
    """Same listing as the secret-gated admin router, reachable from the
    admin portal instead — see `set_player_phone_for_admin`."""
    _assert_is_admin(requested_by)
    return await list_contact_status(session)


async def set_player_phone_for_admin(
    session: AsyncSession, player_id: uuid.UUID, phone_number: str | None, requested_by: str
) -> PlayerContactStatus:
    """Admin-portal phone write (session-name gated, same trust boundary as
    notes and card deletion) rather than the secret-gated `/admin` router.
    A non-empty number that doesn't parse is rejected rather than stored
    unreachable — the org-wide default region backs numbers with no country
    code, but a genuinely malformed number should fail loudly here, not
    silently at send time weeks later.
    """
    _assert_is_admin(requested_by)
    normalized = phone_number.strip() if phone_number else None
    if normalized:
        normalized = normalize_phone(normalized)
        if normalized is None:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Could not read this phone number. Include a country code, e.g. +48501234567.",
            )
    player = await set_player_phone(session, player_id, normalized)
    return to_contact_status(player)


async def set_player_tier(session: AsyncSession, player_id: uuid.UUID, tier: str) -> Player:
    """Write a player's invite-ladder tier. Callable only from the admin router."""
    player = await get_player(session, player_id)
    player.tier = tier
    await session.commit()
    await session.refresh(player)
    return player


async def set_player_notes(
    session: AsyncSession, player_id: uuid.UUID, notes: str | None, requested_by: str
) -> Player:
    """Admin-only scouting notes for a player. Separate from `update_player`
    (which is editor-only and rewrites the whole card) so an admin who isn't
    the ratings editor can still keep notes without touching ratings."""
    _assert_is_admin(requested_by)
    player = await get_player(session, player_id)
    player.notes = notes
    await session.commit()
    await session.refresh(player)
    return player


async def delete_player(session: AsyncSession, player_id: uuid.UUID, requested_by: str) -> None:
    """Admin-only hard delete of a player card, allowed even when the player
    is linked to past or upcoming events.

    Two foreign keys to `players` have no database-level `ondelete` rule:
    `registrations.player_id` and `team_players.player_id`. Both are **unlinked**
    (set to NULL) rather than deleted, so event rosters and past team line-ups
    keep their `display_name` and stay intact — the card is removed without
    rewriting history. If a card with the same name is created later,
    `_backfill_registrations` re-links it. Every other reference
    (reminders, consent → SET NULL; votes, tokens → CASCADE) is handled by
    the schema.
    """
    _assert_is_admin(requested_by)
    player = await get_player(session, player_id)
    await session.execute(
        update(Registration).where(Registration.player_id == player_id).values(player_id=None)
    )
    await session.execute(
        update(TeamPlayer).where(TeamPlayer.player_id == player_id).values(player_id=None)
    )
    await session.delete(player)
    await session.commit()
