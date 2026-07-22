"""Small key-value store for operational state that must survive a restart.

Currently one key: the last successful scheduler tick. That value is the only
way to tell "the ladder ran and nobody replied" apart from "the ladder has been
dead since Tuesday", and those look identical from the outside. The homeserver is
a laptop that reboots, so this cannot live in memory.
"""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

LAST_SCHEDULER_TICK = "last_scheduler_tick"


class SystemState(Base):
    __tablename__ = "system_state"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
