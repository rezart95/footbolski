---
version: 1
slug: "components-features-events-matchsheet-tsx-ad70402c"
primary_target: "frontend/src/components/features/events/MatchSheet.tsx"
related_targets: ["frontend/src/pages/HomePage.tsx","frontend/src/pages/EventDetailPage.tsx"]
---

# Match sheet (Home `/` for members, and `/events/:id`)

Mode: Operate. Members on phones, often one-handed, by day and at night (the app follows the phone's dark mode). Job: know whether I'm in, my number, what I owe; join/leave in one tap; organisers see who owes, remind, split teams, cancel. First surface of the app-wide migration to the poster world in DESIGN.md; shell (top bar, tab bar) and UI primitives are redone in the same pass. Player photos stay full colour (user decision). App icon redrawn from the split ball.

## Direction contract

THESIS: The match is one sheet that answers first: an ink strip says your spot and your money, then the list, the money, the teams. Refuses the old stack of equal glass cards and a dashboard of badges.

OWN-WORLD: DESIGN.md's poster world in Operate register. Ground is paper by day, ink at night (semantic ground/fg tokens), separation by ink rules, never cards. Anybody only for the day heading, section titles and numerals; Schibsted Grotesk for every control and datum. Red/blue only for teams, ochre only for money (paid chips, money block). Square controls, 2px ink borders, inverted ink fields for "you" and errors. No shadows, glass or glow.

STORY: A player sees in one glance whether they're in, their number and whether they've paid, and acts in one tap. The organiser sees who owes, reminds from the row, splits the teams.

FIRST VIEWPORT: 390x844: slim top bar (FOOTBOLSKI, first name); THURSDAY set large with date, time and venue link, share and calendar icons right; ink strip "You're in · No. 7 · not paid" with its action; the list starting with a 13/14 count; ink tab bar fixed at the bottom.

FORM: The Match Sheet, #2 of 6 ordered structures, seed 0f5e3f7a, code-led. Signature interaction: joining flips the strip and inks your row at once; marking paid fills the chip ochre.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisions
- Errors use an inverted ink field with an alert icon, never red (red is a team).
- Destructive actions (cancel, delete) are outlined buttons behind a confirm, not red.
- Remaining screens (events list, pitch, players, admin, terms, invite, MOTM) follow in phase 2 after the user reviews this pass.
