import uuid
from datetime import date, time

from pydantic import BaseModel

from app.models.enums import EventStatus, ListStatus, PaymentMethod


class HistoryItem(BaseModel):
    """One match a person signed up for, with their own place on it and what
    they owe. Carries only what the match page already shows publicly."""

    event_id: uuid.UUID
    event_date: date
    event_time: time
    status: EventStatus
    venue_name: str
    registration_id: uuid.UUID
    list_status: ListStatus
    position: int
    has_paid: bool
    price_per_person: float | None
    pay_to_name: str | None
    payment_method: PaymentMethod | None
    payment_details: str | None
