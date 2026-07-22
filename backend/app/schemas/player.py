"""Pydantic schemas for player cards.

`phone_number` is deliberately absent from every schema in this module. It lives
on the model but must never be serialised to a client: `PlayerRead` is returned
by the public `GET /api/v1/players`, which has no authentication in front of it.
Numbers are written only through the shared-secret admin endpoint in
`api/v1/routes/admin.py` and read only server-side by the notification services.
"""

import uuid
from datetime import datetime
from typing import Literal

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


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(PlayerBase):
    """Fields a player may change on their own card.

    Applied with `exclude_unset=True`, so a payload that omits a field leaves the
    stored value alone rather than resetting it to this schema's default.
    """


class PlayerPhoneUpdate(BaseModel):
    """Admin-only phone write. Never part of PlayerBase — see the module docstring."""

    phone_number: str | None = Field(default=None, max_length=32)


class PlayerTierUpdate(BaseModel):
    """Admin-only tier write. Same confidentiality rule as phone_number: `tier`
    is never part of PlayerBase, so it can never reach a player-facing response —
    a visible core/rest label in a friend group is a social hazard with no
    product upside (see DESIGN.md)."""

    tier: Literal["core", "rest"]


class PlayerRead(PlayerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
