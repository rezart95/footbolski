from typing import Literal

from pydantic import BaseModel

from app.models.reminder import ReminderChannel, ReminderStatus


class ReminderRequest(BaseModel):
    channel: Literal["push", "sms"]


class ReminderResult(BaseModel):
    channel: ReminderChannel
    status: ReminderStatus
    detail: str | None = None
    sms_sent_count: int | None = None
    sms_remaining: int | None = None
