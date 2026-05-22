import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PlayerPosition


class TeamPlayerRead(BaseModel):
    id: uuid.UUID
    player_id: uuid.UUID | None
    display_name: str
    position_role: PlayerPosition
    pitch_x: float | None
    pitch_y: float | None

    model_config = ConfigDict(from_attributes=True)


class TeamRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    label: str
    color: str
    formation: str | None
    players: list[TeamPlayerRead]

    model_config = ConfigDict(from_attributes=True)


class TeamPlayerPosition(BaseModel):
    id: uuid.UUID
    pitch_x: float = Field(ge=0, le=100)
    pitch_y: float = Field(ge=0, le=100)


class FormationUpdate(BaseModel):
    team_id: uuid.UUID
    formation: str = Field(min_length=3, max_length=10)
    players: list[TeamPlayerPosition]
