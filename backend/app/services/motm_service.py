"""Man of the Match: the ballot, casting a vote, and the result.

Secrecy is structural. No function in this module returns an individual vote,
and nothing exposes `voter_player_id`. The only thing that ever leaves is an
aggregate, and only once the window has closed. There is deliberately no
"who voted for me" query for anyone to call later.
"""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import clock
from app.models import Event, ListStatus, MotmVote, Player, Registration, TokenPurpose
from app.services import ladder_schedule, token_service

MINIMUM_CANDIDATES = 2
"""A ballot with one option is not a vote."""


async def confirmed_players(session: AsyncSession, event_id: uuid.UUID) -> list[Player]:
    rows = await session.scalars(
        select(Registration)
        .options(selectinload(Registration.player))
        .where(
            Registration.event_id == event_id,
            Registration.list_status == ListStatus.CONFIRMED,
            Registration.player_id.isnot(None),
        )
        .order_by(Registration.position)
    )
    return [row.player for row in rows if row.player is not None]


def is_open(event: Event, moment: datetime | None = None) -> bool:
    now = moment or clock.now_local()
    opens = ladder_schedule.motm_opens_at(event.event_date, event.event_time)
    closes = ladder_schedule.motm_closes_at(event.event_date, event.event_time)
    return opens <= now < closes


def has_closed(event: Event, moment: datetime | None = None) -> bool:
    now = moment or clock.now_local()
    return now >= ladder_schedule.motm_closes_at(event.event_date, event.event_time)


async def vote_count(session: AsyncSession, event_id: uuid.UUID) -> int:
    return int(
        await session.scalar(
            select(func.count()).select_from(MotmVote).where(MotmVote.event_id == event_id)
        )
        or 0
    )


async def has_voted(session: AsyncSession, event_id: uuid.UUID, voter_player_id: uuid.UUID) -> bool:
    """Whether this voter has already voted. Never reveals who they picked."""
    return bool(
        await session.scalar(
            select(func.count())
            .select_from(MotmVote)
            .where(MotmVote.event_id == event_id, MotmVote.voter_player_id == voter_player_id)
        )
    )


async def everyone_has_voted(session: AsyncSession, event: Event) -> bool:
    """Used to close the ballot early once the squad is done."""
    eligible = await confirmed_players(session, event.id)
    if len(eligible) < MINIMUM_CANDIDATES:
        return True
    return await vote_count(session, event.id) >= len(eligible)


async def ballot(session: AsyncSession, raw_token: str) -> dict:
    """Everything the ballot screen needs, without leaking any vote."""
    resolved = await token_service.resolve(session, raw_token, TokenPurpose.MOTM)
    event, voter = resolved.event, resolved.player

    candidates = [p for p in await confirmed_players(session, event.id) if p.id != voter.id]
    already_voted = await has_voted(session, event.id, voter.id)

    if has_closed(event):
        state = "closed"
    elif already_voted:
        state = "already_voted"
    elif len(candidates) < MINIMUM_CANDIDATES - 1:
        state = "not_enough_players"
    else:
        state = "open"

    return {
        "state": state,
        "event_id": str(event.id),
        "voter_name": voter.name,
        "closes_at": ladder_schedule.motm_closes_at(event.event_date, event.event_time).isoformat(),
        "candidates": [
            {"id": str(p.id), "name": p.name, "photo_url": p.photo_url} for p in candidates
        ],
    }


async def cast_vote(session: AsyncSession, raw_token: str, nominee_player_id: uuid.UUID) -> dict:
    resolved = await token_service.resolve(session, raw_token, TokenPurpose.MOTM)
    event, voter = resolved.event, resolved.player

    if has_closed(event):
        raise HTTPException(status.HTTP_409_CONFLICT, "Voting has closed for this match.")
    if nominee_player_id == voter.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot vote for yourself.")
    if await has_voted(session, event.id, voter.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already voted for this match.")

    eligible_ids = {p.id for p in await confirmed_players(session, event.id)}
    if nominee_player_id not in eligible_ids:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "That player did not play in this match."
        )

    session.add(
        MotmVote(event_id=event.id, voter_player_id=voter.id, nominee_player_id=nominee_player_id)
    )
    resolved.token.used_at = datetime.now(UTC)
    await session.commit()

    return {"state": "recorded", "closes_at": ladder_schedule.motm_closes_at(event.event_date, event.event_time).isoformat()}


async def result(session: AsyncSession, event: Event) -> dict:
    """The winner, or why there isn't one yet. Aggregate only."""
    if not has_closed(event) and not await everyone_has_voted(session, event):
        opens = ladder_schedule.motm_opens_at(event.event_date, event.event_time)
        return {
            "state": "open" if clock.now_local() >= opens else "pending",
            "closes_at": ladder_schedule.motm_closes_at(event.event_date, event.event_time).isoformat(),
            "winners": [],
        }

    rows = (
        await session.execute(
            select(MotmVote.nominee_player_id, func.count().label("votes"))
            .where(MotmVote.event_id == event.id)
            .group_by(MotmVote.nominee_player_id)
            .order_by(func.count().desc())
        )
    ).all()

    if not rows:
        return {"state": "no_votes", "winners": [], "closes_at": None}

    top = rows[0].votes
    winner_ids = [row.nominee_player_id for row in rows if row.votes == top]
    winners = [await session.get(Player, winner_id) for winner_id in winner_ids]

    return {
        "state": "decided",
        "votes": top,
        "winners": [
            {"id": str(p.id), "name": p.name, "photo_url": p.photo_url} for p in winners if p
        ],
        "closes_at": None,
    }
