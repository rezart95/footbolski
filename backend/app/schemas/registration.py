import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ListStatus


class GuestProfile(BaseModel):
    """Attributes the organizer can fill in for a guest with no player profile."""
    skill_rating: int | None = Field(default=None, ge=1, le=10)
    age: int | None = Field(default=None, ge=10, le=80)
    height_cm: int | None = Field(default=None, ge=140, le=220)
    build: str | None = Field(default=None, max_length=50)
    preferred_role: str | None = Field(default=None, max_length=100)
    speed: int | None = Field(default=None, ge=1, le=10)
    technique: int | None = Field(default=None, ge=1, le=10)
    defending: int | None = Field(default=None, ge=1, le=10)
    shooting: int | None = Field(default=None, ge=1, le=10)
    aerial: int | None = Field(default=None, ge=1, le=10)
    stamina: int | None = Field(default=None, ge=1, le=10)
    work_rate: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = Field(default=None, max_length=500)


class RegistrationCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)


class RegistrationLeave(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)


class PaymentUpdate(BaseModel):
    has_paid: bool


class GuestProfileUpdate(BaseModel):
    guest_profile: GuestProfile | None = None


class RegistrationRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    player_id: uuid.UUID | None
    display_name: str
    list_status: ListStatus
    position: int
    has_paid: bool
    paid_at: datetime | None
    guest_profile: dict | None
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)

