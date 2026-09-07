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

No other illustration, logo variant, or icon size is selected. An asset that no
accepted route references does not belong to this slice.

## Local targets

The slice may relocate `icon.svg` and `apple-icon.png` to the framework app-icon
convention paths under `apps/web/src/app/`, so the browser tab and touch icon
resolve without a layout change.

It may add `apps/web/src/app/not-found.tsx`, `apps/web/src/app/error.tsx`,
`apps/web/src/app/robots.ts`, presentational components under
`apps/web/src/components/boundary/`, and their focused tests.

It reuses the existing local Card, Button, and semantic Link primitives and the
accepted global tokens. It adds no dependency, icon package, animation package,
or font.

## Required boundary behavior

The not-found route is server-rendered, has one `h1`, states plainly that the
page does not exist, shows the decorative illustration with an empty `alt`, and
offers local links to `/` and `/explore` only.

The error route is the framework error boundary and is therefore the one client
component in this slice. It states that an unexpected error interrupted the
page and offers the framework reset action and one local link to `/`. It must
not render an error message, stack, or digest to the viewer, and any diagnostic
call it makes must carry no caller-supplied content and no tool or generator
marker string.

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

- Focused source contracts cover the not-found and error shapes, the local link
  targets, the empty decorative `alt`, the absence of any environment read,
  origin string, fetch, storage, or timer, and the exclusion boundary above.
- A focused assertion proves the icon files resolve at their final paths and
  that every supplied asset is referenced by an accepted route.
- Desktop and narrow browser checks cover rendering of both boundaries, local
  navigation, visible keyboard focus, honored reduced-motion preference, no
  horizontal overflow, and clean framework and browser diagnostics.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
