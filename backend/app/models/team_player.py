import uuid
from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PlayerPosition


class TeamPlayer(Base):
    __tablename__ = "team_players"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id"), nullable=False)
    player_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("players.id"))
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    position_role: Mapped[PlayerPosition] = mapped_column(Enum(PlayerPosition, name="player_position"))
    pitch_x: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    pitch_y: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    team: Mapped["Team"] = relationship(back_populates="players")
    player: Mapped["Player | None"] = relationship()
