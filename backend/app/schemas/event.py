import uuid
from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EventStatus
from app.schemas.venue import VenueRead


class EventCreate(BaseModel):
    venue_id: uuid.UUID
    event_date: date
    event_time: time
    max_players: int = Field(gt=0)
    created_by_name: str = Field(min_length=1, max_length=255)


class CreatorAction(BaseModel):
    created_by_name: str = Field(min_length=1, max_length=255)


class EventRead(BaseModel):
    id: uuid.UUID
    venue: VenueRead
    event_date: date
    event_time: time
    max_players: int
    created_by_name: str
    status: EventStatus
    teams_generated: bool
    confirmed_count: int
    waitlist_count: int

    model_config = ConfigDict(from_attributes=True)
