import uuid

from fastapi import APIRouter, Response, status

from app.dependencies import SessionDep
from app.models.reminder import ReminderChannel
from app.schemas.registration import GuestProfileUpdate, PaymentUpdate, RegistrationCreate, RegistrationLeave, RegistrationRead
from app.schemas.reminder import ReminderRequest, ReminderResult
from app.services import reminder_service, registration_service

router = APIRouter(prefix="/events/{event_id}/registrations", tags=["registrations"])


@router.get("", response_model=list[RegistrationRead])
async def list_registrations(event_id: uuid.UUID, session: SessionDep):
    return await registration_service.list_registrations(session, event_id)


@router.post("", response_model=RegistrationRead, status_code=201)
async def register(event_id: uuid.UUID, payload: RegistrationCreate, session: SessionDep):
    return await registration_service.register(session, event_id, payload.display_name)


@router.delete("/{registration_id}", status_code=204)
async def unregister(
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    payload: RegistrationLeave,
    session: SessionDep,
) -> Response:
    await registration_service.unregister(session, event_id, registration_id, payload.display_name)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{registration_id}/payment", response_model=RegistrationRead)
async def update_payment(
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    payload: PaymentUpdate,
    session: SessionDep,
):
    return await registration_service.set_payment(session, registration_id, payload.has_paid)


@router.patch("/{registration_id}/guest-profile", response_model=RegistrationRead)
async def update_guest_profile(
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    payload: GuestProfileUpdate,
    session: SessionDep,
):
    """Set or update the attribute profile for a guest player (no linked player profile)."""
    return await registration_service.update_guest_profile(session, event_id, registration_id, payload.guest_profile)


@router.post("/{registration_id}/remind", response_model=ReminderResult)
async def remind(
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    payload: ReminderRequest,
    session: SessionDep,
):
    return await reminder_service.send_reminder(
        session,
        event_id=event_id,
        registration_id=registration_id,
        channel=ReminderChannel(payload.channel),
    )

