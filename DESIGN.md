---
name: Footbolski
description: A weekly pickup game that runs itself, printed as a Polish School poster.
colors:
  paper: "#F2F1EC"
  ink: "#16161A"
  poster-red: "#D2231A"
  poster-blue: "#1C2E91"
  poster-ochre: "#E8A317"
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
    fontVariation: "'wdth' 75"
  statement:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 78"
  title:
    fontFamily: "Anybody Variable, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    fontVariation: "'wdth' 80"
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
components:
  ticket-cta:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
  team-panel-red:
    backgroundColor: "{colors.poster-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "28px 24px"
  team-panel-blue:
    backgroundColor: "{colors.poster-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "28px 24px"
  money-field:
    backgroundColor: "{colors.poster-ochre}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  payment-handle:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
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

Density is low and scale is loud. Headlines are set condensed and heavy so they fill the column like hand-lettered poster type; body copy stays calm and readable at 17px. Colour is semantic before it is decorative: red and blue are always the two teams, ochre is always money. Imagery is drawn in code as SVG cut paper (straight scissor snips, pieces cut away with masks rather than painted over), so there are no rasters, no photos, no gradients and no shadows anywhere in the world.

The previous look (dark pitch green, neon accent, glass surfaces, Space Grotesk and Inter) is an anti-reference for this system. The app surfaces outside the landing page still carry that old look and await migration to this system.

**Key Characteristics:**
- Flat screenprint fields on paper; ink for everything structural.
- Red and blue mean the two teams; ochre means money; nothing else takes them.
- Condensed, heavy display type (Anybody, width 70-88%) over a sturdy grotesque (Schibsted Grotesk).
- Cut-paper SVG imagery with slightly irregular, straight-snipped edges.
- Square corners, solid ink rules, zero shadows.
- One signature motion: the split ball's halves slide apart along the cut.

## Colors

Five flat inks on a warm off-white sheet; no tints, no blends, no gradients.

### Primary
- **Team Red** (poster-red): Team A. Fills the Reds team panel, colours the word "Fair", fills the left half of the split ball, and marks the hover underline of text links. Darkened from #D8261C during the build so paper text on it passes 4.5:1.
- **Ultramarine** (poster-blue): Team B. Fills the Blues team panel, colours "teams.", fills the right half of the split ball.

### Secondary
- **Money Ochre** (poster-ochre): payment and nothing else. The whole payments poster is an ochre field; the tilted "paid." highlight in the headline; the paid figures in the live stats on ink; text selection highlight.

### Neutral
- **Poster Paper** (paper): the ground of every poster, the text colour on ink/red/blue fields, the fill of waiting bibs. Also painted into browser chrome (theme-color, overscroll, scrollbar track) while the surface is mounted.
- **Print Ink** (ink): all body text, rules and borders, the CTA ticket, taken bibs, paid dots, the dark proof poster, and focus outlines on paper. Secondary text uses ink at reduced opacity (70-85%), never a new grey.

### Named Rules
**The Two Teams Rule.** Red is Team A and blue is Team B, always as a pair, always in that order (red left or first). Never use either for errors, warnings, brand accent or decoration unrelated to the teams.

**The Money Is Ochre Rule.** Ochre marks money only: prices, paid state, payment handles. The primary CTA is ink precisely because it is not a payment.

**The Flat Ink Rule.** Every colour is a solid field. No gradients, no glass, no glow, no tinted overlays; lower emphasis comes from ink opacity on paper, not from new colours.

## Typography

**Display Font:** Anybody Variable (with system-ui, sans-serif), width axis used condensed
**Body Font:** Schibsted Grotesk Variable (with system-ui, sans-serif)

**Character:** Anybody, squeezed to 70-88% width at 800-900 weight, behaves like cut poster lettering that fills its space; Schibsted Grotesk is a sturdy newspaper grotesque that keeps the facts plain. Both are self-hosted via @fontsource (no Google Fonts CDN, for GDPR) and must cover Latin Extended (ç, ñ, ó, ł, ń appear in names); Cyrillic is not required.

### Hierarchy
- **Wordmark** (900, width 88%, SVG `textLength` fitted to the full column width): FOOTBOLSKI lettered edge to edge at the top of the page. Footer repeat is a small 900-weight caps line.
- **Display** (850, 2.6rem mobile / 4rem sm / 5.5rem lg, line-height 0.92, -0.02em, width 72%): the hero headline, one short sentence per line.
- **Numeral** (900, 5.5rem / 7.5rem / 9rem, line-height 1, -0.03em, tabular, width 70%): a single poster-sized figure such as a price.
- **Headline** (850, 2.4rem / 3.5rem lg, line-height 0.95, width 75%): the one statement heading each poster section; closing headline steps up to 2.9rem / 5rem.
- **Statement** (800, 2rem / 3.75rem md, line-height 1.05, width 78%, max 24ch): a proof sentence set as display type instead of stat tiles.
- **Title** (800-900, 1.25rem to 1.875rem, width 80%): ticket labels, team names.
- **Lead** (400, 18px / 20px lg, line-height 1.625, max 38ch): the hero explanation.
- **Body** (400, 17px, line-height 1.625, max 46-56ch): section copy in ink at 80-85% opacity; quoted reasoning at 19px medium, max 60ch.
- **Label** (500, 13px): sample-data captions ("Sample list") in ink at 70-75%. Position codes in rosters are 14px bold with wide tracking.

### Named Rules
**The Stretch To Fill Rule.** Display type is condensed and heavy so it fills the width like lettering; never set Anybody at its normal width or a light weight.

**The Tabular Facts Rule.** Every count, price and score uses tabular figures so numbers hold still.

**The Borrowed Face Rule.** Roboto appears only inside Google's standard sign-in button, as Google's branding guidelines require. It is not part of this type system.

## Layout

A run of full-width posters, each doing one job, stacked vertically. Content sits in a centred container (max 1280px) with 16px side gutters on mobile and 32px from 640px up. Sections breathe at 80px vertical padding, 112px from 1024px. On desktop, sections use a 12-column grid split roughly 5/7 or 6/6 between the statement and its evidence; on mobile everything stacks, and the CTA ticket is ordered above the explanatory paragraph so it clears the fold within thumb reach.

Colour fields run full-bleed (the ochre money poster, the ink proof poster), while the red/blue team panels sit edge to edge inside the container as two halves. On desktop the hero ball leaves the text column, sits under the wordmark and is cropped by the right edge of the viewport at every width. Layout honours iOS safe-area insets top and bottom. All tap targets are at least 48px, and everything reads at 320px.

## Elevation & Depth

None. The world is flat screenprint: no box shadows, no text shadows, no blur, no layered translucency. Depth and separation come from colour fields meeting at hard edges, solid ink rules (1-2px), and occasional small rotations of cut pieces (-6deg to 3deg) that suggest paper laid on paper without lifting it.

### Named Rules
**The Nothing Floats Rule.** If an element needs separation, give it a different ink field or an ink rule. Never a shadow.

## Shapes

Square corners throughout: posters, fields, tickets, chips and panels have no radius. The exceptions are functional: payment-status dots are full circles, and the Google button keeps Google's own 4px radius. Borders are solid ink: 2px for chips, dots and the footer rule, 1px for list rules. Recurring silhouettes are cut paper: the ticket stub with two 11px half-circle notches bitten from its sides (CSS mask), the training bib as a list spot, and the split ball whose outline is a run of straight scissor snips around a jittered circle.

## Components

### Ticket CTA
Tactile and plain: the primary action is a ticket stub, not a pill.
- **Shape:** square rectangle with two half-circle notches (11px radius) masked out of the left and right edges.
- **Colour:** ink field, paper Title-level label (e.g. "Run your own game"), holding the sign-in button beneath it.
- **Padding:** 16px vertical (20px from 640px), 28px horizontal. Full width on mobile, shrink-wrapped from 640px.
- **Sign-in button inside:** Google's standard light button, unaltered (white, #747775 1px outline, #1F1F1F Roboto Medium 16px, 4px radius, 48px tall, hover #F3F3F3, active #E8E8E8) with Google's four-colour mark. Its colours are Google's and sit outside this palette.

### Text Links
- **Style:** ink, 600 weight, 2px underline offset 0.25em; hover turns the underline Team Red. Always at least 48px tall.
- **Focus:** 3px solid ink outline, 3px offset on paper; paper outline on ink, red or blue fields. This focus treatment applies to every interactive element in the world.

### Payment Handle
- **Style:** a 2px ink-bordered square chip on the ochre field, 600 weight tabular text, method and masked handle divided by a 1px ink rule (e.g. BLIK | 600 ••• 200).

### Team Panels
- **Style:** two edge-to-edge square fields, Team Red then Ultramarine, paper text. Team name at Title size (900, width 80%); roster rows 17px semibold with 1px paper rules at 30% opacity, position codes right-aligned.

### Bibs (list spots)
- **Taken:** solid ink training-bib silhouette with the spot number in paper, Anybody 800, width 80%.
- **Waiting:** paper bib with a 1.6-unit ink outline and ink number, hung loose at a slight tilt beside the full list.

### Payment Dots
- **Style:** full circles with a 2px ink border; paid dots are filled ink, unpaid stay open. Rendered as a single labelled image for assistive tech.

### Sample Caption
- **Style:** Label-size caption in reduced ink. Every name or lineup on a public surface is invented sample data and carries one of these captions next to it.

### Split Ball (signature)
The system's one image. A football drawn as cut paper: jittered straight-snipped outline, pentagonal patches and seams cut out of the fill with an SVG mask (never painted over in paper colour), and a scissor cut running down the top seam that divides a Team Red half from an Ultramarine half. Its resting state is split. On load the halves start joined and slide apart along the cut (1300ms, cubic-bezier(0.16, 1, 0.3, 1), 250ms delay), then settle; under reduced motion, or in the still variant used for repeats, it simply rests split.

### Wordmark
FOOTBOLSKI in Anybody 900 at 88% width, fitted to the full column width with SVG `textLength`, labelled for assistive tech.

## Do's and Don'ts

### Do:
- **Do** set every surface on Poster Paper with ink text, and switch to paper text only on ink, Team Red or Ultramarine fields.
- **Do** keep red and blue as the two teams and ochre as money, so a colour always tells the viewer which team or that money is involved.
- **Do** draw imagery as code SVG cut paper: straight snips, pieces cut out with masks, slight irregularity, no rasters.
- **Do** set display type in Anybody at 800-900 weight and 70-88% width, and facts in Schibsted Grotesk with tabular figures.
- **Do** self-host every font through @fontsource with Latin Extended coverage.
- **Do** label every invented name or lineup on a public surface as sample data.
- **Do** keep tap targets at 48px or more and the 3px ink (or paper) focus outline on every control.
- **Do** make any motion safe under `prefers-reduced-motion` by designing the resting state as the finished state.

### Don't:
- **Don't** use gradients, glass, glow or blur; every field is flat ink.
- **Don't** add box or text shadows, including hard offset shadows; separation comes from fields and ink rules.
- **Don't** use ochre for a CTA, highlight or decoration that is not about money.
- **Don't** use red or blue for errors, warnings or generic accent.
- **Don't** round corners on posters, tickets, chips or panels.
- **Don't** load fonts from the Google Fonts CDN, and don't add Roboto anywhere except inside Google's sign-in button.
- **Don't** bring back the dark pitch ground, neon green accent, Space Grotesk or Inter.
- **Don't** replace a proof sentence with a row of stat tiles, or the hero with a phone mockup and feature tiles.
