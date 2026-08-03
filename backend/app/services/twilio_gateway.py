"""Twilio transport for WhatsApp.

Two things matter here beyond calling the API.

First, the Twilio SDK is synchronous. Called directly from an async handler it
blocks the event loop, so a sweep over forty players freezes the whole API for
the duration. Every call goes through `asyncio.to_thread`, and a semaphore caps
how many run at once so we neither stall nor flood Twilio.

Second, the client is built once and reused. Constructing one per message
rebuilds the HTTP session and TLS context every time.

Nothing here raises. Callers get a result tuple and decide what it means.
"""

import asyncio
import json
import logging
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)

MAX_CONCURRENT_SENDS = 5
_send_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SENDS)

WHATSAPP_PREFIX = "whatsapp:"


class TwilioNotConfigured(RuntimeError):
    """Raised internally when credentials are absent; never escapes this module."""


@lru_cache(maxsize=1)
def _client():
    settings = get_settings()
    if not (settings.twilio_account_sid and settings.twilio_auth_token):
        raise TwilioNotConfigured("Twilio credentials are not configured")
    from twilio.rest import Client

    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def is_configured() -> bool:
    """True if the channel has everything it needs to send."""
    settings = get_settings()
    return bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_whatsapp_from)


def _as_whatsapp(number: str) -> str:
    """Twilio addresses WhatsApp endpoints with a channel prefix."""
    return number if number.startswith(WHATSAPP_PREFIX) else f"{WHATSAPP_PREFIX}{number}"


def _send_blocking(
    *, from_: str, to: str, content_sid: str, content_variables: str, status_callback: str | None
) -> tuple[bool, str, str | None]:
    """Returns (ok, detail, provider_message_id). Runs on a worker thread."""
    try:
        from twilio.base.exceptions import TwilioRestException
    except ImportError:
        return False, "twilio package not installed", None

    try:
        message = _client().messages.create(
            from_=from_,
            to=to,
            content_sid=content_sid,
            content_variables=content_variables,
            status_callback=status_callback,
        )
        return True, f"queued ({message.status})", message.sid
    except TwilioNotConfigured as exc:
        return False, str(exc), None
    except TwilioRestException as exc:
        # Twilio codes worth recognising: 63016 means no open service window,
        # 63024 an unapproved template, 21610 the recipient replied STOP.
        detail = f"twilio error {exc.code}: {exc.msg or exc}"
        logger.warning(detail)
        return False, detail, None
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected Twilio error")
        return False, f"twilio send error: {exc}", None


async def send_template(*, to: str, template: dict) -> tuple[bool, str, str | None]:
    """Send a proactive message. `template` is the dict from
    `message_templates.build_components()` — a Content SID and its ordered
    variables. Required outside the 24-hour reply window, which every ladder,
    payment reminder, and MotM message always is."""
    settings = get_settings()
    if not is_configured():
        return False, "WhatsApp sender is not configured", None
    async with _send_semaphore:
        return await asyncio.to_thread(
            _send_blocking,
            from_=_as_whatsapp(settings.twilio_whatsapp_from),
            to=_as_whatsapp(to),
            content_sid=template["content_sid"],
            content_variables=json.dumps(template["content_variables"]),
            status_callback=settings.twilio_webhook_url,
        )


def reset_client_cache() -> None:
    """Drop the cached client. Used after credentials change."""
    _client.cache_clear()
