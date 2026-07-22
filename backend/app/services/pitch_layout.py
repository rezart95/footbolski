"""Formation choice and pitch-slot geometry.

Coordinates are percentages of the pitch, matching what the drag-and-drop
formation editor expects: x runs 0-100 left to right, y runs 0-100 top to bottom.
Team A occupies the top half, Team B the bottom, so B's rows are mirrored.

This mirrors `slotsForFormation` in the frontend. If you change the geometry
here, change it there too.
"""

from app.models import PlayerPosition

GOALKEEPER_Y_TOP = 6.0
GOALKEEPER_Y_BOTTOM = 94.0

ROW_Y_TOP_HALF = [24.0, 48.0, 72.0]
ROW_Y_BOTTOM_HALF = [76.0, 52.0, 28.0]

ROW_ROLES = [PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.ATT]


def default_formation(outfield_count: int) -> str:
    """Pick a formation for the number of outfield players on a side.

    Outfield count is the side's size minus the goalkeeper. Small-sided games
    vary week to week, so this degrades rather than assuming a full seven.
    """
    if outfield_count >= 6:
        return "2-3-1"
    if outfield_count == 5:
        return "2-2-1"
    return "2-1-1"


def slots_for_formation(formation: str, top_half: bool) -> list[dict]:
    """Return one slot per player for a formation, goalkeeper first.

    Players in a row are spaced evenly across the width: a row of n players sits
    at 1/(n+1), 2/(n+1) and so on, which keeps them off the touchlines.
    """
    row_sizes = [int(part) for part in formation.split("-")]
    row_y = ROW_Y_TOP_HALF if top_half else ROW_Y_BOTTOM_HALF

    slots: list[dict] = [
        {
            "x": 50.0,
            "y": GOALKEEPER_Y_TOP if top_half else GOALKEEPER_Y_BOTTOM,
            "role": PlayerPosition.GK,
        }
    ]

    for row_index, row_size in enumerate(row_sizes):
        for position_in_row in range(row_size):
            x = ((position_in_row + 1) / (row_size + 1)) * 100.0
            slots.append({"x": x, "y": row_y[row_index], "role": ROW_ROLES[row_index]})

    return slots
