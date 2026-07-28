"""Phone number normalisation, shared by whichever channel needs an E.164 number."""

from __future__ import annotations

import phonenumbers
from phonenumbers import NumberParseException

from app.core.config import get_settings


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
