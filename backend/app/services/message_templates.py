"""Message text, keyed by template id, and the metadata needed to invoke each
one as a Twilio Content Template over WhatsApp.

English only, for now. The group speaks several languages, but getting locale
codes and template approval right across six languages added real risk for no
proven benefit yet — simplify to one language, prove the whole pipeline works
end to end, then re-expand. `SUPPORTED_LANGUAGES` is still keyed by language on
purpose: re-adding a language later is adding rows back to this table, not
restructuring the module. `players.preferred_language` stays in the schema;
it's simply not consulted for wording yet, since every language normalises to
English until more are added back.

Every proactive WhatsApp message (anything outside the 24-hour window since
the recipient last messaged us) must be sent as a **structured template
invocation** — a Twilio Content SID and ordered variables — not a rendered
sentence. `TEMPLATES` below stays as human-readable text for documentation and
template submission; `build_components()` turns it into the shape
`twilio_gateway` actually sends.

Parameter order matters and must match what was submitted for approval
exactly, or the wrong value lands in the wrong slot. `TEMPLATE_META[...]["params"]`
is the single source of truth for that order — change a template's parameters
there and in the Twilio Content Template together.
"""

from typing import Final

DEFAULT_LANGUAGE: Final = "en"

SUPPORTED_LANGUAGES: Final[tuple[str, ...]] = ("en",)

# Template identifiers. One per proactive message kind.
INVITE: Final = "invite"
PAYMENT_REMINDER: Final = "payment_reminder"
MOTM_BALLOT: Final = "motm_ballot"
MOTM_WINNER: Final = "motm_winner"
WAITLIST_PROMOTED: Final = "waitlist_promoted"
OPT_IN_CONFIRM: Final = "opt_in_confirm"

# `content_sid` is the Twilio Content Template this maps to (created via
# POST /v1/Content, submitted via .../ApprovalRequests/whatsapp — see
# developer-guide/whatsapp-twilio-setup.md). `params` is the order values are
# substituted into {{1}}, {{2}}, ... — must match the order submitted for
# approval exactly, same rule as the Meta-direct setup this replaced.
#
# These were resubmitted fresh through Twilio's Content API rather than
# reusing the WABA's existing Meta-approved templates of the same name:
# Twilio's Content catalog is a separate system from Meta's WABA-level
# template approval, even on the same account — an already-approved WABA
# template does not appear there automatically (confirmed empirically: the
# account's Content list showed only Twilio's own example templates before
# these were created).
TEMPLATE_META: Final[dict[str, dict]] = {
    INVITE: {
        "content_sid": "HX603ba9f77e560460ceb34ce30e26f715",
        "params": ("name", "when", "venue", "seats", "link"),
    },
    PAYMENT_REMINDER: {
        "content_sid": "HXc120d2e2f8bdd656e62c774191452012",
        "params": ("name", "amount", "when", "handle", "method", "link"),
    },
    MOTM_BALLOT: {
        "content_sid": "HX41ca5225ceeb37c1548b8f896fdcabd1",
        "params": ("name", "link"),
    },
    MOTM_WINNER: {
        "content_sid": "HX1ea3946718babb1243c47778575c729f",
        "params": ("name", "when", "winner", "link"),
    },
    WAITLIST_PROMOTED: {
        "content_sid": "HXcc7f874768ecacb290db4629d52513c2",
        "params": ("name", "when", "venue", "link"),
    },
    OPT_IN_CONFIRM: {
        "content_sid": "HX1902fb51dc095cc77499a54ac3f3b9a0",
        "params": ("name",),
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
    MOTM_WINNER: {
        "en": "Good game, {name}! Man of the Match for {when}: {winner}. Congrats from the whole squad! Full details here: {link}.",
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

    Never sent to WhatsApp directly — Twilio requires the structured form
    from `build_components()`. Leaves an unknown placeholder visible rather
    than raising.
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
    """Build the payload `twilio_gateway.send_template` needs: a Content SID
    and its ordered variables as Twilio expects them — string keys "1", "2",
    ... matching the {{1}}, {{2}}, ... placeholders in the approved content.

    Missing fields render as an empty string rather than raising — a template
    with a blank slot still sends, whereas an exception here would drop the
    message from a sweep entirely. `language` is accepted for interface
    parity with the rest of the delivery pipeline but unused: only English is
    submitted today, so the content SID already fixes the language.
    """
    meta = TEMPLATE_META.get(template_id)
    if meta is None:
        raise KeyError(f"Unknown message template: {template_id}")

    variables = {str(i + 1): str(fields.get(param, "")) for i, param in enumerate(meta["params"])}
    return {"content_sid": meta["content_sid"], "content_variables": variables}


def first_name(display_name: str | None) -> str:
    """The name to greet someone by.

    Guards the case that used to crash the sweep: `"".split()[0]` raises
    IndexError, and a blank or whitespace-only display name is entirely possible
    because names come from a free-text field with no validation.
    """
    if not display_name or not display_name.strip():
        return "there"
    return display_name.strip().split()[0]


def winner_names(names: list[str]) -> str:
    """Join Man of the Match winners for the announcement. A tie is rare but
    `motm_service.result()` reports every top-voted player, so this must
    read naturally for one name or several."""
    first_names = [first_name(name) for name in names]
    if len(first_names) <= 1:
        return first_names[0] if first_names else "nobody this time"
    return " & ".join(first_names)
