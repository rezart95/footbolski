import uuid

from fastapi import APIRouter

from app.dependencies import SessionDep
from app.schemas.player import PlayerCreate, PlayerRead, PlayerUpdate
from app.services import player_service

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerRead])
async def list_players(session: SessionDep):
    return await player_service.list_players(session)


@router.post("", response_model=PlayerRead, status_code=201)
async def create_player(payload: PlayerCreate, session: SessionDep):
    return await player_service.create_player(session, payload)


@router.get("/{player_id}", response_model=PlayerRead)
async def get_player(player_id: uuid.UUID, session: SessionDep):
    return await player_service.get_player(session, player_id)


@router.put("/{player_id}", response_model=PlayerRead)
async def update_player(player_id: uuid.UUID, payload: PlayerUpdate, session: SessionDep):
    return await player_service.update_player(session, player_id, payload)


@router.post("/relink-registrations", response_model=dict)
async def relink_registrations(session: SessionDep):
    """Back-fill player_id on all registrations where display_name matches a known player."""
    count = await player_service.relink_all_registrations(session)
    return {"linked": count}
