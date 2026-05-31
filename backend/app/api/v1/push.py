from fastapi import APIRouter, Response, status

from app.core.config import get_settings
from app.dependencies import SessionDep
from app.schemas.push import (
    PushSubscriptionCreate,
    PushSubscriptionDelete,
    PushSubscriptionRead,
    VapidPublicKey,
)
from app.services import push_service

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public-key", response_model=VapidPublicKey)
async def vapid_public_key():
    return VapidPublicKey(public_key=get_settings().vapid_public_key)


@router.post("/subscriptions", response_model=PushSubscriptionRead, status_code=201)
async def create_subscription(payload: PushSubscriptionCreate, session: SessionDep):
    sub = await push_service.upsert_subscription(
        session,
        display_name=payload.display_name,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
        user_agent=payload.user_agent,
    )
    return sub


@router.delete("/subscriptions", status_code=204)
async def delete_subscription(payload: PushSubscriptionDelete, session: SessionDep) -> Response:
    await push_service.delete_subscription(session, payload.endpoint)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
