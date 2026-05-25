"""Team-split agent entrypoint.

When CLAUDE_API_KEY is configured the split is powered by Claude (using
TEAM_SPLIT_SYSTEM_PROMPT). Otherwise falls back to a composite-score
snake-draft algorithm.
"""
from __future__ import annotations

import json
import re
import uuid

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
        "Please split them into two balanced teams.\n\n"
        f"```json\n{json.dumps(payloads, indent=2, default=str)}\n```"
    )

    response = await client.messages.create(
        model=model,
        max_tokens=1024,
        system=TEAM_SPLIT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = response.content[0].text

    # Strip markdown code fences if Claude wraps the response
    json_match = re.search(r"```(?:json)?\s*([\s\S]+?)```", raw)
    clean = json_match.group(1).strip() if json_match else raw.strip()

    result = json.loads(clean)
    result["_source"] = "claude"
    return result


# ---------------------------------------------------------------------------
# Algorithmic fallback (composite-score snake draft)
# ---------------------------------------------------------------------------

def _algorithmic_split(entries: list[dict]) -> dict:
    """Snake-draft split based on composite scores."""
    sorted_entries = sorted(entries, key=lambda e: e["score"], reverse=True)

    team_a: list[dict] = []
    team_b: list[dict] = []
    for i, entry in enumerate(sorted_entries):
        pair = i // 2
        if pair % 2 == 0:
            (team_a if i % 2 == 0 else team_b).append(entry)
        else:
            (team_b if i % 2 == 0 else team_a).append(entry)

    score_a = sum(e["score"] for e in team_a)
    score_b = sum(e["score"] for e in team_b)

    # Find the swap that most closes the gap
    best_swap = None
    best_gap = abs(score_a - score_b)
    for ea in team_a:
        for eb in team_b:
            gap = abs((score_a - ea["score"] + eb["score"]) - (score_b - eb["score"] + ea["score"]))
            if gap < best_gap:
                best_gap = gap
                best_swap = {
                    "swap": f"{ea['payload']['name']} (Team A) ↔ {eb['payload']['name']} (Team B)",
                    "reason": f"Reduces score gap from {abs(score_a - score_b):.1f} to {gap:.1f}.",
                }

    return {
        "team_a": [e["payload"]["name"] for e in team_a],
        "team_b": [e["payload"]["name"] for e in team_b],
        "team_a_score": round(score_a, 1),
        "team_b_score": round(score_b, 1),
        "score_gap": round(abs(score_a - score_b), 1),
        "reasoning": (
            f"Algorithmic snake-draft using weighted composite scores "
            f"(overall × 3, technique × 1.5, speed / defending / shooting / stamina / work_rate × 1, aerial × 0.5). "
            f"Team A: {score_a:.1f} | Team B: {score_b:.1f} | Gap: {abs(score_a - score_b):.1f}."
        ),
        "swap_options": [best_swap] if best_swap else [],
        "_source": "algorithm",
    }


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------

async def run_split(event_id: str, regs: list | None = None) -> dict:
    """Return a balanced team split for the confirmed players of an event.

    Args:
        event_id: UUID string of the event.
        regs: Pre-loaded list of Registration objects (with .player eager-loaded).
              If omitted, registrations are fetched from the DB.

    Uses Claude when CLAUDE_API_KEY is set; falls back to the algorithmic
    snake-draft otherwise.

    Returns keys: team_a, team_b, reasoning, swap_options, _source.
    """
    settings = get_settings()

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
        return {"error": "No confirmed registrations found for this event."}

    entries = [
        {
            "reg": r,
            "payload": _player_payload(r.player, r.display_name, r.guest_profile),
            "score": _composite(r.player, r.guest_profile),
        }
        for r in regs
    ]
    payloads = [e["payload"] for e in entries]

    if settings.claude_api_key:
        try:
            return await _ai_split(payloads, settings.claude_api_key, settings.claude_model)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Claude split failed (%s), using algorithm fallback.", exc)

    return _algorithmic_split(entries)
