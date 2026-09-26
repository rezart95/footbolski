---
name: Footbolski
description: A weekly pickup game that runs itself, printed as a Polish School poster.
colors:
  paper: "#F2F1EC"
  ink: "#16161A"
  poster-red: "#D2231A"
  poster-blue: "#1C2E91"
  poster-ochre: "#E8A317"
  team-red-night: "rgb(255 122 108)"
  team-blue-night: "rgb(156 174 255)"
typography:
  display:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 7vw, 5.5rem)"
    fontWeight: 850
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 72"
  numeral:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "clamp(5.5rem, 14vw, 9rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 70"
  headline:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 3.5rem)"
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  sheet-heading:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "3.4rem"
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  section-headline:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 850
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  statement:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 800
    lineHeight: 1.15
    fontVariation: "'wdth' 80"
  app-numeral:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 70"
  lead:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.6vw, 20px)"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
  datum:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
  control:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.25
  label:
    fontFamily: "Schibsted Grotesk Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: "0px"
  full: "9999px"
spacing:
  gutter: "16px"
  gutter-wide: "32px"
  section: "80px"
  section-wide: "112px"
  container: "1280px"
  app-column: "512px"
  app-stack: "32px"
  tab-bar: "64px"
  tap: "48px"
components:
  ticket-cta:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    height: "48px"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    height: "48px"
  button-danger:
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    height: "48px"
  button-inverse:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    height: "48px"
  you-strip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "16px"
  notice-error:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "12px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "48px"
  tab-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "64px"
  tab-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "64px"
  paid-chip:
    backgroundColor: "{colors.poster-ochre}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "48px"
  money-field:
    backgroundColor: "{colors.poster-ochre}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px 20px"
  payment-handle:
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "48px"
  team-panel-red:
    backgroundColor: "{colors.poster-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "20px"
  team-panel-blue:
    backgroundColor: "{colors.poster-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "20px"
  pitch-token-red:
    backgroundColor: "{colors.poster-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    size: "40px"
  pitch-token-blue:
    backgroundColor: "{colors.poster-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    size: "40px"
  player-photo:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
  modal-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
  bib-taken:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  bib-waiting:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "48px"
---

# Design System: Footbolski

## Overview

**Creative North Star: "The Match Poster"**

Footbolski is printed, not rendered. Every surface is a poster from the Polish Poster School, set with discipline: flat screenprint fields of paper, ink and three pure inks, never blended, never glowing. One idea per poster, stated by one cut-paper image and one stretched headline, with the facts set in a sturdy grotesque underneath. The fair split is the brand's core picture: a football cut into a red half and a blue half.

The world has two registers. The landing page is the Poster register: low density, loud scale, a run of full-width posters on paper. The app (match sheet, Matches, Players, You, Admin, Terms, the invite link) is the Operate register of the same world: one narrow column where every screen answers its question at poster scale first (your spot, what you owe, what's next) and then gives the facts, separated by ink rules rather than boxed into cards. The app follows the phone: paper ground with ink by day, ink ground with paper at night. Colour is semantic before it is decorative: red and blue are always the two teams, ochre is always money, and "you" is an inverted field.

Brand imagery is drawn in code as SVG cut paper (straight scissor snips, pieces cut away with masks rather than painted over); the only rasters in the app are members' own photos, shown in full colour inside square ink frames, and the app icons rendered from the split ball. There are no gradients and no shadows anywhere. The previous look (dark pitch green, neon accent, glass surfaces, Space Grotesk and Inter) is an anti-reference; its last traces survive only on the frozen Man of the Match ballot, recorded under Legacy.

**Key Characteristics:**
- Flat screenprint fields; ink for everything structural; paper by day, ink by night in the app.
- Red and blue mean the two teams; ochre means money; nothing else takes them.
- "You" and errors are the ground inverted, never a hue.
- Condensed, heavy display type (Anybody, width 70-88%) for headings and numerals only; Schibsted Grotesk for every control and datum.
- Ink rules separate; cards and boxes do not.
- Square corners, solid ink rules, zero shadows.
- One signature motion: the split ball's halves slide apart along the cut.

## Colors

Five flat inks on a warm off-white sheet, plus two lighter team tones for text on the night ground; no tints, no blends, no gradients.

### Primary
- **Team Red** (poster-red): Team A. Fills the Reds team panel, the red pitch tokens, the word "Fair" and the left half of the split ball, and marks the hover underline of text links on the landing. Darkened from #D8261C so paper text on it passes 4.5:1. Same value in both schemes.
- **Ultramarine** (poster-blue): Team B. Fills the Blues team panel, the blue pitch tokens, "teams." and the right half of the split ball. Same value in both schemes.
- **Night Red and Night Blue** (team-red-night, team-blue-night): the team inks when they are *text* on the ink ground at night (pitch half labels, formation labels). By day, team text uses poster-red and poster-blue. Exposed as the `team-red` / `team-blue` semantic colours, which swap with the colour scheme; never used as fills.

### Secondary
- **Money Ochre** (poster-ochre): payment and nothing else. The landing's payments poster; the match sheet's money ticket; the You tab's "You owe" field; the filled "Paid" chip; the "Paid" tag in your match history; text selection. It is ochre with ink text in both schemes.

### Neutral
- **Poster Paper** (paper): the ground by day and on the landing always; text on ink, red and blue fields; the browser chrome colour by day (theme-color, manifest background).
- **Print Ink** (ink): text, rules and borders by day; the ground at night (theme-color at night); text on ochre in both schemes; the modal scrim at 60%.
- **Ground and Foreground** (semantic, not new colours): the app paints with `ground` and `fg`, which resolve to paper and ink by day and swap at night. Secondary text is `fg` at reduced opacity (55-85%); rules are `fg` at 20-40% for list rows and full `fg` at 2px for section rules. Never a new grey.

### Legacy (do not use)
The old pitch-green scale (#0A1A0F to #3DDB6A), the `glow` shadow and the glass `.surface` panel still exist in code solely for the frozen Man of the Match ballot, which is out of scope. They are not part of this system; delete them when that page is redrawn. The `body` and `display` font aliases are likewise leftovers that now point at Schibsted Grotesk; new work uses `grotesk` and `poster`.

### Named Rules
**The Two Teams Rule.** Red is Team A and blue is Team B, always as a pair, always in that order (red first, left or top). Never use either for errors, warnings, destructive actions, brand accent or decoration unrelated to the teams.

**The Money Is Ochre Rule.** Ochre marks money only: prices, the owed total, paid state, payment handles. The primary action is ink precisely because it is not a payment.

**The You Are Inverted Rule.** The member's own place (the status strip, their row in the list, their card tag, the next-match link on You) is the ground inverted: an ink field by day, a paper field at night. Errors borrow the same inversion because it is the loudest thing ink can do without a hue.

**The Flat Ink Rule.** Every colour is a solid field. No gradients, no glass, no glow; lower emphasis comes from `fg` opacity, not from new colours. The one translucent layer is the flat ink scrim (ink at 60%) behind an open sheet.

## Typography

**Display Font:** Anybody Variable (with system-ui, sans-serif), width axis used condensed
**Body Font:** Schibsted Grotesk Variable (with system-ui, sans-serif)

**Character:** Anybody, squeezed to 70-88% width at 800-900 weight, behaves like cut poster lettering that fills its space; Schibsted Grotesk is a sturdy newspaper grotesque that keeps the facts plain. Both are self-hosted via @fontsource and imported once at the app entry (no Google Fonts CDN, for GDPR), and must cover Latin Extended (ç, ñ, ó, ł, ń appear in names); Cyrillic is not required.

### Hierarchy
The app fixes three poster voices as roles and sets the size per use; the landing uses the same voices at poster scale.

- **Wordmark** (900, width 85-88%): FOOTBOLSKI. On the landing it is fitted to the full column width with SVG `textLength`; in the app's top bar and the link layout it is a 1.4rem line, the tab back to the next match.
- **Display** (850, 2.6rem / 4rem / 5.5rem, line-height 0.92, width 72%): the landing hero, one short sentence per line.
- **Headline** (850, width 75%, line-height 0.95): the poster voice for every heading. Landing sections 2.4-3.5rem. In the app: the sheet heading (the match's weekday, 3.4rem, uppercase, line-height 0.88; also "Called off" on an invite), your name on You (3rem), page headers (2.6rem), empty states (2.4rem), section headlines ("The list", "Teams", "Your matches", position groups, 2.1rem) and modal titles (2rem).
- **Statement** (800, 2rem / 3.75rem, line-height 1.05, width 78%, max 24ch): proof set as a sentence; on You the season line ("14 matches since… Paid for 12.") is a statement with inline numerals.
- **Title** (800, width 80%, line-height 1.15): sub-sections and panel names: team names (1.6rem), the "you" strip (1.5-1.6rem), "Waiting", "Organiser", "On the pitch", "Why these teams" (1.35rem), the landing ticket label.
- **Numeral** (900, width 70%, line-height 1, tabular): any figure that is the answer. Landing price 5.5-9rem; the owed total (4.5rem), the match price (3.75rem), skill (3.5rem, 1.6rem on cards), counts beside section headlines (2.1rem), fixture day numbers (5.5rem for the next match, 1.9rem in the list), list spot numbers (1.4rem), Terms clause numbers (2rem).
- **Lead** (400, 18-20px, line-height 1.625, max 38ch): the landing hero explanation.
- **Body** (400, 17px, line-height 1.625, max 38-65ch): explanatory copy at `fg` 75-85%.
- **Datum** (600-700, 16-18px): names in lists and panels, dates, times, venue; tabular figures wherever digits appear.
- **Control** (700, 15px): button and chip labels; tab labels are 13px semibold.
- **Label** (500-700, 12-13px): captions, stat abbreviations (SPD, TEC), the "You" tag and the month under a fixture day number (12px bold uppercase, wide tracking). These label data; they never sit above a headline.

### Named Rules
**The Stretch To Fill Rule.** Display type is condensed and heavy so it fills the width like lettering; never set Anybody at its normal width or a light weight.

**The Two Voices Rule.** Anybody speaks only in headings and numerals. Every control, input, label and datum is Schibsted Grotesk.

**The Tabular Facts Rule.** Every count, price, score and date uses tabular figures so numbers hold still.

**The Borrowed Face Rule.** Roboto appears only inside Google's standard sign-in button, as Google's branding guidelines require. It is not part of this type system (the detector ignore lives in `.impeccable/config.json`).

## Layout

**Landing.** A run of full-width posters, each doing one job, stacked vertically, in a centred container (max 1280px) with 16px gutters on mobile and 32px from 640px. Sections breathe at 80px vertical padding, 112px from 1024px; on desktop they split roughly 5/7 or 6/6 on a 12-column grid, on mobile everything stacks and the CTA ticket is ordered above the explanation so it clears the fold. Colour fields run full-bleed; on desktop the hero ball sits under the wordmark, cropped by the right edge of the viewport.

**App.** One column, max 512px, centred, with 16px gutters (20px in the bare link layout used by WhatsApp deep links) and 24px top padding. Sections of a screen stack 32px apart. Inverted and ochre fields bleed to the column edge (they cancel the gutter) so they read as fields rather than boxes. A slim sticky top bar (56px plus the top safe area) carries the wordmark and, for admins, the admin door; the ink tab bar (64px plus the bottom safe area) is fixed across the foot, and the page reserves 88px plus the safe area beneath it. Lists are ruled rows at least 60px tall; the player squad is a 2-column grid (3 from 640px) grouped by position. Every screen reads at 320px, and every tap target is at least 48px.

## Elevation & Depth

None. The world is flat screenprint: no box shadows, no text shadows, no blur. Depth and separation come from colour fields meeting at hard edges, solid ink rules (1-2px), inversion, and occasional small rotations of cut pieces on the landing (-6deg to 3deg). An open sheet is separated from the page by the flat ink scrim, not by lift.

### Named Rules
**The Nothing Floats Rule.** If an element needs separation, give it a different field, an inversion or an ink rule. Never a shadow.

**The Rules Not Cards Rule.** App content is separated by ink rules, not enclosed in bordered or filled cards. A 2px `fg` rule under a section headline, 1px rules at 20% between rows.

## Shapes

Square corners throughout: fields, tickets, buttons, chips, inputs, sheets, photo frames and panels have no radius. The exceptions are functional circles: payment dots on the landing and the player tokens on the pitch; the Google button keeps Google's own 4px. Borders are solid `fg`: 2px for controls, chips, inputs, photo frames and section rules, 1px (at 20-40%) for list rules. Recurring cut-paper silhouettes: the ticket stub with two 11px half-circle notches bitten from its sides (landing CTA and the match sheet's money block), the training bib as a list spot on the landing, and the split ball whose outline is a run of straight scissor snips around a jittered circle.

## Components

### Buttons
Square ink controls, tactile and plain.
- **Shape:** square, at least 48px tall, 16px horizontal padding, 15px bold label, optional 18-22px stroke icon.
- **Primary:** `fg` field with `ground` label; hover drops to 85%.
- **Secondary:** 2px `fg` outline, `fg` label; hover washes `fg` at 7%.
- **Ghost:** label or icon only; used for icon actions (share, calendar, close).
- **Danger:** the secondary outline with an underlined label. Destructive actions (cancel match, delete match, delete card) are always this, and always behind a confirming sheet whose confirm is a primary button.
- **Inverse / Inverse outline:** the primary and secondary looks for use on an inverted field (Join on the "you" strip; Install and Update on their bars).
- **States:** 150ms colour transition; press nudges down 1px; disabled at 40% opacity. Focus is the global 3px `fg` outline at 2px offset, flipped to `ground` on inverted fields and to ink on ochre.

### Chips
- **Paid chip:** a 48px square control. Paid is an ochre field with ink "Paid" and a check; unpaid is a 2px outline at 60% reading "Paid?", full outline on hover. On your inverted row the outline is `ground`.
- **Payment Handle:** a full-width 2px outline in the surrounding text colour (works on ochre and on the ground), method icon plus the handle in bold tabular figures on the left, "Copy" / "Copied" on the right; tap copies.
- **Segmented choice:** adjoining 2px outlined options; the selected one fills `fg` with `ground` text.
- **Status tags:** small square tags in history rows, "Paid" as an ochre field, "Owed" as a 2px outline.

### Inputs / Fields
- **Style:** 2px `fg` outline on the ground, square, 48px tall, 16px text, placeholder at 55%. Labels sit above in 14px semibold. Selects are semibold.
- **Checkbox:** a drawn 24px square with a 2px outline that fills `fg` with a `ground` check; the native input stays for keyboard and assistive tech.
- **Range:** the native slider tinted `fg`.
- **Error / Disabled:** errors appear as a Notice beneath; disabled at 40%.

### Notices
- **Error:** an inverted field with an alert-triangle icon and 15px semibold message, announced as an alert. Never red.
- **Info / Success:** a 2px `fg` outline with an info or check icon.

### Navigation
- **Top bar:** sticky, `ground` with a 2px `fg` rule beneath; the FOOTBOLSKI wordmark links to the next match; an Admin door with a shield icon on the right for admins only.
- **Tab bar:** an inverted field fixed to the foot with four equal tabs, Match, Matches, Players, You: 22px stroke icon over a 13px semibold label, 64px tall. The current tab is cut out of the bar in the page's own ground, so it reads as the page you are on. Inactive labels at 80%, full on hover.
- **Link layout:** WhatsApp deep links get a bare page: wordmark over a 2px rule, the content, then an "Open Footbolski" underlined link. No install or push chrome.
- **Bars:** the install banner, update prompt and offline pill are inverted fields.

### Modal Sheet
A sheet of paper laid over the page: a bottom sheet on phones (2px `fg` rule on its top edge, up to 92% of the viewport), a centred 448px panel with a 2px outline from 640px. The title is a 2rem headline, the close is a ghost icon button, the body scrolls. Behind it, the flat ink scrim at 60%.

### Text Links
- **Style:** underlined with a 2px line; in the app the line sits at `fg` 40% and goes full on hover (venue map links, match history links), on the landing it is 600 weight ink and turns Team Red on hover. Always at least 48px tall where it is the only control.

### Page Header and Empty State
- **Page header:** a 2.6rem headline with an optional action on the right, over a 2px `fg` rule. No eyebrow: the heading carries itself.
- **Empty state:** a 2.4rem headline, one line of body saying how to fill it, an action, and optionally the still split ball above.

### Match Sheet (signature)
One match, answered first; used for the next match on Home and for any match at `/events/:id`.
- **Heading:** the weekday as a 3.4rem uppercase headline; date (`09-July-2026`) and time in 18px semibold tabular; the venue as a map link with a pin icon; share and add-to-calendar ghost icons on the right.
- **You strip:** an inverted field bleeding to the column edge: title-voice status ("You're in · No. 7"), a line on your money, and the one action (Join / Leave / Join waitlist) as an inverse button. Joining flips it at once.
- **The list:** "The list" headline with the count as a numeral (13/14, the capacity at 55%) over a 2px rule; numbered rows with the spot as a 1.4rem numeral, the name in 17px semibold, and the paid chip (plus a remind bell for the organiser). Your row is inverted and tagged "You". Open spots show as muted rows; the waitlist follows under a "Waiting" title.
- **Money:** an ochre ticket (the landing's notch mask) with the price as a 3.75rem numeral, "per person · BLIK", who to pay, the payment handle, and "n of m paid" over a 2px ink rule.
- **Teams:** the Team Panels, then the pitch; while Claude splits, the split ball plays its entrance beside "Splitting the teams…" instead of a spinner.
- **Organiser:** last and plain, under a 2px rule: a title, one line, and the danger button.

### Team Panels
Two square fields, Team Red then Ultramarine, stacked on phones (bleeding to the column edge) and side by side from 640px, paper text in both schemes. Team name in the title voice at 1.6rem; roster rows 17px semibold with 1px paper rules at 30%, position codes right-aligned in 14px bold with wide tracking.

### Pitch
The formation editor, living under the teams. A 2:3 field in the page's ground with a 2px `fg` outline and hairline `fg` markings at 30-55%. Red tokens hold the top half and blue the bottom: 40px circles with paper initials and a 2px ground ring, the first name on a small ground tag beneath. Team labels above and below the field are team-coloured text. The organiser picks a formation per side and drags tokens; a dragged token grows to 110% and follows the finger.

### Player Photo, Card and Stat Bars
- **Photo:** a square frame with a 2px `fg` outline. Underneath the photo lies the player's initials as a headline on an inverted field, so a missing or loading photo is a printed monogram, never a grey box. Photos are shown in full colour as uploaded.
- **Card (squad sheet):** photo, then name in 16px bold with the skill as a 1.6rem numeral on the right, then role, age and height at 75%. Your card carries an inverted "You" tag in its corner. Hover thickens the frame to 3px.
- **Stat bars:** eight attributes in two columns, each a flat `fg` bar out of ten on a 15% track, with a bold abbreviation and a tabular value.

### Fixture Rows (Matches)
The next match is a big date block: the day number as a 5.5rem numeral over the month in the title voice (uppercase), beside the weekday and time in the title voice, the venue and the count, 128px tall. Past matches are 64px ruled rows grouped under month dividers, the day as a 1.9rem numeral over a 12px uppercase month; a cancelled match strikes its day number with a 3px line and mutes the row. Rows wash `fg` at 4% on hover and end in a chevron.

### You
Your name as a 3rem headline; the season as a statement with inline 3.4rem numerals; the next match as an inverted link strip; an ochre "You owe" field with the total as a 4.5rem numeral and each unpaid match with its handle, or "All square" when clear; your card; your match history as fixture rows with Paid/Owed tags.

### Ticket CTA (landing)
- **Shape:** square rectangle with two 11px half-circle notches masked out of the left and right edges.
- **Colour:** ink field, paper title-voice label ("Run your own game"), holding the sign-in button beneath it; 16-20px by 28px padding; full width on mobile.
- **Sign-in button inside:** Google's standard light button, unaltered (white, #747775 1px outline, #1F1F1F Roboto Medium 16px, 4px radius, 48px tall, hover #F3F3F3, active #E8E8E8) with Google's four-colour mark. Its colours are Google's and sit outside this palette.

### Landing Pieces
- **Bibs:** list spots as training bibs; taken in solid ink with the number in paper (Anybody 800, width 80%), waiting as an outlined paper bib hung at a slight tilt.
- **Payment dots:** full circles with a 2px ink border on the ochre field; paid dots filled; rendered as one labelled image.
- **Sample caption:** every invented name or lineup on a public surface carries a label-size "Sample" caption.

### Split Ball (signature)
The system's one image. A football drawn as cut paper: jittered straight-snipped outline, pentagonal patches and seams cut out of the fill with an SVG mask (never painted over), and a scissor cut down the top seam dividing a Team Red half from an Ultramarine half. Its resting state is split. On mount the halves start joined and slide apart along the cut (1300ms, cubic-bezier(0.16, 1, 0.3, 1), 250ms delay); under reduced motion, or in the still variant used on empty states, it simply rests split. It is the landing hero, the "splitting the teams" state, the empty-home art and the source of the app icons.

### Wordmark
FOOTBOLSKI in Anybody 900: fitted edge to edge with SVG `textLength` on the landing, a 1.4rem line at 85% width in the app bars.

## Do's and Don'ts

### Do:
- **Do** paint the app with the semantic ground and foreground (paper and ink by day, swapped at night), and keep the landing on paper in both schemes.
- **Do** keep red and blue as the two teams and ochre as money, so a colour always tells the viewer which team or that money is involved.
- **Do** mark the member's own place, and every error, with an inverted field.
- **Do** put destructive actions in an outlined danger button behind a confirming sheet.
- **Do** separate app content with ink rules (2px under section headlines, 1px at 20% between rows) instead of cards.
- **Do** answer each screen's question at poster scale first (a headline or numeral), then give the facts.
- **Do** draw brand imagery as code SVG cut paper: straight snips, pieces cut out with masks, slight irregularity.
- **Do** show player photos in full colour inside a square 2px frame with the initials monogram beneath.
- **Do** set headings and numerals in Anybody at 800-900 weight and 70-88% width, and every control and datum in Schibsted Grotesk with tabular figures.
- **Do** self-host every font through @fontsource with Latin Extended coverage.
- **Do** label every invented name or lineup on a public surface as sample data.
- **Do** keep tap targets at 48px or more and the 3px focus outline on every control, flipped to the field's text colour on inverted and ochre fields.
- **Do** make any motion safe under `prefers-reduced-motion` by designing the resting state as the finished state.

### Don't:
- **Don't** use gradients, glass, glow or blur; every field is flat ink.
- **Don't** add box or text shadows, including hard offset shadows; separation comes from fields, inversion and ink rules.
- **Don't** use ochre for a CTA, highlight or decoration that is not about money.
- **Don't** use red or blue for errors, warnings, destructive actions or generic accent.
- **Don't** round corners on fields, tickets, buttons, chips, inputs, sheets, frames or panels; circles are for payment dots and pitch tokens only.
- **Don't** put a small label or eyebrow above a headline; the headline carries itself.
- **Don't** use a spinner for the team split; the split ball is the waiting state.
- **Don't** load fonts from the Google Fonts CDN, and don't add Roboto anywhere except inside Google's sign-in button.
- **Don't** use the legacy pitch-green colours, the glow shadow, the glass surface or the old font aliases; they exist only for the frozen MOTM ballot.
- **Don't** bring back the dark pitch ground, neon green accent, Space Grotesk or Inter.
- **Don't** replace a proof sentence with a row of stat tiles, or a screen's answer with a grid of equal cards.
