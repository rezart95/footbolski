"""Message text, keyed by (template id, language), and the metadata needed to
invoke each one as a Meta-approved WhatsApp template.

Six launch languages, chosen from what the group actually speaks: English,
Polish, Spanish, Brazilian Portuguese, Albanian and Ukrainian. Anything else,
and anyone with no stated preference, falls back to English rather than
failing.

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

SUPPORTED_LANGUAGES: Final[tuple[str, ...]] = ("en", "pl", "es", "pt", "sq", "uk")

# Meta's exact template-language codes. Not the same as our internal 2-letter
# codes — get one wrong and the send fails with "template not found" even
# though the template name is right. Portuguese has no bare "pt"; this group's
# Portuguese speakers are Brazilian (see the design doc's language premises),
# so pt_BR, not pt_PT.
META_LANGUAGE_CODE: Final[dict[str, str]] = {
    "en": "en_US",
    "pl": "pl",
    "es": "es",
    "pt": "pt_BR",
    "sq": "sq",
    "uk": "uk",
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
        "pl": "Cześć {name}, piłka w {when} na {venue}. Zostało miejsc: {seats}. Kliknij, aby zarezerwować: {link}",
        "es": "Hola {name}, fútbol el {when} en {venue}. Quedan {seats} plazas. Toca para reservar: {link}",
        "pt": "Olá {name}, futebol {when} em {venue}. Restam {seats} vagas. Toque para reservar: {link}",
        "sq": "Përshëndetje {name}, futboll më {when} te {venue}. Kanë mbetur {seats} vende. Kliko për ta zënë: {link}",
        "uk": "Привіт, {name}! Футбол {when} на {venue}. Залишилось місць: {seats}. Натисни, щоб зайняти: {link}",
    },
    PAYMENT_REMINDER: {
        "en": "Hi {name}, reminder to pay {amount} for football on {when}. Send to {handle} via {method}. Details: {link}",
        "pl": "Cześć {name}, przypomnienie o płatności {amount} za piłkę w {when}. Wyślij na {handle} przez {method}. Szczegóły: {link}",
        "es": "Hola {name}, recuerda pagar {amount} por el fútbol del {when}. Envía a {handle} por {method}. Detalles: {link}",
        "pt": "Olá {name}, lembrete para pagar {amount} pelo futebol de {when}. Envie para {handle} via {method}. Detalhes: {link}",
        "sq": "Përshëndetje {name}, kujtesë për të paguar {amount} për futbollin më {when}. Dërgo te {handle} me {method}. Detajet: {link}",
        "uk": "Привіт, {name}! Нагадування сплатити {amount} за футбол {when}. Надішли на {handle} через {method}. Деталі: {link}",
    },
    MOTM_BALLOT: {
        "en": "Good game, {name}. Who was Man of the Match? Vote here, it's secret: {link}",
        "pl": "Dobry mecz, {name}. Kto był zawodnikiem meczu? Zagłosuj tutaj, głosowanie jest tajne: {link}",
        "es": "Buen partido, {name}. ¿Quién fue el jugador del partido? Vota aquí, es secreto: {link}",
        "pt": "Bom jogo, {name}. Quem foi o melhor em campo? Vota aqui, é secreto: {link}",
        "sq": "Ndeshje e mirë, {name}. Kush ishte lojtari i ndeshjes? Voto këtu, është e fshehtë: {link}",
        "uk": "Гарна гра, {name}! Хто найкращий гравець матчу? Голосуй тут, це таємно: {link}",
    },
    WAITLIST_PROMOTED: {
        "en": "Good news {name}, a spot opened up. You're in for football on {when} at {venue}. Details: {link}",
        "pl": "Dobre wieści {name}, zwolniło się miejsce. Grasz w {when} na {venue}. Szczegóły: {link}",
        "es": "Buenas noticias {name}, se liberó una plaza. Juegas el {when} en {venue}. Detalles: {link}",
        "pt": "Boas notícias {name}, abriu uma vaga. Estás dentro {when} em {venue}. Detalhes: {link}",
        "sq": "Lajm i mirë {name}, u lirua një vend. Je brenda më {when} te {venue}. Detajet: {link}",
        "uk": "Гарна новина, {name}! Звільнилось місце. Ти граєш {when} на {venue}. Деталі: {link}",
    },
    OPT_IN_CONFIRM: {
        "en": "You're set up for Footbolski messages, {name}. We'll only message you about games. Reply STOP at any time.",
        "pl": "Wiadomości Footbolski są włączone, {name}. Piszemy tylko o meczach. Odpowiedz STOP, aby zrezygnować.",
        "es": "Ya recibes mensajes de Footbolski, {name}. Solo escribimos sobre partidos. Responde STOP cuando quieras.",
        "pt": "Estás a receber mensagens do Footbolski, {name}. Só escrevemos sobre jogos. Responde STOP quando quiseres.",
        "sq": "Je gati për mesazhet e Footbolski, {name}. Shkruajmë vetëm për ndeshjet. Përgjigju STOP në çdo kohë.",
        "uk": "Повідомлення Footbolski увімкнено, {name}. Пишемо лише про матчі. Відповідай STOP будь-коли.",
    },
}


def normalise_language(language: str | None) -> str:
    """Reduce a stored preference to a language we actually have text for."""
    if not language:
        return DEFAULT_LANGUAGE
    code = language.strip().lower().replace("_", "-").split("-")[0]
    return code if code in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def render(template_id: str, language: str | None, **fields: object) -> str:
    """Human-readable rendering, for logs, previews and the setup guide.

    Never sent to WhatsApp directly — Meta requires the structured form from
    `build_components()`. Falls back to English for an unknown language, and
    leaves an unknown placeholder visible rather than raising.
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
