"""Pydantic schemas for player cards.

`phone_number` is absent from every *player-facing* schema — `PlayerRead` is
returned by the public `GET /api/v1/players`, which has no authentication in
front of it, so a number must never reach that response. The one deliberate
exception is `PlayerContactDetail`, reachable only through the session-name-
gated admin portal (same trust boundary as notes and card deletion) — the
group has chosen to trust that boundary with the number itself, not just
whether one exists. `PlayerContactStatus` (no digits) remains for the
secret-gated `/admin` router used by the scheduler and other server-side callers.
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

    # Physical profile
    age: int | None = Field(default=None, ge=10, le=80)
    height_cm: int | None = Field(default=None, ge=140, le=220)
    build: str | None = Field(default=None, max_length=50)
    preferred_role: str | None = Field(default=None, max_length=100)

    # Attribute ratings 1–10
    speed: int | None = Field(default=None, ge=1, le=10)
    technique: int | None = Field(default=None, ge=1, le=10)
    passing: int | None = Field(default=None, ge=1, le=10)
    defending: int | None = Field(default=None, ge=1, le=10)
    shooting: int | None = Field(default=None, ge=1, le=10)
    aerial: int | None = Field(default=None, ge=1, le=10)
    stamina: int | None = Field(default=None, ge=1, le=10)
    work_rate: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = Field(default=None, max_length=500)


class PlayerCreate(PlayerBase):
    requested_by: str = Field(min_length=1, max_length=255)


class PlayerUpdate(PlayerBase):
    """Fields a player may change on their own card.

    Applied with `exclude_unset=True`, so a payload that omits a field leaves the
    stored value alone rather than resetting it to this schema's default.
    """

    requested_by: str = Field(min_length=1, max_length=255)


class PlayerPhoneUpdate(BaseModel):
    """Admin-only phone write. Never part of PlayerBase — see the module docstring."""

    phone_number: str | None = Field(default=None, max_length=32)


class PlayerPhoneUpdateByName(PlayerPhoneUpdate):
    """Same write, reachable from the admin *portal* (session-name gated)
    rather than the secret-gated `/admin` router — see `player_service._assert_is_admin`.
    `requested_by` is re-checked server-side, same as notes and deletion."""

    requested_by: str = Field(min_length=1, max_length=255)


class PlayerContactStatus(BaseModel):
    """A player's reachability and ladder tier, with no digits in it. Used by
    the secret-gated `/admin` router — see `PlayerContactDetail` for the
    admin-portal counterpart that does carry the number."""

    id: uuid.UUID
    name: str
    has_phone: bool
    tier: str


class PlayerContactDetail(BaseModel):
    """Admin-portal view of a player's phone number — unlike `PlayerContactStatus`,
    this carries the actual digits. Reachable only via the session-name-gated
    admin portal route, so the admin UI can show what's already on file
    instead of always rendering a blank field, matching how notes behave."""

    id: uuid.UUID
    name: str
    phone_number: str | None
    tier: str


class PlayerTierUpdate(BaseModel):
    """Admin-only tier write. Same confidentiality rule as phone_number: `tier`
    is never part of PlayerBase, so it can never reach a player-facing response —
    a visible core/rest label in a friend group is a social hazard with no
    product upside (see DESIGN.md)."""

    tier: Literal["core", "rest"]


class PlayerNotesUpdate(BaseModel):
    """Admin-portal scouting-notes write. `requested_by` is the free-text
    session name, checked against `player_service.ADMIN_NAMES`."""

    notes: str | None = Field(default=None, max_length=500)
    requested_by: str = Field(min_length=1, max_length=255)


class PlayerDelete(BaseModel):
    """Admin-portal card deletion. `requested_by` is the free-text session name,
    checked against `player_service.ADMIN_NAMES`."""

    requested_by: str = Field(min_length=1, max_length=255)


class PlayerRead(PlayerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)