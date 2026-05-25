import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import ListStatus, PlayerPosition, Registration, Team, TeamPlayer, Venue
from app.models.player import Player
from app.schemas.team import FormationUpdate
from app.services.event_service import get_event
# ---------------------------------------------------------------------------
# Composite scoring
# ---------------------------------------------------------------------------
# Weights for each attribute.  skill_rating is the overall anchor;
# the rest fine-tune balance across physical and technical dimensions.
_ATTR_WEIGHTS: dict[str, float] = {
    "skill_rating": 3.0,
    "speed": 1.0,
    "technique": 1.5,
    "defending": 1.0,
    "shooting": 1.0,
    "aerial": 0.5,
    "stamina": 1.0,
    "work_rate": 1.0,
}
_TOTAL_WEIGHT: float = sum(_ATTR_WEIGHTS.values())  # 10.0


def _composite(player: Player | None, guest_profile: dict | None = None) -> float:
    """Return a weighted composite score 1-10 for a player.

    Priority: linked Player profile > guest_profile dict > default 5.0.
    For any attribute missing from a profile, the overall skill_rating is used
    as the fallback so partial profiles still sort sensibly.
    """
    if player is not None:
        base = float(player.skill_rating)
        total = sum(
            w * float(getattr(player, attr) if getattr(player, attr) is not None else base)
            for attr, w in _ATTR_WEIGHTS.items()
        )
        return total / _TOTAL_WEIGHT

    if guest_profile:
        base = float(guest_profile.get("skill_rating") or 5)
        total = sum(
            w * float(guest_profile.get(attr) or base)
            for attr, w in _ATTR_WEIGHTS.items()
        )
        return total / _TOTAL_WEIGHT

    return 5.0


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

    # --- AI split (Claude) or algorithmic fallback ---
    from app.agent.agent_router import run_split
    split = await run_split(str(event_id), regs=regs)

    if "team_a" in split and "team_b" in split:
        # Map player names returned by Claude/algorithm back to registrations.
        # Match by player.name first, then display_name (case-insensitive).
        def _reg_name(r: Registration) -> str:
            return (r.player.name if r.player else r.display_name).casefold()

        name_to_reg = {_reg_name(r): r for r in regs}

        team_a_regs = [name_to_reg[n.casefold()] for n in split["team_a"] if n.casefold() in name_to_reg]
        team_b_regs = [name_to_reg[n.casefold()] for n in split["team_b"] if n.casefold() in name_to_reg]

        # Safety: any reg not matched by name goes to the shorter team
        assigned = set(id(r) for r in team_a_regs + team_b_regs)
        for r in regs:
            if id(r) not in assigned:
                (team_a_regs if len(team_a_regs) <= len(team_b_regs) else team_b_regs).append(r)
    else:
        # Pure fallback: sort by composite score and snake-draft
        def score(reg: Registration) -> float:
            return _composite(reg.player, reg.guest_profile)

        regs_sorted = sorted(regs, key=score, reverse=True)
        team_a_regs, team_b_regs = [], []
        for i, reg in enumerate(regs_sorted):
            pair = i // 2
            if pair % 2 == 0:
                (team_a_regs if i % 2 == 0 else team_b_regs).append(reg)
            else:
                (team_b_regs if i % 2 == 0 else team_a_regs).append(reg)

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
        row_y = [24.0, 48.0, 72.0] if top_half else [76.0, 52.0, 28.0]
        roles = [PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.ATT]
        result = [{"x": 50.0, "y": 6.0 if top_half else 94.0, "role": PlayerPosition.GK}]
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
