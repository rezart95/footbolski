from datetime import date

from pydantic import BaseModel


class PublicStats(BaseModel):
    """Group-wide totals for the public landing page. Counts only: no names,
    no amounts owed, nothing that points at a person."""

    matches_played: int
    matches_cancelled: int
    spots_filled: int
    spots_paid: int
    team_splits: int
    first_match_on: date | None
