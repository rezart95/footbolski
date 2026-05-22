import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ListStatus


class RegistrationCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)


class RegistrationLeave(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)


class PaymentUpdate(BaseModel):
    has_paid: bool


class RegistrationRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    player_id: uuid.UUID | None
    display_name: str
    list_status: ListStatus
    position: int
    has_paid: bool
    paid_at: datetime | None
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)
