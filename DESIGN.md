# DESIGN.md

The Footbolski design system. Every value here is **read out of the code**, not invented —
`frontend/tailwind.config.ts`, `frontend/src/index.css`, and `frontend/src/components/ui/`
are the source of truth. If this file and the code disagree, the code wins and this file
is stale.

Footbolski is a **mobile-first PWA for a private football group**. It is an app UI, not a
marketing site: utility language, calm surfaces, one accent. Nothing here is decorative.

---

## Foundations

### Color

A dark pitch theme. One accent, used sparingly enough that it still means something.

| Token | Hex | Used for |
|---|---|---|
| `pitch-950` | `#0A1A0F` | page ground (`html` background) |
| `pitch-900` | `#111D14` | raised panels |
| `pitch-800` | `#17291C` | `Select` background |
| `pitch-700` | `#213625` | reserved |
| `pitch-500` | `#2C8B49` | reserved (deeper accent) |
| `pitch-400` | `#3DDB6A` | **the accent** — primary buttons, active nav, focus, success |

Neutrals are white at an alpha, never a grey hex:

| Alpha | Role |
|---|---|
| `text-white` | primary headings and answers |
| `text-white/80` | body text on a surface |
| `text-white/70` | field labels |
| `text-white/55` | secondary and inactive |
| `bg-white/10` … `/[0.06]` | borders, fills, skeletons |

Semantic tones live in `Notice` and are separate from the accent:
`info` sky-300, `error` red-400, `success` `pitch-400`.

**Rules**
- `pitch-400` on `pitch-950` is the only accent pairing. Do not introduce a second hue.
- Body text never goes below `text-white/55`. Below that it fails 4.5:1.
- **Never dim a text-bearing element with `opacity`** to show state — it silently takes
  labels under the contrast floor. Change border and background instead.

### Type

Two faces, both loaded from Google Fonts in `index.css`.

| Role | Family | Weights |
|---|---|---|
| Display — headings, answers, numbers that matter | **Space Grotesk** (`font-display`) | 600, 700 |
| Body — everything else | **Inter** (`font-body`, the `body` default) | 400–800 |

Observed scale: `text-3xl` page titles, `text-2xl` empty-state titles, `text-xl` section
headings, `text-base` inputs, `text-sm` body, `text-xs` labels and metadata.

**Rules**
- Headings use `font-display`. Body, names and data use Inter.
- **Space Grotesk carries no Cyrillic glyphs.** Never put a player name in `font-display`
  or Ukrainian names silently fall back to a system font.
- Uppercase micro-labels get `tracking-wide` and `font-bold` at `text-xs`.
- Inputs are `text-base` (16px) — anything smaller triggers iOS zoom-on-focus.

### Shape and depth

| Token | Value | Used for |
|---|---|---|
| `rounded-md` | 6px | nav items, small chips |
| `rounded-lg` | 8px | buttons, inputs, cards, sections — **the default** |
| `rounded-xl` | 12px | player photo cards |
| `rounded-full` | — | avatars, numbered step badges, remind pill |
| `shadow-glow` | green ring + 20px drop | reserve for a single focal element per screen |

Radius is **differential on purpose**. Do not flatten everything to one value.

### `.surface`

Defined in `index.css`, the standard raised panel:

```css
border: 1px solid rgba(255, 255, 255, 0.1);
background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035));
box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
```

**A card must earn its existence.** `.surface` marks a genuinely separate region or a thing
you interact with. Four stacked surfaces on one screen means four equally-loud boxes and no
hierarchy — use type scale and a hairline rule instead. On a single-purpose screen, expect
**one** card at most.

### Page atmosphere

`body` carries a fixed three-layer background: a radial `pitch-400` glow at 20% 0%, a
26px diagonal hatch at 3.5% white, and a vertical gradient. Any full-page layout inherits
brand atmosphere for free — do not paint over it with a flat fill.

---

## Layout

- **Mobile-first, 320px is the design target.** Not 375px. Long Polish surnames and
  "Centrum Sportu Parkowa" must wrap, not `truncate`.
- Content column is `mx-auto max-w-lg px-4` — 512px, centred on larger screens.
- Page root carries `overflow-x-hidden`. The body must never scroll sideways.
- Bottom padding clears the fixed nav: `pb-[calc(7rem+env(safe-area-inset-bottom))]`.
- Safe areas are respected via `env(safe-area-inset-*)`. `TopBar` owns the notch; banners
  sit **below** it.

### Shell vs. bare

`AppShell` wraps the main app: `TopBar` → `InstallBanner` → `NotificationPrompt` → content
→ `BottomNav`.

**Deep links arriving from a messaging app must NOT use `AppShell`.** They open in an
in-app browser where the install banner is an unsatisfiable demand sitting above the
content the user actually came for. Such routes are siblings of `AppShell` in `main.tsx`
and use the bare `LinkLayout`.

---

## Components

Primitives live in `components/ui/`, domain components in `components/features/`,
structure in `components/layout/`.

| Component | Notes |
|---|---|
| `Button` | `primary` / `secondary` / `ghost` / `danger`. `tap-target`, `active:scale-[0.97]` |
| `Field` + `Input` + `Select` | Label above the control, always visible. No placeholder-as-label |
| `Notice` | `info` / `error` / `success` with a leading icon |
| `EmptyState` | Title, optional detail, optional action. The only centred component |
| `PageHeader` | Optional accent eyebrow, `h1`, optional right-side action |
| `Skeleton` | Plus `EventCardSkeleton`, `PlayerGridSkeleton` — shaped like the real thing |
| `Modal` | — |
| `PaymentHandle` | Copyable chip; stops propagation so it works inside a `<Link>` |

**Not present in this codebase:** there is **no checkbox and no radio input** anywhere.
`Field` exports only `Input` and `Select`. Any consent or selection affordance must add
the primitive first.

---

## Interaction

- **`.tap-target` is `min-height/width: 48px`** — above the 44px floor. Every interactive
  element gets it.
- Every screen specifies loading, empty, error, success and partial. A skeleton is shaped
  like the content it replaces, never a generic spinner.
- Empty states are features: warmth, context, and a primary action. "No items found." is
  not a design.
- Single-choice lists use `role="radiogroup"` with `role="radio"` and `aria-checked` per
  option — not a pile of unrelated buttons.
- Async results that swap in place get `aria-live="polite"`.
- Motion is minimal and functional: the button press scale, and skeleton `animate-pulse`.
  Add motion only where it clarifies that something happened.

---

## Copy

Utility language. Orientation, status, action — not mood or aspiration.

- The app is **English-only by design**, for foreigners living in Poland. Outbound messages
  are multilingual; screens are not.
- A control says what happens. "Remind", then the reminder is sent.
- Errors say what went wrong and what to do about it.
- Dates render as `09-July-2026`. Addresses show the street line, not the facility name
  repeated.

---

## Things we deliberately do not do

- No second accent hue, no gradients as decoration.
- No purple/indigo anything.
- No colored left-border cards.
- No emoji as design elements.
- No centred layouts outside `EmptyState`.
- No card grid where the card is not itself the interaction.
- No hover-dependent affordances — there is no cursor on a phone.
- No phone numbers and no player `tier` in any client response or UI, ever.

---

*Derived from the codebase during `/plan-design-review`, 18 July 2026.*
