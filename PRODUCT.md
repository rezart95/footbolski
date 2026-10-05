# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

A mobile-first installable PWA. Installation is pushed hard (non-dismissible install banner) because iOS only delivers Web Push to installed PWAs.

## Users

- **Players.** A private recreational football group of roughly 20 people, mostly foreigners living in Poland, with English as the shared language. They open the app on a phone, usually in short bursts: to check the next match, say they're in or out, pay, and after full time vote for Man of the Match. Many arrive by tapping a link in WhatsApp, in an in-app browser, one-handed, sometimes outdoors at night.
- **Organisers.** A few regulars take turns creating matches. For their event, the organiser sets the venue, time, capacity and payment details, fills the spots, chases payments, sends reminders and generates the team split. Organiser is a per-event role (whoever created the event), not one fixed person.
- **Maintainers.** A named editor keeps everyone's player ratings, and a small admin set can delete cards and edit scouting notes. Today these are hard-coded names (`frontend/src/lib/roles.ts`, mirrored server-side).

## Product Purpose

Footbolski replaces the WhatsApp poll, the "I'm in" message chain and the spreadsheet a pickup football group otherwise runs on. It has three jobs, in priority order:

1. **Who's in.** Fill the match without chasing anyone: registration, a capacity limit, a waitlist with automatic promotion when someone drops out, and reminders to people who haven't answered.
2. **Payments.** Everyone knows what to pay, who to pay and how, and the organiser can see at a glance who has paid.
3. **Fair teams.** Balanced sides without the argument: an AI split that weighs skill, position, stamina and physique, a fallback algorithm, and a formation editor to adjust it.

It succeeds when a match fills, gets paid for, and kicks off with teams nobody disputes, and the organiser never had to chase anyone in the group chat.

The social layer (player cards, MOTM voting) exists and should be kept, but it supports these three jobs. It is not the reason the product exists.

## Positioning

A dedicated tool for one recurring match, built around how a real group organises: WhatsApp is where the group talks, and Footbolski is where attendance, money and teams get settled. The team split is the part a generic event or poll tool can't copy. It uses private, curated player ratings and scouting notes and is reasoned by Claude, so the sides are balanced on judgement, not just a number.

## Operating Context

- **Entry points.** The installed home-screen app. Deep links from WhatsApp (event invites, `/invite/:token`; MOTM ballots, `/motm/:token`) open in an in-app browser and use a bare layout without the install/notification chrome.
- **Messaging.** Web Push (VAPID) for installed users. WhatsApp via Meta's Cloud API with approved message templates. Twilio SMS as a capped fallback (max 2 per player per event, with a cooldown). The group's WhatsApp chat stays the social channel; new registrants are asked to join it.
- **Match lifecycle.** An event is `upcoming` until it becomes `completed` automatically 90 minutes after kickoff, or is `cancelled` by its creator. One event per creator per calendar day.
- **Payments.** These happen outside the app, by BLIK, Revolut or bank transfer to a handle the organiser enters. The app only records paid/unpaid.
- **Rhythm.** The busy moments are just after a match is created, the hours before kickoff (dropouts, waitlist, payment), and just after full time (MOTM).

## Capabilities and Constraints

- **Identity.** No authentication. Identity is a free-text name in `localStorage`, auto-matched to a player card. Privileged actions are checked server-side against the name. Acceptance of the Terms and Conditions happens at name entry.
- **Privacy.** Player phone numbers and the internal player `tier` must never reach any client response or UI. Ratings and scouting notes are maintained by the editor and admins only.
- **Language.** The UI is English-only by design. Outbound message templates are English-only for now. `players.preferred_language` is kept so languages can be re-added later.
- **Near-real-time.** Updates come from 15-second polling, with no WebSockets. Payment and registration changes are optimistic in the UI.
- **Offline.** Works offline in a limited way: app-shell fallback, and cached API GETs shown with an offline indicator.
- **Hosting.** Self-hosted on a single homeserver behind Cloudflare. Every push to `main` deploys to production; there is no staging.
- **Open decision: growth.** The intent is for Footbolski to become something other groups can adopt. Today it is single-group: hard-coded admin names, no multi-group model, no signup, no auth, one WhatsApp group link, Poland-specific payment methods. How it becomes multi-group is **undecided**. New work should avoid deepening single-group assumptions where it costs little, but should not build multi-group features speculatively.

## Brand Commitments

- **Name.** Footbolski.
- **Voice.** Plain utility language: orientation, status, action. A control says what it does; an error says what went wrong and what to do next. Formal register for legal text (`frontend/src/content/terms.ts`).
- **Dates.** Rendered as `09-July-2026`.
- **Visual identity.** Recorded separately in `DESIGN.md`.

## Evidence on Hand

- A real player roster with photos (MinIO), ratings, attributes and notes: live data, private.
- Real venues, seeded in `backend/app/core/seed.py`.
- A product demo video, linked from `README.md`.
- Terms and Conditions (`frontend/src/content/terms.ts`).
- None of the following exist: testimonials, usage metrics, other groups using the product, or press. Future work must not invent any of these.

## Product Principles

1. **The organiser never chases.** Anything a player needs to act on (join, pay, vote) should reach them and take one tap. Every manual follow-up in the group chat is a failure.
2. **Answer first, one-handed.** Most visits last seconds, on a phone, often from a WhatsApp link. Lead with the answer (am I in, what do I owe, which team am I on) and keep the action within thumb reach.
3. **Fairness is visible, ratings are not.** Show the reasoning behind the teams. Keep the private inputs (ratings, tiers, notes, phone numbers) private.
4. **Trust over enforcement.** There's no login, so identity is a name you trust. Keep the barrier to entry at "type your name". Real enforcement lives server-side.
5. **Built for one group, not locked to one.** Solve this group's real problems concretely, without hard-wiring things that would block other groups later.

## Accessibility & Inclusion

- Readable at a 320px width. Long Polish, Albanian, Spanish and Portuguese names must wrap, never truncate, and render their Latin Extended characters (ç, ñ, ó, ł, ń seen in the roster) in the chosen faces. No roster name uses Cyrillic (checked 2026-09-26).
- Tap targets are at least 48px, because the app is used one-handed, outdoors and at night.
- The app is used by non-native English speakers, so copy stays short and literal, with no idioms.
