from typing import Literal

from pydantic import BaseModel

from app.models.reminder import ReminderChannel, ReminderStatus


class ReminderRequest(BaseModel):
    channel: Literal["push", "whatsapp"]
    created_by_name: str


class ReminderResult(BaseModel):
    channel: ReminderChannel
    status: ReminderStatus
    detail: str | None = None
    messages_sent_count: int | None = None
    messages_remaining: int | None = None
