from fastapi import APIRouter
from sqlalchemy import select

from app.dependencies import SessionDep
from app.models import Venue
from app.schemas.venue import VenueRead

router = APIRouter(prefix="/venues", tags=["venues"])


@router.get("", response_model=list[VenueRead])
async def list_venues(session: SessionDep) -> list[Venue]:
    return list((await session.scalars(select(Venue).order_by(Venue.name))).all())
