"""Team-split agent entrypoint powered by Claude AI."""
from __future__ import annotations

import json
import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.agent.prompts import TEAM_SPLIT_SYSTEM_PROMPT
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import ListStatus, Registration
from app.models.player import Player
from app.services.team_service import _composite


# ---------------------------------------------------------------------------
# Payload builder
# ---------------------------------------------------------------------------

def _player_payload(player: Player | None, display_name: str, guest_profile: dict | None = None) -> dict:
    """Serialize a player into the structured dict the prompt expects."""
    if player is None:
        if guest_profile:
            return {
                "name": display_name,
                **guest_profile,
                "_composite_score": round(_composite(None, guest_profile), 2),
            }
        return {
            "name": display_name,
            "skill_rating": 5,
            "notes": "guest — no profile set",
        }
    return {
        "name": player.name,
        "age": player.age,
        "height_cm": player.height_cm,
        "build": player.build,
        "preferred_role": player.preferred_role,
        "skill_rating": player.skill_rating,
        "speed": player.speed,
        "technique": player.technique,
        "defending": player.defending,
        "shooting": player.shooting,
        "aerial": player.aerial,
        "stamina": player.stamina,
        "work_rate": player.work_rate,
        "notes": player.notes,
        "_composite_score": round(_composite(player), 2),
    }


# ---------------------------------------------------------------------------
# Claude-powered split
# ---------------------------------------------------------------------------

async def _ai_split(payloads: list[dict], api_key: str, model: str) -> dict:
    """Call Claude to split the player list into two balanced teams."""
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)

    user_message = (
        "Here is the confirmed player list for this event. "
        "Please split them into two balanced teams.\n"
        "Respond with the JSON object only — no preamble, no markdown tables, no reasoning before the JSON.\n\n"
        f"```json\n{json.dumps(payloads, indent=2, default=str)}\n```"
    )

    response = await client.messages.create(
        model=model,
        max_tokens=2048,
        system=TEAM_SPLIT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text

    # Strip markdown code fences if Claude wraps the response
    json_match = re.search(r"```(?:json)?\s*([\s\S]+?)```", raw)
    if json_match:
        clean = json_match.group(1).strip()
    else:
        # Try to extract bare JSON object from the response
        obj_match = re.search(r"(\{[\s\S]+\})", raw)
        clean = obj_match.group(1).strip() if obj_match else raw.strip()

    try:
        result = json.loads(clean)
    except json.JSONDecodeError:
        raise ValueError(f"Claude returned non-JSON response:\n{raw!r}")

    result["_source"] = "claude"
    return result


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------

async def run_split(event_id: str, regs: list | None = None) -> dict:
    """Return a Claude-powered balanced team split for the confirmed players.

    Raises HTTP 503 if Claude is not configured or the call fails.
    """
    settings = get_settings()

    if not settings.claude_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI team split is unavailable: CLAUDE_API_KEY is not configured.",
        )

    if regs is None:
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

    if not regs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No confirmed registrations found for this event.",
        )

    entries = [
        {
            "reg": r,
            "payload": _player_payload(r.player, r.display_name, r.guest_profile),
            "score": _composite(r.player, r.guest_profile),
        }
        for r in regs
    ]
    payloads = [e["payload"] for e in entries]

    try:
        return await _ai_split(payloads, settings.claude_api_key, settings.claude_model)
    except HTTPException:
        raise
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Claude split failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI team split failed. Please try again in a moment.",
        ) from exc
