from enum import StrEnum


class EventStatus(StrEnum):
    UPCOMING = "upcoming"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ListStatus(StrEnum):
    CONFIRMED = "confirmed"
    WAITLIST = "waitlist"


class PlayerPosition(StrEnum):
    GK = "GK"
    DEF = "DEF"
    MID = "MID"
    ATT = "ATT"
