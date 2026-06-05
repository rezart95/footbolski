import uuid

from fastapi import APIRouter, Query

from app.dependencies import SessionDep
from app.models import EventStatus
from app.schemas.event import CreatorAction, EventCreate, EventRead
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventRead])
async def list_events(
    session: SessionDep,
    status: EventStatus | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    return await event_service.list_events(session, status, limit, offset)


@router.get("/upcoming", response_model=EventRead | None)
async def upcoming_event(session: SessionDep) -> dict | None:
    return await event_service.upcoming_event(session)


@router.post("", response_model=EventRead, status_code=201)
async def create_event(payload: EventCreate, session: SessionDep) -> dict:
    return await event_service.create_event(session, payload)


@router.get("/{event_id}", response_model=EventRead)
async def get_event(event_id: uuid.UUID, session: SessionDep) -> dict:
    event = await event_service.get_event(session, event_id)
    return await event_service.as_read(session, event)


@router.patch("/{event_id}/cancel", response_model=EventRead)
async def cancel_event(event_id: uuid.UUID, payload: CreatorAction, session: SessionDep) -> dict:
    return await event_service.cancel_event(session, event_id, payload.created_by_name)


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: uuid.UUID, payload: CreatorAction, session: SessionDep) -> None:
    await event_service.delete_event(session, event_id, payload.created_by_name)
