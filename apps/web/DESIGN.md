---
name: Tool402
description: Back the tools agents pay to use.
colors:
  ledger-cream: "#faf6ec"
  ink-navy: "#16162a"
  card-white: "#ffffff"
  signature-indigo: "#5b4fe0"
  bright-indigo: "#6a5cf0"
  indigo-wash: "#ece7fa"
  paper-muted: "#f0ebdd"
  paper-edge: "#e7e0cd"
  muted-ink: "#625f76"
  settled-green: "#2fa876"
  success-wash: "#e6f4ec"
  success-ink: "#1c7a4d"
  clay-coral: "#f0724a"
  destructive-wash: "#fdeae4"
  destructive-ink: "#b03a1d"
  coin-yellow: "#f2b93c"
  warning-wash: "#fdf1d8"
  warning-ink: "#a05a12"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.35rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.14em"
  micro:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  tile: "calc(0.85rem * 0.6)"
  field: "calc(0.85rem * 0.75)"
  control: "0.85rem"
  card: "calc(0.85rem * 1.5)"
  panel: "calc(0.85rem * 2)"
  frame: "calc(0.85rem * 2.5)"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2rem"
  xl: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.signature-indigo}"
    textColor: "{colors.card-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.bright-indigo}"
    textColor: "{colors.card-white}"
  button-secondary:
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.ink-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.5rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.5rem"
  button-outline-hover:
    backgroundColor: "{colors.paper-muted}"
    textColor: "{colors.ink-navy}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.5rem"
  cta-pill:
    backgroundColor: "{colors.signature-indigo}"
    textColor: "{colors.card-white}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1.25rem"
    height: "2.75rem"
  badge-default:
    backgroundColor: "{colors.signature-indigo}"
    textColor: "{colors.card-white}"
    typography: "{typography.mono}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.5rem"
  badge-secondary:
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.5rem"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.5rem"
  card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.control}"
    padding: "1.25rem"
  input:
    backgroundColor: "{colors.ledger-cream}"
    textColor: "{colors.ink-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.75rem"
  nav-link-hover:
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.ink-navy}"
---

# Design System: Tool402

## Overview

**Creative North Star: "The Toy Ledger"**

Tool402 is a ledger first and a toy second. The ground is cream paper, the ink is a deep navy, and one indigo signature marks the action a visitor can take. Everything a judge reads on a surface is a factual entry: a route boundary, a testnet notice, an admission outcome. The clay-toy characters (the coin, the cube, the robot) are the only thing on the page that smiles, and they earn that by appearing rarely: one hero composition, one empty-state illustration, never a pattern.

The system is warm, candid, and precise. Warm because the paper is cream rather than white and corners are rounded rather than cut. Candid because status is always spelled out in a tone with an exact meaning, and previews are labelled as previews in the same voice as everything else. Precise because display type is tracked tight, identifiers are set in mono, and every state chip maps to a known outcome. It is deliberately not playful in its chrome: the toys carry the charm so the interface does not have to.

Confirmed anti-references: the dark-mode crypto dashboard (black glass, neon gradients, glow borders), the generic SaaS template (white-on-white, blue-600 buttons, stock illustration, three-column feature grid), and the kids' app (mascots everywhere, bouncy motion, rainbow backgrounds).

**Key Characteristics:**
- Cream paper ground with white cards and a single hairline border colour.
- One action colour (Signature Indigo) plus a four-colour brand quartet used as tints, never as fills.
- System sans for everything, extrabold and tight for display, mono for identifiers.
- Flat by default; the only real shadow is the hero art's indigo glow.
- Pill CTAs and pill chips; panels use a scaled radius from one `--radius` token.
- Status is a bordered tinted row with a fixed label, never a bare colour.

## Colors

A cream ledger with navy ink, one indigo signature, and four toy colours held at tint strength.

### Primary
- **Signature Indigo** (#5b4fe0): the one action colour. Primary buttons, the header CTA pill, focus rings, the highlighted phrase in the hero headline, and the `working` status border. Also the `--ring` token.
- **Bright Indigo** (#6a5cf0): the hover state of every indigo surface and the brand-quartet purple in the logo. Used as a 15% tint behind RiskScan tool icons and as a 24% tint for text selection.
- **Indigo Wash** (#ece7fa): the secondary surface. Secondary buttons, secondary badges, nav-link hover, and the `working` status background.

### Secondary
- **Settled Green** (#2fa876): the brand-quartet green. Appears as a 15% tint behind EntityCheck tool icons and in the favicon. Not a button colour.
- **Clay Coral** (#f0724a): the brand-quartet coral, the robot mascot's body. Favicon and logo only in the current code.
- **Coin Yellow** (#f2b93c): the brand-quartet yellow, the coin mascot. Favicon and logo only in the current code.

### Tertiary (state tones)
- **Success Wash / Success Ink** (#e6f4ec / #1c7a4d): `success` status rows, the "02" step numeral tile.
- **Warning Wash / Warning Ink** (#fdf1d8 / #a05a12): `warning` status rows and the testnet notice bar text.
- **Destructive Wash / Destructive Ink** (#fdeae4 / #b03a1d): `error` status rows, field error text, the "03" step numeral tile, and the error border on invalid inputs.

### Neutral
- **Ledger Cream** (#faf6ec): the page background and input background.
- **Card White** (#ffffff): card, panel, and sheet surfaces; primary button text.
- **Paper Muted** (#f0ebdd): muted surfaces, hover fills for outline and ghost buttons, skeletons, and the neutral status row.
- **Paper Edge** (#e7e0cd): the one border colour, applied globally through `* { border-color }`. Also the dotted-grid dot in the hero at 70%.
- **Ink Navy** (#16162a): all foreground text and the mobile-sheet scrim at 20%.
- **Muted Ink** (#625f76): descriptions, eyebrow labels, nav links at rest, hint text.

### Named Rules
**The One Signature Rule.** Signature Indigo is the only colour allowed on a primary action. The brand quartet appears as 15% tints behind icons or inside brand assets; it never fills a button, a card, or a background.

**The Tone Has a Word Rule.** A state colour never appears without its label. Every tinted status row carries a fixed word (Status, Working, Complete, Attention, Error) in front of the message, so colour is confirmation, not the message.

## Typography

**Display Font:** system sans (`ui-sans-serif, system-ui, sans-serif`)
**Body Font:** same system sans
**Label/Mono Font:** system mono (`ui-monospace, SFMono-Regular, monospace`)

**Character:** A single system sans doing two jobs. At display size it is extrabold and tightly tracked, so headlines read as set type rather than default text. At body size it is regular and calm. Mono is reserved for identifiers, hashes, step numerals, and code, so a judge can see at a glance which strings are machine values. No webfont is committed; this is a current fact, not a pinned constraint.

### Hierarchy
- **Display** (800, `text-4xl` to `4.35rem` on large screens, line-height 1.04 down to 0.86 in the hero, tracking -0.04em to -0.045em): the landing hero and page-header H1s. One per surface.
- **Headline** (800, `text-3xl` to `text-4xl`, `tracking-tight`): section titles on the landing page and doc pages.
- **Title** (600 to 700, `text-lg` to `text-xl`): card titles, state-panel titles, step titles, the mobile sheet heading.
- **Body** (400, `text-sm` at 1.25rem line-height, `text-lg` at 2rem for page-header descriptions): everything read. Descriptions sit in Muted Ink; page-header descriptions are capped at `max-w-3xl`.
- **Label** (600, `text-xs` or `micro` 11px, uppercase, tracking 0.14em to 0.18em): eyebrows, stat labels, overlay chip headings. Muted Ink or Signature Indigo.
- **Mono** (400 to 700, `text-xs` to `text-sm`): transaction ids, Hedera ids, factory identifiers, step numerals "01" through "03".

### Named Rules
**The Machine Value Rule.** Anything an agent or chain would treat as an identifier (route, id, hash, address, numeral) is set in mono. Prose never is.

**The Tight Top Rule.** Negative tracking belongs to display and headline sizes only. Body and label text keep normal or wide tracking.

## Layout

One centred column, `max-w-7xl` (80rem), with 1rem side padding at phone width, 1.5rem from 640px, and 2rem from 1024px. Content starts 2.5rem below the sticky header. Full-bleed landing sections break out with the `left-1/2 w-screen -translate-x-1/2` pattern and carry their own top and bottom borders, so section boundaries are hairlines, not colour blocks.

Two persistent notice bars sit above the header: a warning-toned testnet line and a neutral route-boundary line, each about 1.5rem tall at 11px `micro` type. The header is sticky, 3.5rem tall, cream at 95% with backdrop blur, holding the logo left and navigation right. Desktop navigation is a row of pill links from 1024px; below that it collapses to an Explore pill, a round menu button, and a right-side sheet (`min(22rem, 100vw - 1.5rem)`).

Spacing is Tailwind's 4px scale. Observed rhythm: 1.25rem card padding, 0.75rem to 1.5rem grid gaps, 2.5rem to 3rem between page blocks, 3.5rem to 5.25rem section padding on the landing page. Grids are two columns at 640px and three at 1024px. Reading measure is capped at `max-w-2xl` or `max-w-3xl`. Body enforces `min-width: 20rem` and M29 requires no horizontal overflow at 375×812 and 1440×900.

## Elevation & Depth

Flat by default. Structure is carried by the Paper Edge hairline and by tonal steps (cream page, white card, muted panel, wash tints). Cards ship with `shadow-none` far more often than not, and hover on a card changes its border to 15% ink rather than lifting it.

Shadows exist only for things that genuinely float: the hero art's indigo glow, the two overlay chips on the hero, and the mobile navigation sheet's scrim.

### Shadow Vocabulary
- **Hero glow** (`box-shadow: 0 1.5rem 5rem -1.75rem color-mix(in oklab, var(--brand-purple) 45%, transparent)`): under the hero image frame only.
- **Overlay chip** (Tailwind `shadow-lg` and `shadow-md`): the two floating chips over the hero art, with 95% white and backdrop blur.
- **Resting card** (Tailwind `shadow-sm`): the Card primitive default and the hero CTAs; most call sites override it back to none.

### Named Rules
**The Flat Ledger Rule.** Surfaces are flat at rest. A shadow is permitted only on an element that overlaps another (hero art, floating chip, sheet). A card in a grid never casts one.

## Shapes

Everything derives from one token, `--radius: 0.85rem`. Small links and icon tiles use 0.6× (about 8px), fields and tiles 0.75× (about 10px), buttons and status rows 1× (13.6px), cards 1.5× (about 20px), panels 2× (27px), and the hero image frame 2.5× (34px). Each step is a named utility (`rounded-tile`, `rounded-field`, `rounded-control`, `rounded-card`, `rounded-panel`, `rounded-frame`) declared in `globals.css`; no fixed Tailwind radius step or arbitrary value is used. Actions that are single-line calls to action (header CTA, hero buttons, nav links, badges, chips) are full pills. Step and icon tiles are 0.75× squares. Borders are 1px Paper Edge everywhere, with a dashed variant only for the connector line between the three landing steps. No sharp corners exist in the system; the four-square logo mark sets the silhouette: rounded squares in a tight grid.

## Components

### Buttons
- **Character:** calm and exact. A button states its action in sentence case at 500 to 600 weight; nothing else moves.
- **Shape:** `--radius` (13.6px) for the Button primitive; full pill for CTAs placed in the header, hero, and sheet.
- **Primary:** Signature Indigo fill, white text, hover to Bright Indigo, 2.5rem min height and 1rem side padding at `md`; 2.75rem and 1.25rem at `lg`.
- **Secondary:** Indigo Wash fill, ink text, hover to Paper Muted.
- **Outline:** transparent with Paper Edge border, hover to Paper Muted.
- **Ghost:** transparent, hover to Paper Muted.
- **Focus:** 2px Signature Indigo outline with 2px to 3px offset. Global `:focus-visible` sets the same.
- **Disabled:** 50% opacity, pointer events off.
- **Motion:** `transition-colors` only, disabled under reduced motion.

### Chips
- **Badge:** pill, `text-xs` 500, 0.5rem side padding. Default is indigo fill, secondary is Indigo Wash, outline is transparent with border. Eyebrows use the outline variant above an H1.
- **Meta chips:** the 11px pills on tool cards ("Campaign preview", "Public detail") use cream fill, Paper Edge border, Muted Ink text.

### Cards / Containers
- **Corner Style:** `--radius` on the Card primitive; 1.5× (about 20px) on landing and workspace cards, 2× (27px) on large panels.
- **Background:** Card White on cream; Paper Muted at 40% to 60% for inset detail lists.
- **Shadow Strategy:** none at rest (see Elevation).
- **Border:** 1px Paper Edge; hover shifts to 15% ink. Tool cards on the landing page also lift 2px on hover over 200ms, disabled under reduced motion.
- **Internal Padding:** 1.25rem (`p-5`), 1.5rem on landing step cards. Card sections: header `p-5`, content `px-5 pb-5`, footer `px-5 py-4` with a top border.

### Inputs / Fields
- **Style:** 2.75rem min height, cream background, Paper Edge border, 0.75× radius, `text-sm`, `shadow-none`. Labels are `text-sm` 500 ink; hints `text-sm` Muted Ink at 1.5rem line-height.
- **Focus:** border shifts to Signature Indigo plus the global 2px indigo outline.
- **Error:** border and focus border become Destructive Ink; `aria-invalid` set; message in Destructive Ink below.
- **Textarea:** same style, `min-h-32`, vertical resize.

### Navigation
- **Desktop:** pill links, 12px 600, Muted Ink at rest, Indigo Wash fill and ink text on hover; a Signature Indigo pill CTA ("Prepare a tool") on the right from 1024px. Every control carries the `touch-target` utility, which grows it to a 44px hit area on coarse pointers only.
- **Mobile:** an Explore pill (Indigo Wash, bordered) and a 2.5rem round menu button; the sheet slides from the right on cream with 1.25rem padding, a Tool402 eyebrow, a "Navigate" title, full-width `--radius` link rows at 2.75rem, and the CTA pinned to the bottom. Focus is trapped and Escape closes.

### Status Row (signature component)
A bordered, tinted paragraph at `--radius` with 0.75rem side and 0.5rem vertical padding: a fixed bold tone label followed by the message. Five tones map to fixed outcomes: neutral (Paper Muted), working (Indigo Wash with 30% indigo border), success, warning, error (each wash with its ink text and a 30% ink border). Outcome strings map to tones in one function; unknown outcomes are errors.

### State Panel
A centred bordered white panel at `--radius` with optional mascot illustration, a title, a Muted Ink description, and an optional action. This is where the clay toys are allowed to appear outside the hero.

### Notice Bars
Two stacked full-width lines above the header at 11px, each with a 12px inline stroke icon: the warning-toned testnet notice on Warning Wash, and the neutral route-boundary notice on Paper Muted. These are the candid layer and stay on every route.

## Do's and Don'ts

### Do:
- **Do** use Signature Indigo (#5b4fe0) for exactly one primary action per view and Bright Indigo (#6a5cf0) for its hover.
- **Do** keep the brand quartet (indigo, green, coral, yellow) at 15% tint behind icons or inside the logo and favicon.
- **Do** set every identifier, id, hash, route, and numeral in mono.
- **Do** use the named radius utilities (`rounded-tile` through `rounded-frame`) or a full pill; do not introduce ad-hoc pixel radii.
- **Do** keep cards flat with a Paper Edge border and show hover as a border shift to 15% ink.
- **Do** carry the two notice bars and the testnet banner copy on every route.
- **Do** honour `prefers-reduced-motion`: the global rule already zeroes animation and transition durations.
- **Do** keep a visible 2px Signature Indigo focus outline on every interactive element.
- **Do** cap reading measure at `max-w-2xl` or `max-w-3xl` and keep display type to one H1 per surface.

### Don't:
- **Don't** fill a button, card, or background with green, coral, or yellow; they are tints and brand assets only.
- **Don't** show a state colour without its fixed tone word.
- **Don't** add shadows to grid cards or panels; only overlapping elements may cast one.
- **Don't** place a mascot anywhere except the hero composition or a State Panel illustration.
- **Don't** use dark surfaces, glass, gradients, or glow borders; the page is cream and the cards are white.
- **Don't** use pure white (#ffffff) as a page background; the ground is Ledger Cream.
- **Don't** track body or label text negatively; tight tracking belongs to display and headline only.
- **Don't** replace the system sans with a webfont without recording the change here first.
