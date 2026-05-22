import uuid
from datetime import time

from pydantic import BaseModel, ConfigDict


class VenueRead(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    default_day: int | None
    default_time: time | None
    players_per_side: int
    max_players: int

    model_config = ConfigDict(from_attributes=True)
