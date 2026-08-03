import uuid

from fastapi import APIRouter, Query, Response, status

from app.dependencies import SessionDep
from app.schemas.player import (
    PlayerContactStatus,
    PlayerCreate,
    PlayerDelete,
    PlayerNotesUpdate,
    PlayerPhoneUpdateByName,
    PlayerRead,
    PlayerUpdate,
)
from app.services import player_service

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerRead])
async def list_players(session: SessionDep):
    return await player_service.list_players(session)


@router.get("/admin/contact", response_model=list[PlayerContactStatus])
async def list_contact_status(session: SessionDep, requested_by: str = Query(min_length=1, max_length=255)):
    """Admin-portal view of who's reachable, with no digits in it — the
    session-name-gated counterpart to the secret-gated `/admin/players/contact`."""
    return await player_service.list_contact_status_for_admin(session, requested_by)


@router.post("", response_model=PlayerRead, status_code=201)
async def create_player(payload: PlayerCreate, session: SessionDep):
    return await player_service.create_player(session, payload)


@router.get("/{player_id}", response_model=PlayerRead)
async def get_player(player_id: uuid.UUID, session: SessionDep):
    return await player_service.get_player(session, player_id)


@router.put("/{player_id}", response_model=PlayerRead)
async def update_player(player_id: uuid.UUID, payload: PlayerUpdate, session: SessionDep):
    return await player_service.update_player(session, player_id, payload)


@router.patch("/{player_id}/notes", response_model=PlayerRead)
async def update_player_notes(player_id: uuid.UUID, payload: PlayerNotesUpdate, session: SessionDep):
    return await player_service.set_player_notes(session, player_id, payload.notes, payload.requested_by)


@router.patch("/{player_id}/phone", response_model=PlayerContactStatus)
async def update_player_phone(player_id: uuid.UUID, payload: PlayerPhoneUpdateByName, session: SessionDep):
    """Admin-portal phone write — same session-name gate as notes and deletion.
    Never returns the number itself, only whether one is now on file."""
    return await player_service.set_player_phone_for_admin(
        session, player_id, payload.phone_number, payload.requested_by
    )


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_player(player_id: uuid.UUID, payload: PlayerDelete, session: SessionDep) -> Response:
    await player_service.delete_player(session, player_id, payload.requested_by)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/relink-registrations", response_model=dict)
async def relink_registrations(session: SessionDep):
    """Back-fill player_id on all registrations where display_name matches a known player."""
    count = await player_service.relink_all_registrations(session)
    return {"linked": count}
