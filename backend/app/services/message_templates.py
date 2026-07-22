"""Message text, keyed by template id, and the metadata needed to invoke each
one as a Meta-approved WhatsApp template.

English only, for now. The group speaks several languages, but getting Meta's
locale codes and template approval right across six languages added real risk
for no proven benefit yet — simplify to one language, prove the whole pipeline
works end to end, then re-expand. `SUPPORTED_LANGUAGES` and `META_LANGUAGE_CODE`
are still keyed by language on purpose: re-adding a language later is adding
rows back to these tables, not restructuring the module. `players.preferred_language`
stays in the schema; it's simply not consulted for wording yet, since every
language normalises to English until more are added back.

Every proactive WhatsApp message (anything outside the 24-hour window since
the recipient last messaged us) must be sent as a **structured template
invocation** — a template name, a Meta locale code, and an ordered list of
parameters — not a rendered sentence. `TEMPLATES` below stays as human-
readable text for documentation and template submission; `build_components()`
turns it into the shape `meta_whatsapp_gateway` actually sends.

Parameter order matters and must match what was submitted for approval in
WhatsApp Manager exactly, or the send fails. `PARAM_ORDER` is the single
source of truth for that order — change a template's parameters there and in
WhatsApp Manager together.
"""

from typing import Final

DEFAULT_LANGUAGE: Final = "en"

SUPPORTED_LANGUAGES: Final[tuple[str, ...]] = ("en",)

# Meta's exact template-language codes, not our internal ones. Only English is
# supported today; see the module docstring for why.
META_LANGUAGE_CODE: Final[dict[str, str]] = {
    "en": "en_US",
}

# Template identifiers. One per proactive message kind.
INVITE: Final = "invite"
PAYMENT_REMINDER: Final = "payment_reminder"
MOTM_BALLOT: Final = "motm_ballot"
WAITLIST_PROMOTED: Final = "waitlist_promoted"
OPT_IN_CONFIRM: Final = "opt_in_confirm"

# The exact name each template was (or will be) submitted under in WhatsApp
# Manager, and the order its {{1}}, {{2}}, ... parameters appear in.
TEMPLATE_META: Final[dict[str, dict]] = {
    INVITE: {"meta_name": "footbolski_invite", "params": ("name", "when", "venue", "seats", "link")},
    PAYMENT_REMINDER: {
        "meta_name": "footbolski_payment_reminder",
        "params": ("name", "amount", "when", "handle", "method", "link"),
    },
    MOTM_BALLOT: {"meta_name": "footbolski_motm_ballot", "params": ("name", "link")},
    WAITLIST_PROMOTED: {
        "meta_name": "footbolski_waitlist_promoted",
        "params": ("name", "when", "venue", "link"),
    },
    OPT_IN_CONFIRM: {"meta_name": "footbolski_opt_in_confirm", "params": ("name",)},
}

TEMPLATES: Final[dict[str, dict[str, str]]] = {
    INVITE: {
        "en": "Hi {name}, football on {when} at {venue}. {seats} spots left. Tap to claim yours: {link}",
    },
    PAYMENT_REMINDER: {
        "en": "Hi {name}, reminder to pay {amount} for football on {when}. Send to {handle} via {method}. Details: {link}",
    },
    MOTM_BALLOT: {
        "en": "Good game, {name}. Who was Man of the Match? Vote here, it's secret: {link}",
    },
    WAITLIST_PROMOTED: {
        "en": "Good news {name}, a spot opened up. You're in for football on {when} at {venue}. Details: {link}",
    },
    OPT_IN_CONFIRM: {
        "en": "You're set up for Footbolski messages, {name}. We'll only message you about games. Reply STOP at any time.",
    },
}


def normalise_language(language: str | None) -> str:
    """Reduce a stored preference to a language we actually have text for.

    Every non-English preference currently falls back to English — see the
    module docstring.
    """
    if not language:
        return DEFAULT_LANGUAGE
    code = language.strip().lower().replace("_", "-").split("-")[0]
    return code if code in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def render(template_id: str, language: str | None, **fields: object) -> str:
    """Human-readable rendering, for logs, previews and the setup guide.

    Never sent to WhatsApp directly — Meta requires the structured form from
    `build_components()`. Leaves an unknown placeholder visible rather than
    raising.
    """
    variants = TEMPLATES.get(template_id)
    if variants is None:
        raise KeyError(f"Unknown message template: {template_id}")

    text = variants.get(normalise_language(language)) or variants[DEFAULT_LANGUAGE]
    try:
        return text.format(**fields)
    except (KeyError, IndexError):
        return text


def build_components(template_id: str, language: str | None, **fields: str) -> dict:
    """Build the `template` message body Meta's Cloud API expects.

    Missing fields render as an empty string rather than raising — a template
    with a blank slot still sends, whereas an exception here would drop the
    message from a sweep entirely.
    """
    meta = TEMPLATE_META.get(template_id)
    if meta is None:
        raise KeyError(f"Unknown message template: {template_id}")

    parameters = [
        {"type": "text", "text": str(fields.get(param, ""))} for param in meta["params"]
    ]
    return {
        "name": meta["meta_name"],
        "language": {"code": META_LANGUAGE_CODE[normalise_language(language)]},
        "components": [{"type": "body", "parameters": parameters}],
    }


def first_name(display_name: str | None) -> str:
    """The name to greet someone by.

    Guards the case that used to crash the sweep: `"".split()[0]` raises
    IndexError, and a blank or whitespace-only display name is entirely possible
    because names come from a free-text field with no validation.
    """
    if not display_name or not display_name.strip():
        return "there"
    return display_name.strip().split()[0]
