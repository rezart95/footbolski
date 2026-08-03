"""Owner-only routes guarded by the `X-Internal-Secret` shared secret.

Phone numbers are write-only from the outside world: they can be set here and
read only by the server-side notification services. Nothing in this module ever
returns a phone number in a response body — reachability is reported as a
boolean, per the confidentiality rule in the design doc (§5.6).
"""

import uuid

from fastapi import APIRouter

from app.dependencies import InternalSecretDep, SessionDep
from app.schemas.player import PlayerContactStatus, PlayerPhoneUpdate, PlayerTierUpdate
from app.services import player_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/players/contact", response_model=list[PlayerContactStatus])
async def list_contact_status(session: SessionDep, _guard: InternalSecretDep):
    """Show which players are reachable, so coverage is auditable without exposing numbers."""
    return await player_service.list_contact_status(session)


@router.put("/players/{player_id}/phone", response_model=PlayerContactStatus)
async def set_player_phone(
    player_id: uuid.UUID,
    payload: PlayerPhoneUpdate,
    session: SessionDep,
    _guard: InternalSecretDep,
):
    """Set or clear a player's phone number. Send `null` to remove it."""
    player = await player_service.set_player_phone(session, player_id, payload.phone_number)
    return player_service.to_contact_status(player)


@router.put("/players/{player_id}/tier", response_model=PlayerContactStatus)
async def set_player_tier(
    player_id: uuid.UUID,
    payload: PlayerTierUpdate,
    session: SessionDep,
    _guard: InternalSecretDep,
):
    """Set whether a player is on the T-5 (core) or T-3 (rest) invite rung."""
    player = await player_service.set_player_tier(session, player_id, payload.tier)
    return player_service.to_contact_status(player)
