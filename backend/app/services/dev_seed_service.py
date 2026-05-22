from datetime import date, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Event, ListStatus, Player, PlayerPosition, Registration, Venue


PLAYERS = [
    ("Adam Nowak", 8, PlayerPosition.MID, ["technical", "creative"]),
    ("Bartek Zielinski", 7, PlayerPosition.DEF, ["physical", "defensive"]),
    ("Cezary Lis", 6, PlayerPosition.ATT, ["clinical", "fast"]),
    ("Daniel Krol", 8, PlayerPosition.GK, ["leader"]),
    ("Emil Wrona", 5, PlayerPosition.MID, ["aerial"]),
    ("Filip Mazur", 7, PlayerPosition.DEF, ["defensive"]),
    ("Grzegorz Urban", 9, PlayerPosition.ATT, ["fast", "clinical"]),
    ("Hubert Sowa", 6, PlayerPosition.MID, ["technical"]),
    ("Igor Pawlak", 5, PlayerPosition.DEF, ["physical"]),
    ("Jan Malinowski", 8, PlayerPosition.GK, ["leader"]),
    ("Kamil Dudek", 6, PlayerPosition.ATT, ["creative"]),
    ("Lukasz Wilk", 7, PlayerPosition.MID, ["technical", "fast"]),
    ("Marek Grabowski", 5, PlayerPosition.DEF, ["aerial"]),
    ("Oskar Witek", 8, PlayerPosition.ATT, ["clinical"]),
]


async def seed_full_event(session: AsyncSession) -> dict[str, str]:
    venue = await session.scalar(select(Venue).where(Venue.name == "Parkowa Sport"))
    if not venue:
        venue = Venue(name="Parkowa Sport", default_day=3, default_time=time(19, 30), players_per_side=7, max_players=14)
        session.add(venue)
        await session.flush()
    event = await session.scalar(select(Event).where(Event.event_date == date.today()))
    if not event:
        event = Event(venue_id=venue.id, event_date=date.today(), event_time=time(19, 30), max_players=14, created_by_name="Demo Captain")
        session.add(event)
        await session.flush()
    for index, (name, skill, position, attributes) in enumerate(PLAYERS, start=1):
        player = await session.scalar(select(Player).where(Player.name == name))
        if not player:
            player = Player(name=name, skill_rating=skill, primary_position=position, attributes=attributes)
            session.add(player)
            await session.flush()
        existing = await session.scalar(select(Registration).where(Registration.event_id == event.id, Registration.display_name == name))
        if not existing:
            session.add(Registration(event_id=event.id, player_id=player.id, display_name=name, list_status=ListStatus.CONFIRMED, position=index))
    await session.commit()
    return {"status": "seeded", "event_id": str(event.id)}
