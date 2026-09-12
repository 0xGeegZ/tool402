# S45 brand mascot surfaces

## Purpose

Extend the existing Tool402 mascot identity to five already-accepted product
surfaces without changing their data, authority, navigation, or transaction
contracts.

## Assets

S45 adds five repository-owned PNG illustrations under
`apps/web/public/brand/`:

- `demo-guide-trio.png`: the purple cube, gold coin, and coral robot guiding
  the recording journey;
- `explore-publish-trio.png`: the trio placing a new tool card into the
  catalogue;
- `deploy-review-trio.png`: the trio reviewing a prepared document;
- `route-loader-trio.png`: a compact progress composition for delayed route
  loading feedback;
- `dashboard-empty-mascot.png`: the seated purple mascot accompanying the
  existing signed-dashboard empty state.

Each image uses the accepted warm cream, purple, gold, coral, and green Tool402
character language. The Explore and deploy document props may contain only the
exact Tool402 brand lockup; images contain no other labels, numbers, status,
campaign data, or action claims. Every image is decorative and rendered with
an empty alternative text; adjacent HTML owns all meaning and controls.

## Surface composition

### Guided demo

The `/demo` header becomes a responsive two-column hero. Existing title, copy,
tour notice, links, step ordering, and route targets stay unchanged. The new
illustration occupies the companion column and collapses beneath the copy on
narrow screens.

### Explore

After the existing two real tool cards and quiet future-tool tile,
`ExploreCatalog` renders one provider CTA. Its HTML copy invites a provider to
prepare a tool and its sole control links to `/provider/deploy`. The catalogue
array, count, card routes, and static no-fetch boundary remain unchanged.

### Provider deploy review

The deploy illustration appears only inside the existing `ReviewStep`, so it
is absent from steps one through four. It decorates the prepared-details
region and cannot read, replace, or freeze any dynamic form value. All wallet,
signing, resume, configuration, and stage behavior remains byte-for-byte
outside this presentation amendment.

### Dashboard empty state

The existing signed-dashboard empty card replaces its generic document icon
with one seated purple mascot. Existing ownership filtering, empty-state copy,
links, session gate, and campaign behavior remain unchanged.

### Route loading

A shared `BrandRouteLoader` is mounted before the existing skeleton regions in
the eight non-Dashboard accepted route loading files plus a root loading
fallback for routes without a nested loader. The component exposes immediate
screen-reader loading copy but delays only its visible compact mascot card by
300 milliseconds. If the route resolves sooner, cleanup cancels the timer and
the card never appears. `/dashboard` intentionally renders no mascot cue: its
four existing skeleton regions remain in the same order and each occupies the
available route width.

## Accessibility and responsive rules

- Generated images use `next/image`, empty alternative text, and
  `aria-hidden="true"` containers.
- The dashboard empty card remains understandable without its mascot.
- The Explore CTA remains understandable without the illustration.
- The loader has one polite status label and its animated dots disable motion
  under `prefers-reduced-motion`.
- Illustrations never create horizontal overflow and do not dominate the
  mobile reading order.

## Exclusions

S45 adds no tool, catalogue state, pricing, offering value, loader result,
wallet/provider call, request, API, environment read, persistence, command,
signature, payment, transaction, deployment, or live claim. It changes no
shared shell, global token, dependency, backend, Convex, Agent, or Core path.
