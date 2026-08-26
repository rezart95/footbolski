"""Pure team-balancing logic: scoring players and dividing them into two sides.

Extracted from `team_service` so the balancing rules can be read, reasoned about
and changed without wading through database orchestration. Nothing here touches
the session; every function takes registrations and returns registrations.
"""

from app.models import ListStatus, PlayerPosition, Registration  # noqa: F401  (ListStatus re-exported for callers)
from app.models.player import Player

# skill_rating is the overall anchor; the rest fine-tune balance across the
# physical and technical dimensions. Weights sum to 10 so a composite score
# stays on the same 1-10 scale as the individual ratings.
ATTRIBUTE_WEIGHTS: dict[str, float] = {
    "skill_rating": 3.0,
    "speed": 1.0,
    "technique": 1.5,
    "defending": 1.0,
    "shooting": 1.0,
    "aerial": 0.5,
    "stamina": 1.0,
    "work_rate": 1.0,
}
TOTAL_WEIGHT: float = sum(ATTRIBUTE_WEIGHTS.values())

DEFAULT_SCORE = 5.0
"""Used for a registration with neither a player card nor a guest profile."""

POSITION_ORDER: dict[PlayerPosition, int] = {
    PlayerPosition.GK: 0,
    PlayerPosition.DEF: 1,
    PlayerPosition.MID: 2,
    PlayerPosition.ATT: 3,
}


def composite_score(player: Player | None, guest_profile: dict | None = None) -> float:
    """Return a weighted composite score from 1 to 10 for one player.

    Priority: a linked player card, then a guest profile, then the default.
    Where an attribute is missing the overall skill_rating stands in for it, so
    partially filled profiles still sort sensibly rather than collapsing to zero.
    """
    if player is not None:
        base = float(player.skill_rating)
        total = sum(
            weight * float(getattr(player, attribute) if getattr(player, attribute) is not None else base)
            for attribute, weight in ATTRIBUTE_WEIGHTS.items()
        )
        return total / TOTAL_WEIGHT

    if guest_profile:
        base = float(guest_profile.get("skill_rating") or DEFAULT_SCORE)
        total = sum(
            weight * float(guest_profile.get(attribute) or base)
            for attribute, weight in ATTRIBUTE_WEIGHTS.items()
        )
        return total / TOTAL_WEIGHT

    return DEFAULT_SCORE


def registration_name(registration: Registration) -> str:
    """The name to match a registration by, folded for comparison."""
    name = registration.player.name if registration.player else registration.display_name
    return name.casefold()


def split_by_name(
    registrations: list[Registration],
    team_a_names: list[str],
    team_b_names: list[str],
) -> tuple[list[Registration], list[Registration]]:
    """Map names returned by the AI split back onto registrations.

    Anyone the AI did not name, or named in a way that matches nothing, is placed
    on the shorter side rather than dropped. Losing a confirmed player because a
    model returned an unexpected spelling would leave a side a man short.
    """
    by_name = {registration_name(r): r for r in registrations}

    team_a = [by_name[name.casefold()] for name in team_a_names if name.casefold() in by_name]
    team_b = [by_name[name.casefold()] for name in team_b_names if name.casefold() in by_name]

    assigned = {id(r) for r in team_a + team_b}
    for registration in registrations:
        if id(registration) not in assigned:
            shorter = team_a if len(team_a) <= len(team_b) else team_b
            shorter.append(registration)

    return team_a, team_b


def snake_draft(
    registrations: list[Registration],
) -> tuple[list[Registration], list[Registration]]:
    """Divide players into two sides by composite score, alternating pick order.

    The fallback used when the AI split is unavailable. A straight alternating
    pick would hand the stronger side every odd-numbered player; reversing the
    order on each pair keeps the totals close.
    """
    ranked = sorted(
        registrations,
        key=lambda r: composite_score(r.player, r.guest_profile),
        reverse=True,
    )

    team_a: list[Registration] = []
    team_b: list[Registration] = []
    for index, registration in enumerate(ranked):
        pair_index = index // 2
        first_pick_is_a = pair_index % 2 == 0
        if index % 2 == 0:
            (team_a if first_pick_is_a else team_b).append(registration)
        else:
            (team_b if first_pick_is_a else team_a).append(registration)

    return team_a, team_b


def sort_by_position(registrations: list[Registration]) -> list[Registration]:
    """Order a side goalkeeper first, then defence, midfield, attack.

    Registrations without a player card sort as midfielders, which is the
    neutral position and the same assumption the pitch layout makes.
    """

    def position_rank(registration: Registration) -> int:
        if registration.player:
            return POSITION_ORDER.get(registration.player.primary_position, 2)
        return 2

    return sorted(registrations, key=position_rank)
