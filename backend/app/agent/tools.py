"""Agent tools: fetch player data for a given event.

These helpers expose the player profile data in the structured format
expected by TEAM_SPLIT_SYSTEM_PROMPT so they can be passed to an LLM.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import SessionLocal
from app.models import ListStatus, Registration
from app.services.team_service import _composite


async def fetch_event_player_payloads(event_id: str) -> list[dict]:
    """Return a list of structured player dicts for confirmed registrations."""
    eid = uuid.UUID(event_id)
    async with SessionLocal() as session:
        regs = list(
            (
                await session.scalars(
                    select(Registration)
                    .options(selectinload(Registration.player))
                    .where(
                        Registration.event_id == eid,
                        Registration.list_status == ListStatus.CONFIRMED,
                    )
                    .order_by(Registration.position)
                )
            ).all()
        )

    payloads = []
    for reg in regs:
        p = reg.player
        gp: dict = reg.guest_profile or {}
        payloads.append(
            {
                "name": p.name if p else reg.display_name,
                "age": p.age if p else gp.get("age"),
                "height_cm": p.height_cm if p else gp.get("height_cm"),
                "build": p.build if p else gp.get("build"),
                "preferred_role": p.preferred_role if p else gp.get("preferred_role"),
                "skill_rating": p.skill_rating if p else gp.get("skill_rating", 5),
                "speed": p.speed if p else gp.get("speed"),
                "technique": p.technique if p else gp.get("technique"),
                "defending": p.defending if p else gp.get("defending"),
                "shooting": p.shooting if p else gp.get("shooting"),
                "aerial": p.aerial if p else gp.get("aerial"),
                "stamina": p.stamina if p else gp.get("stamina"),
                "work_rate": p.work_rate if p else gp.get("work_rate"),
                "notes": p.notes if p else gp.get("notes"),
                "_composite_score": round(_composite(p, gp or None), 2),
            }
        )
    return payloads

