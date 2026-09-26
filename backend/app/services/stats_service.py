"""Aggregate numbers the public landing page shows as proof the product is used.

The endpoint behind this is unauthenticated, so everything here is a count
over the whole group. Keep it that way: adding a name, a phone number or a
per-player figure would publish it to anyone with the URL.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, EventStatus, ListStatus, Registration
from app.schemas.stats import PublicStats


async def public_stats(session: AsyncSession) -> PublicStats:
    event_counts = (
        await session.execute(
            select(
                func.count().filter(Event.status == EventStatus.COMPLETED),
                func.count().filter(Event.status == EventStatus.CANCELLED),
                func.count().filter(
                    Event.status == EventStatus.COMPLETED, Event.teams_generated.is_(True)
                ),
                func.min(Event.event_date).filter(Event.status == EventStatus.COMPLETED),
            )
        )
    ).one()

    # Spots on matches that were actually played; a waitlisted name never played.
    spot_counts = (
        await session.execute(
            select(
                func.count(),
                func.count().filter(Registration.has_paid.is_(True)),
            )
            .join(Event, Event.id == Registration.event_id)
            .where(
                Event.status == EventStatus.COMPLETED,
                Registration.list_status == ListStatus.CONFIRMED,
            )
        )
    ).one()

    return PublicStats(
        matches_played=event_counts[0],
        matches_cancelled=event_counts[1],
        team_splits=event_counts[2],
        first_match_on=event_counts[3],
        spots_filled=spot_counts[0],
        spots_paid=spot_counts[1],
    )
