import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PlayerPosition


class PlayerBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    photo_url: str | None = None
    skill_rating: int = Field(default=5, ge=1, le=10)
    primary_position: PlayerPosition = PlayerPosition.MID
    attributes: list[str] = Field(default_factory=list, max_length=4)

    # Physical profile
    age: int | None = Field(default=None, ge=10, le=80)
    height_cm: int | None = Field(default=None, ge=140, le=220)
    build: str | None = Field(default=None, max_length=50)
    preferred_role: str | None = Field(default=None, max_length=100)

    # Attribute ratings 1–10
    speed: int | None = Field(default=None, ge=1, le=10)
    technique: int | None = Field(default=None, ge=1, le=10)
    defending: int | None = Field(default=None, ge=1, le=10)
    shooting: int | None = Field(default=None, ge=1, le=10)
    aerial: int | None = Field(default=None, ge=1, le=10)
    stamina: int | None = Field(default=None, ge=1, le=10)
    work_rate: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = Field(default=None, max_length=500)

    # Contact
    phone_number: str | None = Field(default=None, max_length=32)


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(PlayerBase):
    pass


class PlayerRead(PlayerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
