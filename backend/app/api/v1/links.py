"""Public endpoints behind the links we send in messages: invites and ballots.

These are reached from a WhatsApp message, so the token in the URL is the only
credential. They are deliberately tolerant: a spent or unknown link still
returns enough for the page to explain what happened and offer a way onward,
because the person tapping it is usually somebody actively trying to play.
"""

import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from app.dependencies import SessionDep
from app.models import TokenPurpose
from app.services import event_service, motm_service, token_service

router = APIRouter(tags=["links"])


class VoteRequest(BaseModel):
    nominee_player_id: uuid.UUID


@router.get("/invite/{token}")
async def read_invite(token: str, session: SessionDep):
    """What this invite refers to, and whether it has been used."""
    resolved = await token_service.resolve(session, token, TokenPurpose.INVITE)
    event = await event_service.as_read(session, resolved.event)
    return {
        "spent": resolved.is_spent,
        "player_name": resolved.player.name,
        "event": event,
    }


@router.post("/invite/{token}/confirm")
async def confirm_invite(token: str, session: SessionDep):
    """Claim the place. Returns confirmed, waitlisted, already registered, or cancelled."""
    result = await token_service.redeem_invite(session, token)
    resolved = await token_service.resolve(session, token, TokenPurpose.INVITE)
    result["event"] = await event_service.as_read(session, resolved.event)
    return result


@router.get("/motm/{token}")
async def read_ballot(token: str, session: SessionDep):
    """The ballot. Never includes any vote, only the candidates."""
    return await motm_service.ballot(session, token)


@router.post("/motm/{token}/vote")
async def cast_vote(token: str, payload: VoteRequest, session: SessionDep):
    return await motm_service.cast_vote(session, token, payload.nominee_player_id)


@router.get("/events/{event_id}/motm")
async def event_motm_result(event_id: uuid.UUID, session: SessionDep):
    """The winner, once voting has closed. Aggregate only, never a single vote."""
    event = await event_service.get_event(session, event_id)
    return await motm_service.result(session, event)
