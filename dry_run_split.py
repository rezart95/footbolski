# Dry-run the AI team-split without needing the DB or HTTP server.
# Run from the repo root:
#   cd footbolski
#   python dry_run_split.py
import asyncio
import json
import os
import sys

# ---------------------------------------------------------------------------
# Bootstrap: point Python at the backend package and load env vars manually
# ---------------------------------------------------------------------------
BACKEND = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, BACKEND)

# Parse backend/.env to get CLAUDE_API_KEY (and satisfy required settings)
_env_path = os.path.join(BACKEND, ".env")
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            _env[k.strip()] = v.strip()

os.environ.setdefault("DATABASE_URL", _env.get("DATABASE_URL", "postgresql+asyncpg://x:x@localhost/x"))
os.environ.setdefault("CLAUDE_API_KEY", _env.get("CLAUDE_API_KEY", ""))
os.environ.setdefault("MINIO_ENDPOINT", _env.get("MINIO_ENDPOINT", "localhost:9000"))
os.environ.setdefault("MINIO_ACCESS_KEY", _env.get("MINIO_ACCESS_KEY", "x"))
os.environ.setdefault("MINIO_SECRET_KEY", _env.get("MINIO_SECRET_KEY", "x"))

# ---------------------------------------------------------------------------
# Player payload — exact data pulled from DB (May 27 event, 12 confirmed)
# Players WITHOUT a card get skill_rating=5 and notes="guest — no profile set"
# Players WITH a card get full stats
# ---------------------------------------------------------------------------
PLAYERS = [
    # --- 9 players with full cards (verified from DB, May 27 event) ---
    {
        "name": "Rezi",
        "skill_rating": 5, "primary_position": "DEF", "preferred_role": "Defensive/midfield",
        "age": 31, "height_cm": 187, "build": "a bit overweight",
        "speed": 3, "technique": 5, "defending": 5, "shooting": 5, "aerial": 5, "stamina": 3, "work_rate": 3,
        "notes": "Good positioning and vision. Below average acceleration and fitness.",
        "_composite_score": 4.2,
    },
    {
        "name": "Flori",
        "skill_rating": 7, "primary_position": "MID", "preferred_role": "Midfield/attack",
        "age": 27, "height_cm": 168, "build": "strong, bit overweight",
        "speed": 7, "technique": 7, "defending": 5, "shooting": 6, "aerial": 3, "stamina": 7, "work_rate": 8,
        "notes": "Good dribbling and passing. Weak in aerial duels. Does not track back.",
        "_composite_score": 6.3,
    },
    {
        "name": "Marcin",  # registered as "Marcin Matysik" — now linked
        "skill_rating": 6, "primary_position": "MID",
        "speed": 7, "technique": 5, "defending": 5, "shooting": 1, "aerial": 7, "stamina": 6, "work_rate": 9,
        "_composite_score": 5.7,
    },
    {
        "name": "Artur",
        "skill_rating": 5, "primary_position": "MID",
        "speed": 4, "technique": 6, "defending": 7, "shooting": 6, "aerial": 7, "stamina": 4, "work_rate": 5,
        "_composite_score": 5.35,
    },
    {
        "name": "Miguel",  # registered as "Miguel Consuegra Aranda" — now linked
        "skill_rating": 5, "primary_position": "DEF",
        "speed": 4, "technique": 5, "defending": 7, "shooting": 6, "aerial": 5, "stamina": 4, "work_rate": 7,
        "_composite_score": 5.3,
    },
    {
        "name": "Mauricio O\u00f1oro",
        "skill_rating": 5, "primary_position": "MID", "preferred_role": "Right Midfield",
        "age": 29, "height_cm": 172, "build": "Thick, slow",
        "speed": 3, "technique": 2, "defending": 5, "shooting": 5, "aerial": 1, "stamina": 8, "work_rate": 6,
        "_composite_score": 4.3,
    },
    {
        "name": "Jetmiri",
        "skill_rating": 10, "primary_position": "ATT", "preferred_role": "Attacking \u2013 best player in the group",
        "age": 24, "height_cm": 180, "build": "athletic/slim",
        "speed": 10, "technique": 10, "defending": 10, "shooting": 10, "aerial": 10, "stamina": 10, "work_rate": 10,
        "notes": "Best player in the group. Great dribbling, shooting, long and short passes. No real weaknesses.",
        "_composite_score": 10.0,
    },
    {
        "name": "Alex",  # card was "Aleks", renamed to "Alex" — now linked
        "skill_rating": 6, "primary_position": "DEF",
        "speed": 5, "technique": 4, "defending": 7, "shooting": 5, "aerial": 7, "stamina": 7, "work_rate": 6,
        "_composite_score": 5.75,
    },
    {
        "name": "Bledi",
        "skill_rating": 5, "primary_position": "DEF", "preferred_role": "Left Back",
        "age": 38, "height_cm": 170, "build": "slim/athletic",
        "speed": 5, "technique": 4, "defending": 8, "shooting": 4, "aerial": 5, "stamina": 6, "work_rate": 8,
        "_composite_score": 5.5,
    },
    # --- 3 players with no card (AI gets name + skill 5 default) ---
    {"name": "Enes",
     "skill_rating": 7, "primary_position": "DEF",
     "speed": 8, "technique": 6, "defending": 9, "shooting": 6, "aerial": 5, "stamina": 8, "work_rate": 9,
     "_composite_score": 7.25},
    {"name": "Guilherme Lisboa",
     "skill_rating": 8, "primary_position": "ATT",
     "speed": 8, "technique": 8, "defending": 6, "shooting": 7, "aerial": 7, "stamina": 6, "work_rate": 5,
     "_composite_score": 7.15},
    {"name": "Wojtek", "skill_rating": 5, "notes": "guest \u2014 no profile set", "_composite_score": 5.0},
]


async def main() -> None:
    from app.agent.agent_router import _ai_split
    from app.core.config import get_settings

    settings = get_settings()
    if not settings.claude_api_key:
        print("ERROR: CLAUDE_API_KEY not found in backend/.env")
        sys.exit(1)

    print(f"Sending {len(PLAYERS)} players to Claude ({settings.claude_model})...\n")

    # Show what the AI actually receives
    print("=" * 60)
    print("PAYLOAD SENT TO AI:")
    print("=" * 60)
    for p in PLAYERS:
        has_card = "_composite_score" in p and p.get("notes") != "guest — no profile set"
        tag = "✓ card" if has_card else "✗ guest"
        print(f"  [{tag}] {p['name']:30s}  skill={p['skill_rating']}  composite={p['_composite_score']}")
    print()

    result = await _ai_split(PLAYERS, settings.claude_api_key, settings.claude_model)

    print("=" * 60)
    print("AI RESULT:")
    print("=" * 60)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
