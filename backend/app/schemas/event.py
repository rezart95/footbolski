import uuid
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EventStatus, PaymentMethod
from app.schemas.venue import VenueRead


class EventCreate(BaseModel):
    venue_id: uuid.UUID
    event_date: date
    event_time: time
    max_players: int = Field(gt=0)
    created_by_name: str = Field(min_length=1, max_length=255)
    price_per_person: float | None = None
    pay_to_name: str | None = None
    payment_method: PaymentMethod | None = None
    payment_details: str | None = Field(default=None, max_length=100)


class CreatorAction(BaseModel):
    created_by_name: str = Field(min_length=1, max_length=255)


class EventCostUpdate(BaseModel):
    """The amount actually paid for the pitch, entered by the organiser after full time."""

    created_by_name: str = Field(min_length=1, max_length=255)
    total_cost: Decimal = Field(gt=0, le=Decimal("99999.99"), max_digits=7, decimal_places=2)


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
    payment_method: PaymentMethod | None = None
    payment_details: str | None = None
    total_cost: float | None = None
    cost_set_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
