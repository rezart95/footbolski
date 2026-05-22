from datetime import time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Venue


VENUES = [
    {
        "name": "Parkowa Sport",
        "default_day": 3,
        "default_time": time(19, 30),
        "players_per_side": 7,
        "max_players": 14,
    },
    {
        "name": "Fame Sport",
        "default_day": 0,
        "default_time": time(21, 0),
        "players_per_side": 6,
        "max_players": 12,
    },
]


async def seed_venues(session: AsyncSession) -> None:
    for payload in VENUES:
        exists = await session.scalar(select(Venue).where(Venue.name == payload["name"]))
        if not exists:
            session.add(Venue(**payload))
    await session.commit()
