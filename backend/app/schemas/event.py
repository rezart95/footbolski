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
    price_per_person: float | None = None
    pay_to_name: str | None = None


class CreatorAction(BaseModel):
    created_by_name: str = Field(min_length=1, max_length=255)


class SwapOption(BaseModel):
    swap: str
    reason: str


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
    ai_reasoning: str | None = None
    ai_swap_options: list[SwapOption] | None = None
    price_per_person: float | None = None
    pay_to_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
