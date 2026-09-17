"""The contract between the model and the solver.

The AI's whole output is a list of per-player judgments plus a set of weights.
It never names a team. Keeping the contract this narrow is what makes the split
verifiable: every field is either a number in a known range or a name that must
match the roster, so `validate` can reject bad output without guessing intent.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.services.team_solver import MAX_RATING_DELTA, clamp_delta

# The tool schema handed to Claude. `strict` validation on the API side keeps
# the shape correct; the ranges here are still re-checked locally, because a
# schema can enforce that `effective_rating` is a number but not that the model
# read the notes sensibly.
JUDGMENT_TOOL_SCHEMA = {
    "name": "submit_judgments",
    "description": (
        "Submit your per-player assessment and the balance weights for this squad. "
        "You do NOT assign teams — a solver does that from these judgments."
    ),
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "players": {
                "type": "array",
                "description": "One entry per player, covering every player given.",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Exactly as supplied in the roster.",
                        },
                        "effective_rating": {
                            "type": "number",
                            "description": (
                                "Real ability 1-10 after reading the notes. Move away "
                                "from _composite_score only where the notes justify it; "
                                f"changes beyond {MAX_RATING_DELTA} are capped."
                            ),
                        },
                        "rationale": {
                            "type": "string",
                            "description": "Short reason, only if you changed the rating.",
                        },
                    },
                    "required": ["name", "effective_rating"],
                },
            },
            "weights": {
                "type": "object",
                "additionalProperties": False,
                "description": "How much each balance dimension matters for this squad (0-2).",
                "properties": {
                    "strength": {"type": "number"},
                    "star_distribution": {"type": "number"},
                    "positional_mix": {"type": "number"},
                },
                "required": ["strength", "star_distribution", "positional_mix"],
            },
            "squad_note": {
                "type": "string",
                "description": "One sentence on this squad's shape. No personal remarks.",
            },
        },
        "required": ["players", "weights"],
    },
}

WEIGHT_KEYS = ("strength", "star_distribution", "positional_mix")
MAX_WEIGHT = 2.0


@dataclass
class Judgments:
    """Validated model output, ready for the solver."""

    ratings: dict[str, float]
    weights: dict[str, float]
    rationales: dict[str, str]
    squad_note: str
    adjustments: list[str]
    """Human-readable record of every rating the model moved, and every value
    that had to be clamped. Surfaced in logs so a strange split can be traced
    back to the judgment that caused it."""


class JudgmentError(ValueError):
    """Raised when model output cannot be trusted even after clamping.

    The message is fed back to the model on the single retry, so it states the
    specific problem rather than a generic failure.
    """


def validate(raw: dict, composites: dict[str, float]) -> Judgments:
    """Turn raw tool input into Judgments, or raise JudgmentError.

    Clamping handles values that are merely implausible. A JudgmentError is for
    output that cannot be repaired locally: a missing player, or a name that
    isn't on the roster. Those mean the model misread the roster, and guessing
    on its behalf would put someone on the wrong team.
    """
    entries = raw.get("players")
    if not isinstance(entries, list) or not entries:
        raise JudgmentError("The 'players' array was missing or empty.")

    ratings: dict[str, float] = {}
    rationales: dict[str, str] = {}
    adjustments: list[str] = []

    for entry in entries:
        if not isinstance(entry, dict):
            raise JudgmentError("Every entry in 'players' must be an object.")
        name = entry.get("name")
        if name not in composites:
            raise JudgmentError(
                f"'{name}' is not on the roster. Use names exactly as supplied: "
                f"{', '.join(sorted(composites))}."
            )
        if name in ratings:
            raise JudgmentError(f"'{name}' appears more than once.")

        composite = composites[name]
        try:
            proposed = float(entry.get("effective_rating", composite))
        except (TypeError, ValueError):
            raise JudgmentError(f"'{name}' has a non-numeric effective_rating.") from None

        final = clamp_delta(composite, proposed)
        ratings[name] = final

        if abs(proposed - final) > 1e-9:
            adjustments.append(
                f"{name}: {proposed:.2f} capped to {final:.2f} "
                f"(composite {composite:.2f}, max shift {MAX_RATING_DELTA})"
            )
        elif abs(final - composite) > 0.05:
            direction = "up" if final > composite else "down"
            adjustments.append(f"{name}: {composite:.2f} -> {final:.2f} ({direction})")

        rationale = entry.get("rationale")
        if isinstance(rationale, str) and rationale.strip():
            rationales[name] = rationale.strip()

    missing = set(composites) - set(ratings)
    if missing:
        raise JudgmentError(
            f"No judgment given for: {', '.join(sorted(missing))}. Every player needs one."
        )

    return Judgments(
        ratings=ratings,
        weights=_validated_weights(raw.get("weights")),
        rationales=rationales,
        squad_note=str(raw.get("squad_note") or "").strip(),
        adjustments=adjustments,
    )


def _validated_weights(raw: object) -> dict[str, float]:
    """Coerce weights into range, falling back to the solver's defaults.

    Weights only shift emphasis between objectives, so a nonsensical value is
    clamped rather than raised on — unlike a bad player name, there is a safe
    reading of it.
    """
    from app.services.team_solver import DEFAULT_WEIGHTS

    weights = dict(DEFAULT_WEIGHTS)
    if not isinstance(raw, dict):
        return weights

    for key in WEIGHT_KEYS:
        if key not in raw:
            continue
        try:
            value = float(raw[key])
        except (TypeError, ValueError):
            continue
        if value >= 0:
            weights[key] = min(value, MAX_WEIGHT)
    return weights
