# UI-S33 Explore catalogue visual reconciliation manifest

## Purpose

UI-S33 is a presentation-only reconciliation of the existing /explore
catalogue with the selected PREP-UI-001 Explore composition. It preserves the
two real local listings, RiskScan and EntityCheck, plus the intentionally
quiet future-tool tile. It does not import the prepared prototype's mock
listings, filtering behavior, prices, funding, metrics, or provider claims.

## Local targets

The slice may amend only:

- apps/web/src/app/explore/page.tsx;
- apps/web/src/components/discovery/explore-catalog.tsx;
- apps/web/src/components/discovery/riskscan-discovery-card.tsx;
- apps/web/src/components/discovery/entitycheck-discovery-card.tsx;
- apps/web/tests/explore-catalog.test.mjs; and
- one new apps/web/tests/explore-visual-reconciliation.test.mjs.

The existing card hrefs stay /explore/riskscan and /explore/entitycheck. The
directory island, route behavior, navigation, shared layout, global CSS,
API/data, payment, wallet, provider, transaction, deployment, and live
boundaries are excluded.

## Visual and copy contract

The route has a calm muted Explore introduction, a concise local/testnet
boundary label, one clear title and supporting sentence, then a compact
catalogue control band that is static text rather than faux controls. At wide
widths the three tiles form a balanced grid; at narrow widths they stack.

RiskScan and EntityCheck use the same short, evenly spaced catalogue-card
anatomy: coloured icon tile, current-status label, category, concise
description, quiet route/boundary row, and the existing local detail link.
The third tile remains an explicit quiet placeholder and does not mimic a
listing or claim a forthcoming date.

Only these product facts may be rendered:

- two current local tools: RiskScan and EntityCheck;
- their existing categories, descriptive-only status, and local hrefs;
- new tools are added only after their journey is accepted; and
- current Hedera testnet/local-boundary wording already accepted by the shell.

The Explore introduction may describe a clear local route to inspect each
tool. It must not describe any tool as machine-payable or imply an available
payment capability.

## Explicit exclusions

Do not add a searchable input, stateful filter, toggle, sort, form, mock
listing, provider identity, price, revenue, funding/progress figure, account,
wallet, payment state, activity, testimonial, external link, client
component, fetch, storage, analytics, asset, dependency, new route, or live
availability claim.

## Acceptance evidence

- A durable test-only RED commit precedes source changes.
- Focused tests prove the exact two tool records and hrefs, the noninteractive
  catalogue band, reference-shaped introduction/card regions, one quiet third
  tile, no client or interactive element, and no prohibited claim.
- Desktop and 390px browser captures compare the local route with the selected
  reference: no horizontal overflow, intentional heading wrap, readable cards,
  visible keyboard focus, and no elevated card shadows.
- Focused Web tests, Web/root typecheck and test, lint, queue/reference/
  whitespace checks, and independent task/module review are clear before
  acceptance.

## Module-review correction

The S33 module review blocks the merged source on one copy claim and one
missing static-boundary proof. The corrective cycle may amend only the Explore
supporting sentence, `explore-visual-reconciliation.test.mjs`, and the exact
matching supporting-sentence assertion in `landing-explore.test.mjs`: replace
the machine-payment claim with local-route-only copy, and guard every S33
presentation source against client directives, hooks, fetches, handlers,
controls, interactive ARIA state, external URLs, and the prohibited claims.
No other source path, behavior, or product fact is reopened.

## Corrective acceptance

At `25d8b4e`, the correction replaces only the unsupported payment phrase with
the accepted local-route sentence. Its four-source static contract, local
routes, two matching assertions, and quiet placeholder remain unchanged.
