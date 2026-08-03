"""Inbound Twilio callbacks: opt-in replies, STOP, and delivery receipts.

This endpoint is publicly reachable, so every request must carry a valid
`X-Twilio-Signature`. The signature is an HMAC of the exact URL Twilio called
plus the sorted form fields, keyed by the account auth token. Behind Cloudflare
and Coolify the URL FastAPI sees is not the one Twilio signed, so the URL is
taken from configuration.

Twilio expects a 2xx with TwiML. Returning an error causes it to retry, so
anything we cannot interpret is acknowledged and logged rather than rejected.
"""

import logging

from fastapi import APIRouter, Header, HTTPException, Request, Response, status

from app.core.config import get_settings
from app.dependencies import SessionDep
from app.services import whatsapp_inbound

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def _verify_signature(url: str, form: dict[str, str], signature: str | None) -> None:
    settings = get_settings()
    if not settings.twilio_validate_signature:
        logger.warning("Twilio signature validation is disabled")
        return

    if not settings.twilio_auth_token:
        # Fail closed. An unconfigured server must not accept unauthenticated
        # writes just because it has nothing to check them against.
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Twilio is not configured on this server."
        )
    if not signature:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing signature.")

    try:
        from twilio.request_validator import RequestValidator
    except ImportError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Twilio package is not installed."
        ) from None

    validator = RequestValidator(settings.twilio_auth_token)
    if not validator.validate(url, form, signature):
        # TEMPORARY: diagnosing a live 403 mismatch (see reminders/webhook
        # investigation). Logs shapes, not values, to avoid putting phone
        # numbers/message bodies in logs. Remove once root-caused.
        logger.warning(
            "Twilio signature mismatch: url=%r form_keys=%s received_sig=%r expected_sig=%r",
            url,
            sorted(form.keys()),
            signature,
            validator.compute_signature(url, form),
        )
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid signature.")


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    session: SessionDep,
    x_twilio_signature: str | None = Header(default=None, alias="X-Twilio-Signature"),
):
    form = {key: str(value) for key, value in (await request.form()).items()}
    settings = get_settings()
    url = settings.twilio_webhook_url or str(request.url)

    # TEMPORARY: diagnosing a live 403 mismatch. Logs shapes and header
    # names, not values, to avoid putting phone numbers/message bodies or
    # the signature itself in logs where it's not needed. Remove once
    # root-caused.
    logger.warning(
        "Twilio webhook received: configured_url=%r request_url=%r has_sig_header=%s "
        "header_names=%s form_keys=%s",
        url,
        str(request.url),
        x_twilio_signature is not None,
        sorted(request.headers.keys()),
        sorted(form.keys()),
    )

    _verify_signature(url, form, x_twilio_signature)

    try:
        result = await whatsapp_inbound.process_inbound(session, form)
        await session.commit()
        logger.info("Twilio webhook handled: %s", result)
    except Exception:
        # Acknowledge anyway. A 500 makes Twilio retry the same unparseable
        # payload for hours, and the useful record is the log line.
        await session.rollback()
        logger.exception("Failed to process Twilio webhook")

    return Response(content=EMPTY_TWIML, media_type="application/xml")
