"""Recording and checking terms acceptance.

Accepting twice is idempotent rather than an error: a client retrying after a
flaky connection must not get a failure that pushes the user back into the modal
when their consent was in fact already stored.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CURRENT_TERMS_VERSION, ConsentRecord, Player
from app.schemas.consent import ConsentCreate


async def _find_player_id(session: AsyncSession, display_name: str) -> uuid.UUID | None:
    """Link the record to a player card when the name matches one."""
    stmt = select(Player.id).where(func.lower(Player.name) == display_name.casefold())
    return await session.scalar(stmt)


async def has_accepted(session: AsyncSession, display_name: str, terms_version: str) -> bool:
    stmt = select(func.count()).select_from(ConsentRecord).where(
        ConsentRecord.display_name_lower == display_name.casefold(),
        ConsentRecord.terms_version == terms_version,
    )
    return bool(await session.scalar(stmt))


async def accept_terms(session: AsyncSession, payload: ConsentCreate) -> ConsentRecord:
    """Store an acceptance. Returns the existing record if there already is one."""
    if payload.terms_version != CURRENT_TERMS_VERSION:
        # A stale client would otherwise record consent to text nobody is showing.
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Terms have changed. Reload and accept version {CURRENT_TERMS_VERSION}.",
        )

    name = payload.display_name.strip()
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "A name is required.")

    existing = await session.scalar(
        select(ConsentRecord).where(
            ConsentRecord.display_name_lower == name.casefold(),
            ConsentRecord.terms_version == payload.terms_version,
        )
    )
    if existing:
        return existing

    record = ConsentRecord(
        display_name=name,
        display_name_lower=name.casefold(),
        player_id=await _find_player_id(session, name),
        terms_version=payload.terms_version,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record
