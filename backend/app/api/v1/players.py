import uuid

from fastapi import APIRouter, UploadFile, status

from app.dependencies import SessionDep
from app.schemas.player import PlayerCreate, PlayerRead, PlayerUpdate
from app.services import player_service, storage_service

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


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player(player_id: uuid.UUID, session: SessionDep):
    await player_service.delete_player(session, player_id)


@router.post("/{player_id}/photo")
async def upload_photo(player_id: uuid.UUID, file: UploadFile, session: SessionDep):
    player = await player_service.get_player(session, player_id)
    player.photo_url = await storage_service.upload_player_photo(file, player_id)
    await session.commit()
    return {"photo_url": player.photo_url}
