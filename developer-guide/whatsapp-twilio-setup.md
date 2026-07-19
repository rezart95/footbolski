# Connecting Twilio to WhatsApp Business

This is the order that actually worked, not the order Twilio's own docs
suggest. It exists because we lost most of a day to three problems that
weren't documented anywhere obvious. Follow this order and you shouldn't hit
any of them.

**Audience:** whoever next has to do this — for a second Footbolski number,
a different Twilio account, or a similar setup on another project.

## The order, in one paragraph

Get Meta Business verification approved **before** touching Twilio's
WhatsApp sender flow — the Twilio embedded-signup "Continue" button silently
stays disabled until that clears, and nothing in the UI says so. Verify your
Twilio phone number by **voice call**, not SMS — Meta's SMS delivery to
Twilio numbers can fail with zero record of ever having been sent. Only
after the WhatsApp Business Account (WABA) exists and is linked do you set
production secrets and flip the number's messaging webhook off the Twilio
demo URL.

---

## 1. Meta Business verification — start this first

Before going near Twilio's "New WhatsApp sender" flow:

1. [business.facebook.com](https://business.facebook.com) → create a
   Business Portfolio if you don't have one. Name it after the product
   (`Footbolski`), not yourself.
2. **Settings → Business info → Start verification.**
3. You'll need something proving the business exists: an address, a
   document (utility bill, registration), a real website. Point it at your
   live domain — having one already deployed materially helps the
   application read as legitimate.
4. Submit and wait for approval **before proceeding to step 3 below.**

> **The actual blocker we hit:** Twilio's docs say business verification
> is *not* required to start the embedded signup, only before moving to
> production. In practice, the "Continue" button on the asset-selection
> step (`Seleziona le risorse business da condividere con Twilio`) stayed
> permanently greyed out, with no error anywhere, until portfolio
> verification cleared. We spent time checking browser extensions, trial
> account status, and 2FA settings — none of it was the cause. If that
> button won't enable, check verification status first before anything
> else.

## 2. Start the WhatsApp sender flow from Twilio, not from Meta

Twilio Console → **Messaging → Senders → WhatsApp senders → New WhatsApp
sender.**

- Select your **existing** business portfolio when the popup asks — don't
  create a second one.
- **Do this in Chrome, not Firefox/Brave/Safari.** The popup is Meta's
  domain embedded inside Twilio's; strict third-party-cookie blocking
  breaks it silently.
- Stay in the same browser tab for the whole flow. It times out after 60
  minutes of inactivity with no save — a timeout means starting over.

Do **not** manually create a WhatsApp Business Account on the Meta side
first and try to select it here. WABAs created outside this flow aren't
guaranteed to be selectable inside it, and you can end up with an orphaned
account and still no way through.

## 3. Verify the phone number by voice call, not SMS

You'll be asked to add a number and verify it. Use the Twilio number you
already have (e.g. `+1 447 247 4922`) — **the number's country does not
need to match your recipients' country.** WhatsApp is not SMS: there's no
carrier routing dependency, and a US-registered sender reaches players in
Poland exactly the same way a Polish one would. Don't spend an evening
provisioning a European number; it buys nothing.

**Choose "Text message" first if you want, but don't be surprised when
nothing arrives.** Twilio numbers are VoIP numbers, and a lot of OTP
delivery systems — including Meta's — silently refuse to hand off SMS to
them. Nothing gets logged anywhere because the message is never sent, not
even attempted. We confirmed this both in the Twilio console's Messaging
Logs and via a direct API query for messages to the number — zero results,
not "delayed."

**Switch to "Phone call" and route it through voicemail transcription:**

```bash
curl -u $TWILIO_SID:$TWILIO_AUTH_TOKEN -X POST \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/IncomingPhoneNumbers/<PHONE_SID>.json" \
  --data-urlencode "VoiceUrl=https://twimlets.com/voicemail?Email=<your-email>" \
  --data-urlencode "VoiceMethod=POST"
```

Find `<PHONE_SID>` (the `PNxxxxxxxx` resource id, not the phone number
itself) via:

```bash
curl -u $TWILIO_SID:$TWILIO_AUTH_TOKEN \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/IncomingPhoneNumbers.json?PhoneNumber=%2B14472474922"
```

Then trigger the call from Meta's verification dialog. Twilio answers as
voicemail, records Meta reading the code, transcribes it, and emails the
transcript. It lands within about a minute.

> The transcription occasionally mangles a digit (0/O, "won"/1). The audio
> recording is attached to the same email — trust the recording over the
> transcript text if the code is rejected.

**Set the voice webhook back to something sensible once you're through.**
This app doesn't use voice for anything; leaving it on the voicemail
twimlet is harmless but pointless.

## 4. Confirm the WABA actually attached

After verification, Twilio shows an asset-review screen listing what it can
access on the WhatsApp Business Account. Confirm, then check both sides:

- **Meta:** WhatsApp Manager should show the account with `1 of 6 tasks
  completed — Account connected to Twilio, Inc`, plus a "Connecting phone
  number to Twilio, Inc" step that finishes on its own within about a
  minute — refresh the page rather than waiting on a spinner.
- **Twilio:** `Messaging → Senders → WhatsApp senders` should list your
  real number, not the shared sandbox number
  (`whatsapp:+14155238886`). If you only see the sandbox number, the WABA
  hasn't actually attached yet — don't proceed to step 6.

## 5. Ignore the A2P 10DLC prompt

Twilio will offer to walk you through **A2P 10DLC Brand registration** once
a US number is active. This is a US-carrier framework for **SMS** to US
phone numbers. It does nothing for WhatsApp and nothing for messaging
players in Poland. Skip it. If SMS is ever added as a second channel (it's
explicitly deferred in the design — see `/CLAUDE.md`), it will need
Poland-specific sender registration, not this.

## 6. Set production config, then flip the webhook — in that order

**Do not point the number's messaging webhook at
`/api/v1/webhooks/whatsapp` until these four variables are live in
Coolify:**

| Variable | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | from Twilio Console |
| `TWILIO_AUTH_TOKEN` | **rotate before using** — see note below |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14472474922` (with the channel prefix) |
| `TWILIO_WEBHOOK_URL` | `https://api.footbolski.org/api/v1/webhooks/whatsapp` |

Why the order matters: `backend/app/api/v1/webhooks.py` validates every
inbound Twilio callback against `X-Twilio-Signature`, and **fails closed**
— if `TWILIO_AUTH_TOKEN` isn't set, it returns `503` to every request. If
you flip the number's webhook to point at your API before Coolify has the
token, every opt-in reply, STOP, and delivery receipt gets refused during
that gap, silently.

Once Coolify has the four variables and the backend has redeployed:

```bash
curl -u $TWILIO_SID:$TWILIO_AUTH_TOKEN -X POST \
  "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/IncomingPhoneNumbers/<PHONE_SID>.json" \
  --data-urlencode "SmsUrl=https://api.footbolski.org/api/v1/webhooks/whatsapp" \
  --data-urlencode "SmsMethod=POST"
```

This replaces the Twilio demo URL (`https://demo.twilio.com/welcome/sms/reply/`)
that ships as the default on every new number.

> **Rotate the auth token before this step**, even if it's currently
> working. Any token that has been shared over chat, pasted into a support
> ticket, or committed anywhere should be treated as compromised the moment
> it leaves the Twilio console. Console → **Account → API keys & tokens →
> Auth Tokens → Create secondary**, promote it, delete the old one. Twilio
> keeps both valid briefly during the swap, so there's no downtime window
> to plan around.

## 7. Submit the message templates

Every proactive WhatsApp message must map to a Meta-approved template.
**30 templates**, not the 18 originally estimated in the design doc — the
build shipped five message kinds (invite, payment reminder, MotM ballot,
waitlist promotion, opt-in confirmation), not three, across six languages.

Console → **Messaging → Content Template Builder → Create new** → type
*Text*, category **Utility**. One template per name below; add each
language as a variant of the same template.

Generate the current text directly from the source of truth rather than
copying from an old message — templates drift from the code faster than
anyone remembers to update a doc:

```bash
cd backend
PYTHONIOENCODING=utf-8 uv run python -c "
from app.services import message_templates as mt
ORDER = {
  mt.INVITE: ['name','when','venue','seats','link'],
  mt.PAYMENT_REMINDER: ['name','amount','when','handle','method','link'],
  mt.MOTM_BALLOT: ['name','link'],
  mt.WAITLIST_PROMOTED: ['name','when','venue','link'],
  mt.OPT_IN_CONFIRM: ['name'],
}
for tid, fields in ORDER.items():
    print('---', tid, '---')
    for lang in mt.SUPPORTED_LANGUAGES:
        text = mt.TEMPLATES[tid][lang]
        for i, f in enumerate(fields):
            text = text.replace('{'+f+'}', '{{'+str(i+1)+'}}')
        print(f'[{lang}] {text}')
"
```

> **The text must match `backend/app/services/message_templates.py`
> exactly**, placeholders and all. A mismatch fails the send with Twilio
> error **63024** and the message never arrives — no exception, no crash,
> just silence. If you edit wording in one place, edit it in the other in
> the same sitting.

Utility-category templates typically approve within minutes.

## 8. Schedule the tick

Nothing sends itself. Add a Coolify scheduled task:

```
POST https://api.footbolski.org/api/v1/internal/run-scheduler
Header: X-Internal-Secret: <INTERNAL_API_SECRET>
Interval: every 15 minutes
```

Confirm it's alive with:

```
GET https://api.footbolski.org/api/v1/internal/scheduler-health
Header: X-Internal-Secret: <INTERNAL_API_SECRET>
```

A stale `last_successful_tick` is the only signal the ladder has silently
died — an idle week looks identical otherwise.

## 9. The data problem no amount of Twilio config fixes

As of writing, **0 of 41 players have a phone number and 0 are tagged
`core`.** The T-5 ladder rung only reaches `core` players, so with perfect
Twilio setup it would message nobody. This is data entry, done through the
admin endpoint — never the public API:

```bash
curl -X PUT https://api.footbolski.org/api/v1/admin/players/<PLAYER_ID>/phone \
  -H "X-Internal-Secret: <INTERNAL_API_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "792435709"}'
```

Bare national format is fine — `default_phone_region: PL` in
`backend/app/core/config.py` resolves `792435709` to `+48792435709`
automatically.

`tier` defaults to `rest` for everyone. Set the 6–7 reliable regulars to
`core` directly in the database (there's no endpoint for it yet — it's
plain data, not something worth an API surface for a one-time pass):

```sql
UPDATE players SET tier = 'core' WHERE name IN ('...', '...');
```

Player `tier` is never exposed in any client response, by design — see
`DESIGN.md`. There's nothing to check in the UI for this.

## 10. Verification, cheapest checks first

Do these before a real Thursday finds the gaps for you:

1. Reply to the WhatsApp number from your own phone. `phone_verified_at`
   should get set, and a `reminders` row should appear with
   `kind=opt_in_confirm`.
2. Reply **STOP**. Your number should be cleared and `opted_out_at` set.
   Re-add the number and reply again to re-verify.
3. Create a test event 5 days out, put yourself as the only `core` player,
   trigger `POST /internal/run-scheduler` manually. You should get exactly
   one invite.
4. Tap the invite link. It should confirm with **no install banner and no
   bottom navigation** — those screens deliberately sit outside `AppShell`.
5. Tap the same link again. It should say you're already registered, not
   dead-end.
6. Check `delivered_at` fills in on that reminder row. That receipt is what
   makes the "zero seats lost without a delivered notification" rule
   verifiable rather than aspirational.

## What this costs

| | Per message | At 3 events/week |
|---|---|---|
| WhatsApp utility | ~$0.010 | ~$20/mo |
| SMS to Poland (deferred) | ~$0.043, doubled for `uk`/`sq` | ~$67+/mo — breaches the €50 ceiling |

## Security notes

- Twilio auth tokens are bearer credentials for the whole account. Never
  paste one into a chat, ticket, or doc that outlives the session — this
  guide deliberately has none in it. Rotate on any suspicion of exposure;
  there's no downtime cost to doing so.
- `INTERNAL_API_SECRET` guards `/api/v1/admin/*` and
  `/api/v1/internal/*`. It fails closed if unset — the routes refuse
  rather than opening up. Generate with
  `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
