"""Inbound Meta WhatsApp callbacks: opt-in replies, STOP, and delivery receipts.

Two things this endpoint must do that a normal route doesn't.

**The GET handshake.** When you register a webhook URL in Meta's App
Dashboard, Meta calls it once with `?hub.mode=subscribe&hub.verify_token=...
&hub.challenge=...` and expects the challenge echoed back verbatim if the
token matches. This is the one-time proof that we control this URL.

**The POST signature.** Every subsequent call carries `X-Hub-Signature-256`,
an HMAC-SHA256 of the *raw* request body keyed by the App Secret. It must be
computed over the untouched bytes — re-serialising parsed JSON before
verifying would silently break on any whitespace difference.

Meta expects a 200 for any POST it can deliver. Returning an error causes
retries, so anything we cannot interpret is acknowledged and logged rather
than rejected.
"""

import hashlib
import hmac
import logging

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response, status

from app.core.config import get_settings
from app.dependencies import SessionDep
from app.services import whatsapp_inbound

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

SIGNATURE_PREFIX = "sha256="


def _verify_signature(raw_body: bytes, signature_header: str | None) -> None:
    settings = get_settings()
    if not settings.meta_app_secret:
        # Fail closed. An unconfigured server must not accept unauthenticated
        # writes just because it has nothing to check them against.
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "WhatsApp is not configured on this server."
        )
    if not signature_header or not signature_header.startswith(SIGNATURE_PREFIX):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing signature.")

    presented = signature_header[len(SIGNATURE_PREFIX):]
    expected = hmac.new(
        settings.meta_app_secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(presented, expected):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid signature.")


@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    """One-time handshake Meta performs when the webhook URL is registered."""
    settings = get_settings()
    if hub_mode != "subscribe" or hub_verify_token != settings.meta_webhook_verify_token:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Verification token mismatch.")
    return Response(content=hub_challenge, media_type="text/plain")


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    session: SessionDep,
    x_hub_signature_256: str | None = Header(default=None, alias="X-Hub-Signature-256"),
):
    raw_body = await request.body()
    _verify_signature(raw_body, x_hub_signature_256)

    try:
        payload = await request.json()
        results = await whatsapp_inbound.process_webhook(session, payload)
        await session.commit()
        logger.info("Meta webhook handled: %s", results)
    except Exception:
        # Acknowledge anyway. A 500 makes Meta retry the same unparseable
        # payload for hours, and the useful record is the log line.
        await session.rollback()
        logger.exception("Failed to process Meta webhook")

    return Response(status_code=status.HTTP_200_OK)
