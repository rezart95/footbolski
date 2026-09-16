"""LangGraph pipeline for splitting an event's players into two teams.

    load_players -> extract_judgments -> validate_judgments -> solve -> explain

The model is asked only for judgments about players (see `judgments.py`); the
solver assigns the teams (see `services/team_solver.py`); the model is then
shown the finished split and asked to describe it.

That ordering is the point. The old pipeline asked the model for the teams and
its reasoning in one response, so the two could disagree — and against a real
14-player event they disagreed in 4 of 5 runs, the text claiming the two
strongest players were separated while the arrays put them together (#30). Here
`explain` receives the split as input, after it is fixed, so it cannot describe
a split that was not produced.

`validate_judgments` is the only branching node: bad model output retries once
with the error fed back, and a second failure degrades to raw composite scores.
The split still happens — it just loses the note-reading nuance.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agent.judgments import JUDGMENT_TOOL_SCHEMA, JudgmentError, Judgments, validate
from app.agent.prompts import EXPLAIN_SYSTEM_PROMPT, JUDGMENT_SYSTEM_PROMPT
from app.services import team_solver
from app.services.team_solver import SolverPlayer, Split

logger = logging.getLogger(__name__)

MAX_JUDGMENT_ATTEMPTS = 2
"""One retry. A model that returns an unusable roster twice is not going to get
it right on a third attempt, and players are waiting on the response."""


def _keep_last(_current: Any, incoming: Any) -> Any:
    """Reducer: later writes win. Nodes here each own their own keys."""
    return incoming


class SplitState(TypedDict, total=False):
    """State threaded through the graph.

    `payloads` is what the model sees, `composites` what the solver trusts, and
    they are kept apart on purpose: the model may argue with a rating, but it
    may not silently redefine the baseline it is arguing against.
    """

    payloads: Annotated[list[dict], _keep_last]
    composites: Annotated[dict[str, float], _keep_last]
    positions: Annotated[dict[str, str], _keep_last]

    raw_judgments: Annotated[dict, _keep_last]
    judgments: Annotated[Judgments | None, _keep_last]
    attempts: Annotated[int, _keep_last]
    last_error: Annotated[str, _keep_last]
    degraded: Annotated[bool, _keep_last]

    split: Annotated[Split | None, _keep_last]
    reasoning: Annotated[str, _keep_last]
    timings: Annotated[dict[str, float], _keep_last]

    api_key: Annotated[str, _keep_last]
    model: Annotated[str, _keep_last]


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------


async def extract_judgments(state: SplitState) -> dict:
    """Ask Claude to rate every player from their notes and weight the squad.

    Forced tool use rather than free-text JSON: the old pipeline scraped the
    response with a regex and a bare `json.loads`, which fails whenever the
    model wraps or prefaces its answer. A forced tool call returns parsed input
    directly, so that whole class of failure disappears.
    """
    from anthropic import AsyncAnthropic

    started = time.perf_counter()
    client = AsyncAnthropic(api_key=state["api_key"])

    user_content = (
        "Assess every player below. Return one judgment per player.\n\n"
        f"```json\n{json.dumps(state['payloads'], indent=2, ensure_ascii=False, default=str)}\n```"
    )
    if state.get("last_error"):
        user_content += (
            f"\n\nYour previous response was rejected: {state['last_error']}\n"
            "Correct it and submit every player exactly once."
        )

    response = await client.messages.create(
        model=state["model"],
        max_tokens=4096,
        system=JUDGMENT_SYSTEM_PROMPT,
        tools=[{**JUDGMENT_TOOL_SCHEMA, "strict": True}],
        tool_choice={"type": "tool", "name": JUDGMENT_TOOL_SCHEMA["name"]},
        messages=[{"role": "user", "content": user_content}],
    )

    raw: dict = {}
    for block in response.content:
        if block.type == "tool_use" and block.name == JUDGMENT_TOOL_SCHEMA["name"]:
            raw = block.input
            break

    timings = {**state.get("timings", {}), "extract": time.perf_counter() - started}
    return {"raw_judgments": raw, "attempts": state.get("attempts", 0) + 1, "timings": timings}


def validate_judgments(state: SplitState) -> dict:
    """Check the model's output against the roster; record the error if unusable."""
    raw = state.get("raw_judgments") or {}
    try:
        judgments = validate(raw, state["composites"])
    except JudgmentError as exc:
        logger.warning("Judgment validation failed (attempt %s): %s", state.get("attempts"), exc)
        return {"judgments": None, "last_error": str(exc)}

    if judgments.adjustments:
        logger.info("Rating adjustments: %s", "; ".join(judgments.adjustments))
    return {"judgments": judgments, "last_error": ""}


def degrade(state: SplitState) -> dict:
    """Fall back to composite scores when the model cannot produce valid output.

    A worse split than the AI path, but still balanced and still optimal for the
    numbers it has — the group gets teams rather than an error.
    """
    logger.warning(
        "Falling back to composite ratings after %s failed attempts: %s",
        state.get("attempts"),
        state.get("last_error"),
    )
    return {
        "judgments": Judgments(
            ratings=dict(state["composites"]),
            weights=dict(team_solver.DEFAULT_WEIGHTS),
            rationales={},
            squad_note="",
            adjustments=[],
        ),
        "degraded": True,
    }


def solve(state: SplitState) -> dict:
    """Search the assignment space for the lowest-cost split."""
    started = time.perf_counter()
    judgments = state["judgments"]
    positions = state.get("positions", {})

    players = [
        SolverPlayer(name=name, rating=rating, position=positions.get(name, "MID"))
        for name, rating in judgments.ratings.items()
    ]
    split = team_solver.solve(players, judgments.weights)

    timings = {**state.get("timings", {}), "solve": time.perf_counter() - started}
    logger.info(
        "Solved: gap %.2f, cost %.2f, components %s",
        split.strength_gap,
        split.cost,
        split.components,
    )
    return {"split": split, "timings": timings}


async def explain(state: SplitState) -> dict:
    """Ask Claude to describe the split it has been handed.

    Given the finished teams, so it reports rather than decides. If this call
    fails the split still stands — a missing explanation is cosmetic, and
    failing the whole request over it would be worse than a plain summary.
    """
    from anthropic import AsyncAnthropic

    started = time.perf_counter()
    split = state["split"]
    judgments = state["judgments"]

    def describe(team: list[SolverPlayer]) -> list[dict]:
        return [
            {"name": p.name, "rating": round(p.rating, 2), "position": p.position} for p in team
        ]

    facts = {
        "team_a": describe(split.team_a),
        "team_b": describe(split.team_b),
        "team_a_total": round(split.strength_a, 2),
        "team_b_total": round(split.strength_b, 2),
        "strength_gap": round(split.strength_gap, 2),
        "squad_note": judgments.squad_note,
    }

    try:
        client = AsyncAnthropic(api_key=state["api_key"])
        response = await client.messages.create(
            model=state["model"],
            max_tokens=700,
            system=EXPLAIN_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Describe this final split. It is already decided — do not "
                        "propose changes.\n\n"
                        f"```json\n{json.dumps(facts, indent=2, ensure_ascii=False)}\n```"
                    ),
                }
            ],
        )
        reasoning = "".join(b.text for b in response.content if b.type == "text").strip()
    except Exception as exc:  # noqa: BLE001 — explanation is best-effort
        logger.warning("Explanation call failed, using a plain summary: %s", exc)
        reasoning = (
            f"Teams balanced to within {split.strength_gap:.2f} rating points "
            f"({split.strength_a:.1f} v {split.strength_b:.1f})."
        )

    timings = {**state.get("timings", {}), "explain": time.perf_counter() - started}
    return {"reasoning": reasoning, "timings": timings}


# ---------------------------------------------------------------------------
# Wiring
# ---------------------------------------------------------------------------


def _after_validation(state: SplitState) -> Literal["solve", "extract_judgments", "degrade"]:
    """Retry once on bad output, then degrade rather than fail."""
    if state.get("judgments") is not None:
        return "solve"
    if state.get("attempts", 0) < MAX_JUDGMENT_ATTEMPTS:
        return "extract_judgments"
    return "degrade"


def build_graph():
    """Compile the split pipeline."""
    graph = StateGraph(SplitState)

    graph.add_node("extract_judgments", extract_judgments)
    graph.add_node("validate_judgments", validate_judgments)
    graph.add_node("degrade", degrade)
    graph.add_node("solve", solve)
    graph.add_node("explain", explain)

    graph.add_edge(START, "extract_judgments")
    graph.add_edge("extract_judgments", "validate_judgments")
    graph.add_conditional_edges(
        "validate_judgments",
        _after_validation,
        {"solve": "solve", "extract_judgments": "extract_judgments", "degrade": "degrade"},
    )
    graph.add_edge("degrade", "solve")
    graph.add_edge("solve", "explain")
    graph.add_edge("explain", END)

    return graph.compile()


_compiled = None


def get_graph():
    """Compiled graph, built once and reused across requests."""
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled
