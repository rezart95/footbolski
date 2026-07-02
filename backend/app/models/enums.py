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


class PaymentMethod(StrEnum):
    BLIK = "blik"
    REVOLUT = "revolut"
    BANK_TRANSFER = "bank_transfer"
