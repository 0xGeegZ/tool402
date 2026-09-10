# S17-T010 implementation plan — provider campaign status route

Execute [S17-T010](../../work-queue/queue/60-done/S17-T010-provider-status-route.md)
against the committed [UI-S17 manifest](../../ui/UI-S17.md) and accepted
M40/M41 projections. The route is a truthful read-only status surface; it
never signs, writes, reads a chain, invokes a provider, or turns an absent
record into a value.

## Boundaries

The durable RED phase may create only
`apps/web/tests/provider-status.test.mjs` and
`apps/web/tests/offerings-api.test.mjs`, and may amend only the frozen
navigation-list assertions in the three files named on the card. The nine
guided-demo steps, links, and every non-navigation assertion remain unchanged.
`shell-accessibility.test.mjs`, the navigation source, all route/component
source, package, lockfile, environment reads, and external behavior remain
prohibited until a fresh independent RED review is clear.

## RED contract

1. Define test fixtures for the two independent closed outcomes:
   `not_configured`, `absent`, `loaded`, `unavailable`, and
   `unexpected_response`. Prove a failed directory outcome never alters the
   offering outcome.
2. Contract the server reader's absent environment branch: no request occurs;
   the fixed public-id grammar is checked before URL construction; both reads
   are independently timeout- and size-bounded; invalid upstream data is
   `unexpected_response` rather than partial data.
3. Contract `/api/offerings`: `no-store`, both outcome fields, invalid
   public-id refusal, and no upstream reason/status/body/header/URL leakage.
4. Contract fixed status rendering: region order, exact next-action mapping,
   four evidence rows with `not recorded`, strictly gated Hashscan link, and
   absence of non-adopted figures or liveness claims.
5. Amend only the frozen navigation lists to add `/provider`; preserve the
   guided-demo's nine steps and all other assertions.

The RED suite must fail only for the absent declared S17 implementation paths.

## GREEN sequence

1. Add a server-only bounded projection reader with closed parse results and
   no ambient request-host derivation.
2. Add the read-only API route that serialises only the two outcomes.
3. Add a closed state formatter and server-rendered provider status component.
4. Add the server page with a single main landmark, synchronous heading/links,
   one Suspense boundary for the projection regions, and fixed region order.
5. Add the sole navigation source entry under the root reservation. Never
   change the shell accessibility assertion.

## Verification

Run focused S17 and navigation tests, then the full Web suite/typecheck/build,
root quality, queue/reference/whitespace/local guard, and browser checks with
the Convex site URL absent. Review the diff for the declared surface only, then
obtain independent task and two fresh module reviews before acceptance.

## Responsive correction sequence

The original S17 browser check discovered that the fifth `Provider` entry makes
the existing shared navigation list overflow at 390px. Before any source change,
amend only the existing `workspace-shell.test.mjs` navigation assertion to
require the exact `flex flex-wrap items-center gap-1 text-sm font-medium`
literal while preserving its exact five-link list and rejecting an overflow mask
or minimum-width escape. After fresh independent RED acceptance, insert only
the bare `flex-wrap` token after `flex` in the existing `local-navigation.tsx`
list literal. Do not add, remove, reorder, or condition any other token or
attribute; do not touch the root layout, global CSS, landmarks, focus seams,
link labels/order, runtime behavior, or external boundaries. Re-run the
unconfigured `/provider` browser check at 390px and obtain fresh final reviews
before acceptance.

The committed test-only RED contract at `c1953f4e0de02b0435f5a7d209278254d37c2bf3`
is independently clear in
[`S17-T010-responsive-red-review`](../../work-queue/evidence/S17-T010-responsive-red-review.md).
Only the one approved source-token insertion may proceed.
