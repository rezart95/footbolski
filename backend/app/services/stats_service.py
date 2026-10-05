"""Aggregate numbers the public landing page shows as proof the product is used.

The endpoint behind this is unauthenticated, so everything here is a count
over the whole group. Keep it that way: adding a name, a phone number or a
per-player figure would publish it to anyone with the URL.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, EventStatus, ListStatus, Registration
from app.schemas.stats import PublicStats
from app.services.event_service import effective_status


async def public_stats(session: AsyncSession) -> PublicStats:
    # Statuses are resolved in Python with the same rule the match pages use: a
    # match is played once it's 90 minutes past kickoff, whatever the row says.
    events = list((await session.scalars(select(Event))).all())
    played = [e for e in events if effective_status(e) == EventStatus.COMPLETED]
    played_ids = [e.id for e in played]

    spot_counts = (0, 0)
    if played_ids:
        # Spots on matches that were actually played; a waitlisted name never played.
        spot_counts = (
            await session.execute(
                select(
                    func.count(),
                    func.count().filter(Registration.has_paid.is_(True)),
                ).where(
                    Registration.event_id.in_(played_ids),
                    Registration.list_status == ListStatus.CONFIRMED,
                )
            )
        ).one()

    return PublicStats(
        matches_played=len(played),
        matches_cancelled=sum(1 for e in events if e.status == EventStatus.CANCELLED),
        team_splits=sum(1 for e in played if e.teams_generated),
        first_match_on=min((e.event_date for e in played), default=None),
        spots_filled=spot_counts[0],
        spots_paid=spot_counts[1],
    )
