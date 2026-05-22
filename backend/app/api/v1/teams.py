import uuid

from fastapi import APIRouter

from app.dependencies import SessionDep
from app.schemas.event import CreatorAction
from app.schemas.team import FormationUpdate, TeamRead
from app.services import team_service

router = APIRouter(prefix="/events/{event_id}/teams", tags=["teams"])


@router.get("", response_model=list[TeamRead] | None)
async def get_teams(event_id: uuid.UUID, session: SessionDep):
    return await team_service.get_teams(session, event_id)


@router.post("/generate", response_model=list[TeamRead])
async def generate_teams(event_id: uuid.UUID, payload: CreatorAction, session: SessionDep):
    return await team_service.generate_teams(session, event_id, payload.created_by_name)


@router.patch("/formation", response_model=list[TeamRead] | None)
async def update_formation(event_id: uuid.UUID, payload: FormationUpdate, session: SessionDep):
    return await team_service.update_formation(session, event_id, payload)
