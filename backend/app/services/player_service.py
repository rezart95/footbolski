import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Player, Registration
from app.schemas.player import PlayerCreate, PlayerUpdate


async def list_players(session: AsyncSession) -> list[Player]:
    return list((await session.scalars(select(Player).order_by(Player.name))).all())


async def get_player(session: AsyncSession, player_id: uuid.UUID) -> Player:
    player = await session.get(Player, player_id)
    if not player:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Player not found")
    return player


async def create_player(session: AsyncSession, payload: PlayerCreate) -> Player:
    player = Player(**payload.model_dump())
    session.add(player)
    await session.commit()
    await session.refresh(player)
    return player


async def update_player(session: AsyncSession, player_id: uuid.UUID, payload: PlayerUpdate) -> Player:
    player = await get_player(session, player_id)
    for key, value in payload.model_dump().items():
        setattr(player, key, value)
    await session.commit()
    await session.refresh(player)
    return player


async def delete_player(session: AsyncSession, player_id: uuid.UUID) -> None:
    player = await get_player(session, player_id)
    # Remove registrations first (FK has no CASCADE, and we allow deletion
    # even when the player is linked to upcoming events)
    await session.execute(
        Registration.__table__.delete().where(Registration.player_id == player_id)
    )
    await session.delete(player)
    await session.commit()
