"""A person's own match history, for the app's "You" tab.

Identity is the session name (there is no auth), so a registration counts as
yours when its display name matches the name you go by, case-insensitively,
the same convention the creator checks use. Everything returned is already
visible on each match page; this only gathers it in one place.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Event, Registration
from app.schemas.history import HistoryItem
from app.services.event_service import effective_status


async def history_for(session: AsyncSession, name: str) -> list[HistoryItem]:
    rows = await session.scalars(
        select(Registration)
        .join(Event, Event.id == Registration.event_id)
        .options(selectinload(Registration.event).selectinload(Event.venue))
        .where(func.lower(Registration.display_name) == name.strip().lower())
        .order_by(Event.event_date.desc(), Event.event_time.desc())
    )
    items: list[HistoryItem] = []
    for registration in rows:
        event = registration.event
        items.append(
            HistoryItem(
                event_id=event.id,
                event_date=event.event_date,
                event_time=event.event_time,
                # A match is over 90 minutes after kickoff even if the row
                # still says upcoming; report it the way the match page does.
                status=effective_status(event),
                venue_name=event.venue.name,
                registration_id=registration.id,
                list_status=registration.list_status,
                position=registration.position,
                has_paid=registration.has_paid,
                price_per_person=float(event.price_per_person) if event.price_per_person is not None else None,
                pay_to_name=event.pay_to_name,
                payment_method=event.payment_method,
                payment_details=event.payment_details,
            )
        )
    return items
