"""Low-level transports for push and SMS notifications.

All functions are best-effort and return a (success, detail) tuple. The
reminder service is responsible for orchestration, rate limits and logging.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import phonenumbers
from phonenumbers import NumberParseException

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def normalize_phone(raw: str | None, region: str | None = None) -> str | None:
    if not raw:
        return None
    settings = get_settings()
    try:
        parsed = phonenumbers.parse(raw, region or settings.default_phone_region)
    except NumberParseException:
        return None
    if not phonenumbers.is_valid_number(parsed):
        return None
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def send_push(
    *,
    endpoint: str,
    p256dh: str,
    auth: str,
    title: str,
    body: str,
    url: str | None = None,
) -> tuple[bool, str | None]:
    settings = get_settings()
    if not settings.vapid_private_key or not settings.vapid_public_key:
        return False, "VAPID keys not configured"

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        return False, "pywebpush not installed"

    payload: dict[str, Any] = {"title": title, "body": body}
    if url:
        payload["url"] = url

    try:
        webpush(
            subscription_info={
                "endpoint": endpoint,
                "keys": {"p256dh": p256dh, "auth": auth},
            },
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key.replace("\\n", "\n"),
            vapid_claims={"sub": settings.vapid_subject},
        )
        return True, None
    except WebPushException as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        detail = f"push failed (status={status}): {exc}"
        logger.warning(detail)
        return False, detail
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected push error")
        return False, f"push error: {exc}"


def is_push_gone(detail: str | None) -> bool:
    """Return True if a previous push failure means the subscription is dead."""
    if not detail:
        return False
    return "status=404" in detail or "status=410" in detail


def send_sms(*, to: str, body: str) -> tuple[bool, str | None]:
    settings = get_settings()
    if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number):
        return False, "Twilio not configured"

    try:
        from twilio.base.exceptions import TwilioRestException
        from twilio.rest import Client
    except ImportError:
        return False, "twilio not installed"

    try:
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        message = client.messages.create(
            from_=settings.twilio_from_number,
            to=to,
            body=body,
        )
        return True, f"sid={message.sid}"
    except TwilioRestException as exc:
        logger.warning("Twilio send failed: %s", exc)
        return False, f"twilio error: {exc.msg or exc}"
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected SMS error")
        return False, f"sms error: {exc}"
