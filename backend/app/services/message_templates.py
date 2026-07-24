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
# Manager, the order its {{1}}, {{2}}, ... parameters appear in, and a sample
# value for each. Meta's automated review rejects a template with reason
# "Template variables without sample text" if `example` values aren't supplied
# at submission time — this isn't optional metadata, submission fails without
# it. Sample values are fictional, never a real player's data.
#
# The "_v2" suffix: the first submission (without example values) was
# rejected on all 5, then deleted. Meta's backend held the old names in a
# deletion tombstone far longer than the "retry in under a minute" its own
# error suggested — still blocked hours later — so re-submitting under a
# fresh name was faster than waiting out an unpredictable clear time.
#
# The invite template is separately on "_v3": "_v2" was approved but Meta's
# review recategorised it from Utility to Marketing — the wording ("spots
# are still open", "grab yours") read as a promotional CTA rather than a
# scheduling notice. Rather than risk an in-place content edit re-triggering
# the same recategorisation (or hitting the same delete-permission gaps hit
# earlier this project), "_v3" reworded it as a plain availability statement
# and was submitted fresh under Utility. The old "_v2" template still exists,
# approved, in WhatsApp Manager but is no longer referenced here.
TEMPLATE_META: Final[dict[str, dict]] = {
    INVITE: {
        "meta_name": "footbolski_invite_v3",
        "params": ("name", "when", "venue", "seats", "link"),
        "example": ("Alex", "Thu 23 Jul 19:30", "Centrum Sportu Parkowa", "3", "https://footbolski.org/invite/abc123xyz"),
    },
    PAYMENT_REMINDER: {
        "meta_name": "footbolski_payment_reminder_v2",
        "params": ("name", "amount", "when", "handle", "method", "link"),
        "example": ("Alex", "25 zł", "Thu 23 Jul 19:30", "514 437 184", "BLIK", "https://footbolski.org/events/abc123xyz"),
    },
    MOTM_BALLOT: {
        "meta_name": "footbolski_motm_ballot_v2",
        "params": ("name", "link"),
        "example": ("Alex", "https://footbolski.org/motm/abc123xyz"),
    },
    WAITLIST_PROMOTED: {
        "meta_name": "footbolski_waitlist_promoted_v2",
        "params": ("name", "when", "venue", "link"),
        "example": ("Alex", "Thu 23 Jul 19:30", "Centrum Sportu Parkowa", "https://footbolski.org/events/abc123xyz"),
    },
    OPT_IN_CONFIRM: {
        "meta_name": "footbolski_opt_in_confirm_v2",
        "params": ("name",),
        "example": ("Alex",),
    },
}

TEMPLATES: Final[dict[str, dict[str, str]]] = {
    INVITE: {
        "en": "Hi {name}, a football session is scheduled for {when} at {venue}, with {seats} spot(s) available. Confirm your attendance here: {link}. Thanks for being part of the group.",
    },
    PAYMENT_REMINDER: {
        "en": "Hi {name}, just a friendly reminder to send your payment of {amount} for the football match on {when}. Please send it to {handle} using {method}. Full details here: {link}. Thanks for playing!",
    },
    MOTM_BALLOT: {
        "en": "Good game today, {name}! It's time to vote for the Man of the Match. Your vote is completely secret and only takes a moment. Tap here to cast it: {link}. Thanks for playing with us!",
    },
    WAITLIST_PROMOTED: {
        "en": "Good news, {name}! A spot has opened up and you're now confirmed to play football on {when} at {venue}. Tap here for full details: {link}. See you there!",
    },
    OPT_IN_CONFIRM: {
        "en": "Thanks {name}, you're all set to receive Footbolski messages. We'll only reach out about upcoming games and important updates.",
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
