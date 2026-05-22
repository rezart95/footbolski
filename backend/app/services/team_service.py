import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agent.agent_router import run_split
from app.models import ListStatus, Registration, Team, TeamPlayer
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
    try:
        await run_split(str(event_id))
    except NotImplementedError as exc:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "AI team generation belongs to Phase 3") from exc
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
