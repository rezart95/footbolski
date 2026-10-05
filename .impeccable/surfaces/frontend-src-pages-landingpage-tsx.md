---
version: 1
slug: "frontend-src-pages-landingpage-tsx"
primary_target: "frontend/src/pages/LandingPage.tsx"
related_targets: []
---

# Landing page (`/` for visitors with no session)

Mode: Persuade. Audience: people who organise a recurring pickup game (expats in Polish cities first); secondary: existing members on a fresh device. Action: "Enter your name" (session-name identity; no Google or other login). Proof: live aggregate stats from the Kraków group via a public, name-free endpoint. Every lineup and name on the page is sample data, labelled. First surface of a full app redesign; the old dark-pitch look is an anti-reference.

## Direction contract

THESIS: One poster, one idea: a football cut into two coloured halves, the fair split, announces a weekly game that runs itself. Refuses the SaaS hero with phone mockup and feature tiles, and the old dark-pitch-plus-neon.

OWN-WORLD: Polish Poster School rendered disciplined: flat screenprint fields, never blended. Paper #F2F1EC, ink #16161A, poster red #D2231A (Team A), ultramarine #1C2E91 (Team B), ochre #E8A317 (money only). Cut-paper SVG shapes with slightly irregular edges, no gradients, no glass, no shadows. Display type stretched to fill the poster width; sturdy grotesque body. Both self-hosted.

STORY: The organiser sees in seconds: sign-ups with a waitlist, payments tracked, fair teams. They believe it because a real group's live numbers are there, and they tap Enter your name.

FIRST VIEWPORT: Paper ground. Wordmark lettered full width at top with an "I already play" link. The split ball dominates (mobile ~75vw centred; desktop bleeding off the right edge). Headline "Fourteen in. Everyone paid. Fair teams." A ticket-stub CTA holding the entry button, within thumb reach.

FORM: Polish Poster School, #1 on the ordered list (IMPECCABLE'S PICK over the assigned Sticker Album), seed 81adb639, code-led. Signature interaction: on load the ball's halves slide apart along the cut and settle.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions
- SEO and GDPR tracked in issue #21 (not in this build).
- Google login is out of scope: identity stays a session name.
