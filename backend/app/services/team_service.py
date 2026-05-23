import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ListStatus, PlayerPosition, Registration, Team, TeamPlayer, Venue
from app.schemas.team import FormationUpdate
from app.services.event_service import get_event


async def get_teams(session: AsyncSession, event_id: uuid.UUID) -> list[Team] | None:
    stmt = (
        select(Team)
        .options(selectinload(Team.players))
        .where(Team.event_id == event_id)
        .order_by(Team.label)
    )
    teams = list((await session.scalars(stmt)).all())
    return teams or None


async def generate_teams(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> list[Team]:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can split teams")
    if event.teams_generated:
        raise HTTPException(status.HTTP_409_CONFLICT, "Teams have already been generated")
    confirmed = await session.scalar(
        select(func.count()).select_from(Registration).where(
            Registration.event_id == event_id,
            Registration.list_status == ListStatus.CONFIRMED,
        )
    )
    if int(confirmed or 0) != event.max_players:
        raise HTTPException(status.HTTP_409_CONFLICT, "Event must be full before splitting teams")

    # Load confirmed registrations with linked player data
    regs_result = await session.scalars(
        select(Registration)
        .options(selectinload(Registration.player))
        .where(Registration.event_id == event_id, Registration.list_status == ListStatus.CONFIRMED)
        .order_by(Registration.position)
    )
    regs = list(regs_result.all())

    # Load venue for players_per_side
    venue = await session.get(Venue, event.venue_id)
    players_per_side: int = venue.players_per_side if venue else 7

    # Sort by skill rating descending (unlinked players treated as average = 5)
    def skill(reg: Registration) -> float:
        return float(reg.player.skill_rating) if reg.player else 5.0

    regs_sorted = sorted(regs, key=skill, reverse=True)

    # Snake draft: picks go A, B, B, A, A, B, B, A, …
    team_a_regs: list[Registration] = []
    team_b_regs: list[Registration] = []
    for i, reg in enumerate(regs_sorted):
        pair = i // 2
        pos_in_pair = i % 2
        if pair % 2 == 0:
            (team_a_regs if pos_in_pair == 0 else team_b_regs).append(reg)
        else:
            (team_b_regs if pos_in_pair == 0 else team_a_regs).append(reg)

    # Sort each team: GK first, then DEF, MID, ATT
    _position_order = {PlayerPosition.GK: 0, PlayerPosition.DEF: 1, PlayerPosition.MID: 2, PlayerPosition.ATT: 3}

    def sort_by_position(regs: list[Registration]) -> list[Registration]:
        def key(r: Registration) -> int:
            if r.player:
                return _position_order.get(r.player.primary_position, 2)
            return 2
        return sorted(regs, key=key)

    team_a_regs = sort_by_position(team_a_regs)
    team_b_regs = sort_by_position(team_b_regs)

    # Default formation based on outfield players (= players_per_side - 1 GK)
    def default_formation(n_outfield: int) -> str:
        if n_outfield >= 6:
            return "2-2-2"
        if n_outfield == 5:
            return "2-2-1"
        return "2-1-1"

    formation_a = default_formation(len(team_a_regs) - 1)
    formation_b = default_formation(len(team_b_regs) - 1)

    # Compute slot positions for each team (mirrors slotsForFormation in TS)
    def slots_for_formation(formation: str, top_half: bool) -> list[dict]:
        rows = [int(x) for x in formation.split("-")]
        row_y = [76.0, 52.0, 28.0] if top_half else [24.0, 48.0, 72.0]
        roles = [PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.ATT]
        result = [{"x": 50.0, "y": 94.0 if top_half else 6.0, "role": PlayerPosition.GK}]
        for row_idx, count in enumerate(rows):
            for j in range(count):
                x = ((j + 1) / (count + 1)) * 100.0
                result.append({"x": x, "y": row_y[row_idx], "role": roles[row_idx]})
        return result

    a_slots = slots_for_formation(formation_a, top_half=True)
    b_slots = slots_for_formation(formation_b, top_half=False)

    # Create Team A (green, top half) and Team B (white, bottom half)
    team_a = Team(event_id=event_id, label="Team A", color="green", formation=formation_a)
    team_b = Team(event_id=event_id, label="Team B", color="white", formation=formation_b)
    session.add(team_a)
    session.add(team_b)
    await session.flush()

    for i, reg in enumerate(team_a_regs):
        slot = a_slots[i] if i < len(a_slots) else {"x": 50.0, "y": 50.0, "role": PlayerPosition.MID}
        session.add(TeamPlayer(
            team_id=team_a.id,
            player_id=reg.player_id,
            display_name=reg.display_name,
            position_role=slot["role"],
            pitch_x=slot["x"],
            pitch_y=slot["y"],
        ))

    for i, reg in enumerate(team_b_regs):
        slot = b_slots[i] if i < len(b_slots) else {"x": 50.0, "y": 50.0, "role": PlayerPosition.MID}
        session.add(TeamPlayer(
            team_id=team_b.id,
            player_id=reg.player_id,
            display_name=reg.display_name,
            position_role=slot["role"],
            pitch_x=slot["x"],
            pitch_y=slot["y"],
        ))

    event.teams_generated = True
    await session.commit()
    return await get_teams(session, event_id) or []


async def update_formation(session: AsyncSession, event_id: uuid.UUID, payload: FormationUpdate) -> list[Team] | None:
    team = await session.get(Team, payload.team_id)
    if not team or team.event_id != event_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    team.formation = payload.formation
    for item in payload.players:
        player = await session.get(TeamPlayer, item.id)
        if player and player.team_id == team.id:
            player.pitch_x = item.pitch_x
            player.pitch_y = item.pitch_y
    await session.commit()
    return await get_teams(session, event_id)
