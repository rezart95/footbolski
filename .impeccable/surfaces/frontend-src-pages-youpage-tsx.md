---
version: 1
slug: "frontend-src-pages-youpage-tsx"
primary_target: "frontend/src/pages/YouPage.tsx"
related_targets: ["frontend/src/pages/EventsListPage.tsx","frontend/src/pages/PlayersPage.tsx","frontend/src/pages/AdminPage.tsx","frontend/src/pages/TermsPage.tsx","frontend/src/pages/InviteConfirmPage.tsx"]
---

# App phase two: You, Matches, Players, Admin, Terms, Invite

Mode: Operate (Terms: Read). Extends the approved match sheet (see the MatchSheet surface brief): same ground/fg tokens, ink rules, poster type roles, colour laws. User asked for "bolder" on both structure and look. Navigation becomes Match · Matches · Players · You; the Pitch tab is removed because it sat empty most of the week, and its drag-and-drop formation editor moves into the match sheet's Teams section. MOTM is frozen and out of scope.

## Direction contract

THESIS: Every screen answers one question at poster scale and then gives the facts: You is "where do I stand", Matches is "what's next and what happened", Players is "who plays where". Refuses card grids of equal boxes and settings-page lists.

OWN-WORLD: Same as the match sheet. Paper/ink ground by scheme, ink rules, square shapes, Anybody for headlines and numerals only, Schibsted for everything else. Red/blue only for teams (pitch tokens, team panels), ochre only for money (the You-owe field, paid chips). Full-colour player photos in square ink-bordered frames.

STORY: A member opens You and sees their season and exactly what they still owe, with the handle to pay it; Matches reads like a fixture list; Players reads like a squad sheet grouped by position; the organiser edits the formation right under the teams.

FIRST VIEWPORT: You at 390x844: your name set large; a strip of season numerals (played, paid); an ochre "You owe" field with the total as a numeral and the first unpaid match, or "All square" when clear. Matches: headline, "Set up" action, the next match as a big date block (day numeral, month, weekday) with venue and count.

FORM: extension of The Match Sheet (seed 0f5e3f7a), code-led, no new concept round. Bolder moves: season numerals and owed total at poster scale; fixture date blocks; position-grouped squad with headline section titles; a paper pitch with ink markings and red/blue tokens.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
