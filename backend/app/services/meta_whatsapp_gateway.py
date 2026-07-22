"""Direct transport to Meta's WhatsApp Cloud API — no BSP in between.

Two things matter here beyond calling the API.

First, sends are made with `httpx` async client rather than a sync SDK, so a
sweep over forty players doesn't block the event loop. A semaphore caps how
many run at once so we neither stall nor flood Meta.

Second, every proactive message (anything outside the 24-hour window since the
recipient last messaged us) must be sent as a `template` message — a name, a
locale code, and ordered parameters — never as free-form `text`. Meta rejects
free-form sends outside that window outright. `message_templates.build_components()`
builds the shape this module sends.

Nothing here raises. Callers get a result tuple and decide what it means.
"""

import asyncio
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v21.0"
MAX_CONCURRENT_SENDS = 5
_send_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SENDS)


def is_configured() -> bool:
    """True if the channel has everything it needs to send."""
    settings = get_settings()
    return bool(settings.meta_whatsapp_token and settings.meta_phone_number_id)


def _messages_url(phone_number_id: str) -> str:
    return f"https://graph.facebook.com/{GRAPH_API_VERSION}/{phone_number_id}/messages"


async def _post(payload: dict) -> tuple[bool, str, str | None]:
    """POST to the Cloud API. Returns (ok, detail, provider_message_id)."""
    settings = get_settings()
    url = _messages_url(settings.meta_phone_number_id)
    headers = {"Authorization": f"Bearer {settings.meta_whatsapp_token}"}

    async with _send_semaphore:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            logger.warning("Meta WhatsApp request failed: %s", exc)
            return False, f"request failed: {exc}", None

    if response.status_code == 200:
        body = response.json()
        message_id = body.get("messages", [{}])[0].get("id")
        return True, "sent", message_id

    # Meta error codes worth recognising: 131047 means no open service window
    # and no template was used; 132001 an unknown/unapproved template; 131026
    # the recipient's number cannot receive messages (e.g. never on WhatsApp).
    try:
        error = response.json().get("error", {})
        detail = f"meta error {error.get('code')}: {error.get('message')}"
    except ValueError:
        detail = f"meta http {response.status_code}: {response.text[:200]}"
    logger.warning(detail)
    return False, detail, None


async def send_template(*, to: str, template: dict) -> tuple[bool, str, str | None]:
    """Send a proactive message. `template` is the dict from
    `message_templates.build_components()` — a name, a language code, and
    ordered parameters. Required outside the 24-hour reply window, which
    every ladder, payment reminder, and MotM message always is."""
    if not is_configured():
        return False, "WhatsApp sender is not configured", None
    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("+"),
        "type": "template",
        "template": template,
    }
    return await _post(payload)


async def send_text(*, to: str, body: str) -> tuple[bool, str, str | None]:
    """Send free-form text. Only valid within 24 hours of the recipient's last
    message — used for nothing in this app today, kept for completeness since
    the Cloud API supports it and a future interactive reply might want it."""
    if not is_configured():
        return False, "WhatsApp sender is not configured", None
    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("+"),
        "type": "text",
        "text": {"body": body},
    }
    return await _post(payload)
