# UI-S12 deploy-readiness assets and boundary routes manifest

## Delivery boundary

UI-S12 covers two things a public deployment needs and this repository does not
have yet: a browser icon set, and honest not-found and error boundaries.

The three image files arrive with this manifest because they cannot be authored
from inside the repository. They are inert static files under the existing
local brand directory until the root accepts the route work described below.

The source material for this adaptation remains outside the repository. This
manifest records the local target boundary only; it stores no source
identifier, URL, checksum, or clone information.

## Supplied local assets

- `apps/web/public/brand/icon.svg` — a four-square mark in the accepted purple,
  green, coral, and yellow token colors, for the browser tab
- `apps/web/public/brand/apple-icon.png` — the touch icon of the same mark
- `apps/web/public/brand/mascot-flag.png` — one decorative illustration for the
  not-found boundary, in the same family as the accepted landing illustration

Each supplied file is already at its final display size, stripped of embedded
metadata, and compressed: the touch icon at 180 square, and the illustration at
576 square for a two-times display at its rendered width. No further image
processing step belongs to the implementation.

No other illustration, logo variant, or icon size is selected. An asset that no
accepted route references does not belong to this slice.

## Local targets

The slice must move, not copy,
`apps/web/public/brand/icon.svg` to `apps/web/src/app/icon.svg` and
`apps/web/public/brand/apple-icon.png` to
`apps/web/src/app/apple-icon.png`, so the browser tab and touch icon resolve
without a layout change. It keeps `apps/web/public/brand/mascot-flag.png` at
its public path and renders it only through the not-found boundary.

It may add only `apps/web/src/app/not-found.tsx`,
`apps/web/src/app/error.tsx`, `apps/web/src/app/robots.ts`,
`apps/web/src/components/boundary/not-found-boundary.tsx`,
`apps/web/src/components/boundary/error-boundary.tsx`, and
`apps/web/tests/deploy-readiness.test.mjs`.

It reuses the existing local Card, Button, and semantic Link primitives and the
accepted global tokens. It adds no dependency, icon package, animation package,
or font.

## Required boundary behavior

The not-found route is server-rendered, has exactly one `h1`, states plainly
that the page does not exist, shows the decorative illustration from
`/brand/mascot-flag.png` with an empty `alt`, and offers local links to `/` and
`/explore` only.

`apps/web/src/app/error.tsx` handles errors from child segments rendered
beneath `apps/web/src/app/layout.tsx`; it does not handle an error thrown by
the root layout. It begins with `"use client"`; its default export receives the
framework `error` and `reset` props; and it never renders or passes `error` to a
diagnostic. It states that an unexpected error interrupted the page, exposes
and invokes the framework `reset` action through its retry control, and offers
one local link to `/`. It must not render an error message, stack, or digest to
the viewer, and it makes no diagnostic call.
`apps/web/src/app/global-error.tsx`, nested error boundaries, and test-only
crash routes are out of scope.

The robots route allows crawling and declares no sitemap. A sitemap needs a
deployment origin, and no local contract selects one.

## Truthfulness and authority boundary

No file in this slice may read an environment variable, embed a deployment
origin, hostname, or preview URL, fetch, store, or start a timer.

The boundary copy must not claim that funds, payments, evidence, receipts, or
transactions were unaffected, because this repository holds no such durable
state to reason about. It must not reference a backing, portfolio, funding, or
ATS surface under the recorded HI-001 CUT, a sign-in, onboarding, verification,
or provider surface with no accepted Sign/session contract, or an evidence,
activity, or issue read surface with no accepted privacy contract.

The slice grants no configuration, identity, payment, deployment, or submission
authority. Publishing the site remains a human action.

## Acceptance evidence

- `apps/web/tests/deploy-readiness.test.mjs` is the durable RED contract and
  precedes all of the new/moved runtime paths. It asserts all final metadata
  paths exist, the two public icon sources are absent, and the mascot remains
  only at `/brand/mascot-flag.png` through the not-found boundary.
- Focused contracts cover exactly one server-only not-found `h1` and link set
  `['/', '/explore']`; a `"use client"` child-route error entrypoint receiving
  `error` and `reset`, whose retry control invokes `reset`, with link set
  `['/']` and no rendered/passed error message, stack, or digest; robots
  allowing `*` with no sitemap; and no environment read, origin string, fetch,
  storage, timer, or excluded copy in every owned source.
- Desktop and narrow browser checks cover rendering of both boundaries, local
  navigation, visible keyboard focus, honored reduced-motion preference, no
  horizontal overflow, and clean framework and browser diagnostics.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
