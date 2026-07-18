"""Idempotent startup seeding of venues and players.

The seed *content* lives in `seed_data/*.json` rather than in this module. It is
data, not logic, and inlining it previously pushed this file to 361 lines of
which roughly 330 were literal dictionaries. Keeping it as JSON lets the two
concerns be edited independently and keeps this module readable.

Both functions are safe to run on every startup.
"""

import json
from datetime import time
from pathlib import Path
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Venue
from app.models.enums import PlayerPosition
from app.models.player import Player

SEED_DATA_DIR = Path(__file__).parent / "seed_data"


def _load(filename: str) -> list[dict[str, Any]]:
    with (SEED_DATA_DIR / filename).open(encoding="utf-8") as handle:
        return json.load(handle)


def _to_venue_payload(row: dict[str, Any]) -> dict[str, Any]:
    """JSON has no time type, so default_time arrives as 'HH:MM'."""
    hour, minute = (int(part) for part in row["default_time"].split(":"))
    return {**row, "default_time": time(hour, minute)}


def _to_player_payload(row: dict[str, Any]) -> dict[str, Any]:
    return {**row, "primary_position": PlayerPosition(row["primary_position"])}


async def seed_venues(session: AsyncSession) -> None:
    """Create missing venues, and back-fill addresses on venues seeded before
    addresses were tracked, without overwriting any manual edits."""
    for row in _load("venues.json"):
        payload = _to_venue_payload(row)
        existing = await session.scalar(select(Venue).where(Venue.name == payload["name"]))
        if existing is None:
            session.add(Venue(**payload))
        elif not existing.address:
            existing.address = payload["address"]
    await session.commit()


async def seed_players(session: AsyncSession) -> None:
    """Populate player cards on first run only.

    Seeding is skipped once the table has any rows, so players deleted through
    the UI are not resurrected on the next restart.
    """
    existing_count = await session.scalar(select(func.count()).select_from(Player))
    if existing_count:
        return
    for row in _load("players.json"):
        session.add(Player(**_to_player_payload(row)))
    await session.commit()
