import uuid

from pydantic import BaseModel, ConfigDict, Field


class PushKeys(BaseModel):
    p256dh: str = Field(min_length=1, max_length=255)
    auth: str = Field(min_length=1, max_length=255)


class PushSubscriptionCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)
    endpoint: str = Field(min_length=1, max_length=2048)
    keys: PushKeys
    user_agent: str | None = Field(default=None, max_length=500)


class PushSubscriptionDelete(BaseModel):
    endpoint: str = Field(min_length=1, max_length=2048)


class PushSubscriptionRead(BaseModel):
    id: uuid.UUID
    player_id: uuid.UUID
    endpoint: str

    model_config = ConfigDict(from_attributes=True)


class VapidPublicKey(BaseModel):
    public_key: str | None
