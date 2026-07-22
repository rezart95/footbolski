# WhatsApp via Meta's Cloud API — direct, no BSP

We tried Twilio first. Meta's embedded signup connected a WABA on Meta's
side, but the corresponding WhatsApp sender never appeared on Twilio's, and
a support ticket sat unanswered for over a week. We moved to Meta's Cloud
API directly instead — no middleman, no per-message BSP markup, and it
worked on the first real attempt.

**Audience:** whoever next has to reconnect this, add a second number, or
do the same thing on another project.

## Why direct, not through a BSP

A Business Solution Provider (Twilio, 360dialog, etc.) sits between you and
Meta and takes a cut per message. Meta's Cloud API is the same underlying
platform with no provider in between and no markup. The only reason to use
a BSP is if you want their tooling (a console UI, a support line) more than
you want to avoid the extra layer and cost. We didn't get far enough to
find out whether Twilio's tooling would have been worth it, because the
connection itself never completed.

## 1. Validate for free before touching production

Meta for Developers → your app → **Add Product → WhatsApp** auto-provisions
a **test phone number** and a throwaway WABA — completely separate from
whatever you may have half-set-up elsewhere. No OTP, no waiting, no
external verification.

Under **WhatsApp → API Setup**:

1. **Manage phone number list** → add your own number → Meta sends a
   verification code **to that number over WhatsApp**, not SMS. This
   sidesteps the VoIP-can't-receive-SMS problem entirely, since you're
   verifying the *recipient*, not the sender.
2. **Generate access token** — a short-lived token (hours), fine for this
   step only.
3. The page gives you a working `curl` example with real IDs. Run it. If a
   message arrives on your phone, the mechanism is proven before you've
   spent a single dollar or touched a phone-verification flow.

You'll walk away with a `Phone Number ID` and `WABA ID` for this **test**
resource. They're throwaway — the production setup below gets its own.

## 2. The one thing that isn't obvious: templates are structured, not text

Look at the `curl` Meta's own test page gives you — it sends
`"type": "template"` with a structured `components` array, not a plain
string. **Every message sent outside a 24-hour window since the recipient
last messaged you must be a template invocation**, with an approved
template name, a Meta locale code, and ordered parameters. There is no
"send this sentence" call for proactive messages, full stop.

This is why `message_templates.py` carries two things per template: the
human-readable text (`TEMPLATES`, for documentation and the setup script)
and the structured metadata (`TEMPLATE_META` — the exact Meta template name
and parameter order). `build_components()` turns one into the other.
`meta_whatsapp_gateway.send_template()` is the only send path in this app —
there is no free-text send for anything proactive.

## 3. Meta's language codes are not our language codes

Our internal codes are bare ISO 639-1 (`en`, `pl`, `es`, `pt`, `sq`, `uk`).
Meta wants specific locale codes, and getting one wrong means "template not
found" even when the template name is correct:

| Ours | Meta's | Note |
|---|---|---|
| `en` | `en_US` | |
| `pl` | `pl` | bare, no region |
| `es` | `es` | bare generic Spanish exists, no need to pick a region |
| `pt` | `pt_BR` | **no bare `pt`.** This group's Portuguese speakers are Brazilian, not European — `pt_PT` is a different code and will not match |
| `sq` | `sq` | bare |
| `uk` | `uk` | bare |

This mapping lives in `message_templates.META_LANGUAGE_CODE`. If a new
language is ever added, verify its exact code against Meta's own list
before assuming a bare ISO code works — most don't.

## 4. Submit the real templates

Same 30 templates (5 message kinds × 6 languages) as before, but submitted
through **Meta's own WhatsApp Manager → Message Templates** on the
production WABA — not through a BSP console. Category **Utility**. Text
must match `message_templates.TEMPLATES` exactly, and the parameter order
must match `TEMPLATE_META[...]["params"]` exactly — Meta numbers them
`{{1}}, {{2}}, ...` positionally, so a reordering silently sends the wrong
value into the wrong slot rather than failing outright.

Generate the current submission text from the source of truth:

```bash
cd backend
PYTHONIOENCODING=utf-8 uv run python -c "
from app.services import message_templates as mt
for template_id, meta in mt.TEMPLATE_META.items():
    print('---', meta['meta_name'], '---')
    print('params in order:', meta['params'])
    for lang in mt.SUPPORTED_LANGUAGES:
        text = mt.TEMPLATES[template_id][lang]
        for i, field in enumerate(meta['params']):
            text = text.replace('{'+field+'}', '{{'+str(i+1)+'}}')
        print(f'[{mt.META_LANGUAGE_CODE[lang]}] {text}')
"
```

Utility templates typically approve within minutes.

## 5. Get a production number and a long-lived token

The test number only works with up to 5 verified recipients — useless for
41 players. In WhatsApp Manager, add a real production number to the same
business's WABA and verify it (same "receive a code over WhatsApp on that
number" mechanism as the test flow).

The temporary access token from Step 1 expires in hours. For production,
generate a **long-lived System User token** instead:

Meta Business Settings → **Users → System Users → Add** → create a system
user with admin access to the WABA → **Generate token**, selecting the
`whatsapp_business_messaging` and `whatsapp_business_management` scopes,
token expiration **Never**. This is what goes into
`META_WHATSAPP_TOKEN` — not a per-session user token, which expires and
silently breaks every scheduled send until someone notices.

## 6. Configure

| Variable | Where it comes from |
|---|---|
| `META_WHATSAPP_TOKEN` | The long-lived System User token from step 5 |
| `META_PHONE_NUMBER_ID` | The **production** number's Phone Number ID (WhatsApp Manager → your number → API details) |
| `META_WABA_ID` | The WABA ID shown on the same page |
| `META_WEBHOOK_VERIFY_TOKEN` | Any string you choose — set the same value in the webhook subscription below |
| `META_APP_SECRET` | Meta App Dashboard → **Settings → Basic → App Secret** (click "Show") |

## 7. Subscribe the webhook

Meta App Dashboard → **WhatsApp → Configuration → Webhook**:

- Callback URL: `https://api.footbolski.org/api/v1/webhooks/whatsapp`
- Verify token: the exact value of `META_WEBHOOK_VERIFY_TOKEN`
- Subscribe to fields: **messages**

Meta calls the URL once with a `GET` carrying `hub.mode=subscribe`,
`hub.verify_token`, and `hub.challenge` — our endpoint echoes the challenge
back if the token matches. If that handshake fails, check the verify
token matches exactly and that the URL is reachable from the public
internet (not `localhost`).

Every subsequent `POST` carries `X-Hub-Signature-256`, an HMAC-SHA256 of the
**raw** request body keyed by the App Secret. `webhooks.py` fails closed —
if `META_APP_SECRET` is unset, every inbound call is refused with 503
rather than silently accepted.

## 8. The data problem no amount of API config fixes

As of writing, **0 of 41 players have a phone number and 0 are tagged
`core`.** The T-5 ladder rung only reaches `core` players, so with a
perfectly working channel it would message nobody. This is data entry,
through the admin endpoint — never the public API:

```bash
curl -X PUT https://api.footbolski.org/api/v1/admin/players/<PLAYER_ID>/phone \
  -H "X-Internal-Secret: <INTERNAL_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "792435709"}'
```

Bare national format is fine — `default_phone_region: PL` resolves
`792435709` to `+48792435709` automatically. Set the 6–7 reliable regulars
to `tier = 'core'` directly in the database (no endpoint for this yet — a
one-time pass over static data isn't worth an API surface):

```sql
UPDATE players SET tier = 'core' WHERE name IN ('...', '...');
```

## 9. Everyone has to reply once

WhatsApp will not let a business message someone proactively until that
person has sent at least one message first — that reply is also what marks
`phone_verified_at`. Post the number in the group and ask everyone to send
it anything once. One message in the WhatsApp group covers the whole
squad.

## 10. Verification, cheapest first

1. Reply to the number from your own phone. `phone_verified_at` should get
   set and a `reminders` row should appear with `kind=manual` (or whichever
   kind triggered it) and `channel=whatsapp`.
2. Reply **STOP**. Your number should be cleared and `opted_out_at` set.
   Re-add the number and reply again to re-verify.
3. Create a test event 5 days out, set yourself as the only `core` player,
   call `POST /internal/run-scheduler` manually. You should get exactly one
   invite.
4. Tap the invite link — confirms with no install banner, no bottom nav.
   Tap it again — says you're already registered, doesn't dead-end.
5. Check `delivered_at` fills in on that reminder row via the inbound
   webhook. That receipt is what makes "zero seats lost without a
   delivered notification" verifiable rather than aspirational.

## What this costs

Meta's own WhatsApp Business Platform pricing applies with no BSP markup on
top — check current per-conversation rates in Meta's Business Help Center,
since they vary by country and conversation category and change more often
than a static number here would stay accurate.

## Security notes

- The long-lived System User token is a bearer credential for the whole
  WABA. Never paste one into a chat, ticket, or doc that outlives the
  session.
- `META_APP_SECRET` guards every inbound webhook call. Treat it with the
  same care as the token — anyone with it can forge a callback that looks
  like it came from Meta.
- `INTERNAL_API_SECRET` guards `/api/v1/admin/*` and `/api/v1/internal/*`.
  It fails closed if unset. Generate with
  `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
