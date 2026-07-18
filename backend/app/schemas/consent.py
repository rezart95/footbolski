"""Schemas for terms acceptance."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConsentCreate(BaseModel):
    """A person accepting the terms. `terms_version` is echoed back by the client
    so a stale tab cannot silently record acceptance of text it never displayed."""

    display_name: str = Field(min_length=1, max_length=255)
    terms_version: str = Field(min_length=1, max_length=32)


class ConsentRead(BaseModel):
    display_name: str
    terms_version: str
    accepted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TermsStatus(BaseModel):
    """What the client needs to decide whether to prompt."""

    current_version: str
    accepted: bool
