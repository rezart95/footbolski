"""Team generation and formation persistence.

Orchestration only: permission checks, loading registrations, calling the AI
split, writing teams, and notifying players. The balancing rules live in
`team_balance` and the pitch geometry in `pitch_layout`, so this module stays
about *what happens* rather than *how a side is chosen*.
"""

import asyncio
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ListStatus, PlayerPosition, PushSubscription, Registration, Team, TeamPlayer
from app.schemas.team import FormationUpdate
from app.services import pitch_layout, team_balance
from app.services.event_service import _app_url, _send_pushes_bg, get_event

FALLBACK_SLOT = {"x": 50.0, "y": 50.0, "role": PlayerPosition.MID}
"""Used if a side somehow has more players than its formation has slots."""


async def get_teams(session: AsyncSession, event_id: uuid.UUID) -> list[Team] | None:
    stmt = (
        select(Team)
        .options(selectinload(Team.players))
        .where(Team.event_id == event_id)
        .order_by(Team.label)
    )
    teams = list((await session.scalars(stmt)).all())
    return teams or None


def _assert_is_creator(event, creator_name: str) -> None:
    """Only the organiser may split teams. Matched case-insensitively, and on
    first name alone, because the session name is free text with no auth."""
    claimed = creator_name.casefold()
    stored = event.created_by_name.casefold()
    if claimed != stored and claimed != stored.split()[0]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can split teams")


async def _load_confirmed_registrations(
    session: AsyncSession, event_id: uuid.UUID
) -> list[Registration]:
    result = await session.scalars(
        select(Registration)
        .options(selectinload(Registration.player))
        .where(Registration.event_id == event_id, Registration.list_status == ListStatus.CONFIRMED)
        .order_by(Registration.position)
    )
    return list(result.all())


async def _assert_event_is_full(session: AsyncSession, event) -> None:
    confirmed = await session.scalar(
        select(func.count()).select_from(Registration).where(
            Registration.event_id == event.id,
            Registration.list_status == ListStatus.CONFIRMED,
        )
    )
    if int(confirmed or 0) != event.max_players:
        raise HTTPException(status.HTTP_409_CONFLICT, "Event must be full before splitting teams")


def _persist_side(
    session: AsyncSession,
    team: Team,
    registrations: list[Registration],
    slots: list[dict],
) -> None:
    for index, registration in enumerate(registrations):
        slot = slots[index] if index < len(slots) else FALLBACK_SLOT
        session.add(
            TeamPlayer(
                team_id=team.id,
                player_id=registration.player_id,
                display_name=registration.display_name,
                position_role=slot["role"],
                pitch_x=slot["x"],
                pitch_y=slot["y"],
            )
        )


async def _notify_teams_posted(session: AsyncSession, event) -> None:
    """Tell confirmed players their side is up. Once per match, participants only."""
    stmt = (
        select(PushSubscription)
        .join(Registration, Registration.player_id == PushSubscription.player_id)
        .where(Registration.event_id == event.id, Registration.list_status == ListStatus.CONFIRMED)
    )
    subscriptions = list((await session.scalars(stmt)).all())
    if not subscriptions:
        return

    payload = [{"endpoint": s.endpoint, "p256dh": s.p256dh, "auth": s.auth} for s in subscriptions]
    when = event.event_date.strftime("%a %d %b")
    asyncio.ensure_future(
        _send_pushes_bg(
            payload,
            title="Teams are up!",
            body=f"Teams have been posted for the match at {event.venue.name} on {when}. Tap to see your side.",
            url=f"{_app_url()}/events/{event.id}",
        )
    )


async def generate_teams(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> list[Team]:
    event = await get_event(session, event_id)
    _assert_is_creator(event, creator_name)
    if event.teams_generated:
        raise HTTPException(status.HTTP_409_CONFLICT, "Teams have already been generated")
    await _assert_event_is_full(session, event)

    registrations = await _load_confirmed_registrations(session, event_id)

    # Note: the venue's players_per_side is deliberately not consulted. Formation
    # is derived from the actual size of each side, which is what turns up.

    from app.agent.agent_router import run_split

    split = await run_split(str(event_id), regs=registrations)

    # Keep the AI's reasoning on the event so the split can be explained later.
    if split.get("reasoning"):
        event.ai_reasoning = split["reasoning"]
    if split.get("swap_options"):
        event.ai_swap_options = split["swap_options"]
    session.add(event)

    if "team_a" in split and "team_b" in split:
        side_a, side_b = team_balance.split_by_name(registrations, split["team_a"], split["team_b"])
    else:
        side_a, side_b = team_balance.snake_draft(registrations)

    side_a = team_balance.sort_by_position(side_a)
    side_b = team_balance.sort_by_position(side_b)

    formation_a = pitch_layout.default_formation(len(side_a) - 1)
    formation_b = pitch_layout.default_formation(len(side_b) - 1)

    team_a = Team(event_id=event_id, label="Team A", color="green", formation=formation_a)
    team_b = Team(event_id=event_id, label="Team B", color="white", formation=formation_b)
    session.add(team_a)
    session.add(team_b)
    await session.flush()

    _persist_side(session, team_a, side_a, pitch_layout.slots_for_formation(formation_a, top_half=True))
    _persist_side(session, team_b, side_b, pitch_layout.slots_for_formation(formation_b, top_half=False))

    event.teams_generated = True
    await session.commit()

    await _notify_teams_posted(session, event)
    return await get_teams(session, event_id) or []


async def update_formation(
    session: AsyncSession, event_id: uuid.UUID, payload: FormationUpdate
) -> list[Team] | None:
    team = await session.get(Team, payload.team_id)
    if not team or team.event_id != event_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    team.formation = payload.formation
    for item in payload.players:
        team_player = await session.get(TeamPlayer, item.id)
        if team_player and team_player.team_id == team.id:
            team_player.pitch_x = item.pitch_x
            team_player.pitch_y = item.pitch_y
    await session.commit()
    return await get_teams(session, event_id)
