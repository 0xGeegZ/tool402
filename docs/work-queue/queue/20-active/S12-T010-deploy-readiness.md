# S12-T010 — Deploy-readiness assets and boundary routes

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T020 accepted, M02-T040 accepted, M11-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  only `apps/web/src/app/icon.svg`, `apps/web/src/app/apple-icon.png`,
  `apps/web/src/app/not-found.tsx`, `apps/web/src/app/error.tsx`,
  `apps/web/src/app/robots.ts`,
  `apps/web/src/components/boundary/not-found-boundary.tsx`,
  `apps/web/src/components/boundary/error-boundary.tsx`, and
  `apps/web/tests/deploy-readiness.test.mjs`. The two source icon paths under
  `apps/web/public/brand/` are move-only inputs and must be absent afterwards;
  `apps/web/public/brand/mascot-flag.png` remains the exact public asset.
- Human actions: none granted by this card. It reduces the gap named by
  HA-PUBLIC-DEPLOY-001; publication itself remains human-owned.

## Scope

The repository currently ships no browser icon and no not-found or error
boundary. A visitor who mistypes a path, or hits a runtime error, sees the
framework default.

This card adds an honest not-found page, a child-route error boundary, and a
robots route, using three image files that arrive with the slice because they
cannot be authored from inside the repository.

The local contract is the [UI-S12 deploy-readiness manifest](../../../ui/UI-S12.md).
The accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Supplied material

Three inert static files are already present under
`apps/web/public/brand/`: `icon.svg`, `apple-icon.png`, and `mascot-flag.png`.
Acceptance moves (not copies) the first two to their exact App Router metadata
paths and retains the mascot only through the accepted not-found boundary. If
the card is rejected, no implementation consumes them.

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any route change.
- The declared paths are disjoint from every active card.
- The copy boundary is fixed in the manifest before code, so no boundary page
  can claim anything about funds, payments, evidence, receipts, or transactions.

## Verification

- `apps/web/tests/deploy-readiness.test.mjs` is the durable RED contract and
  precedes every new route, component, or asset move. It fails because the
  declared boundary routes, components, and final icon paths do not exist.
- Focused tests prove server-only not-found semantics with exactly one `h1` and
  hrefs `/` and `/explore`; a `"use client"` child-route error entrypoint
  receiving `error` and `reset`, whose retry control invokes `reset`, with href
  `/` and no rendered/passed message, stack, or digest; the empty mascot `alt`;
  final icon paths with removed public originals; and a crawl-allowing robots
  route with no sitemap.
- The same focused test proves every owned source has no environment read,
  embedded origin, fetch, storage, timer, or excluded-domain copy.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Desktop and narrow browser checks cover both boundaries, local navigation,
  keyboard focus, reduced motion, no horizontal overflow, and clean
  diagnostics.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card adds presentation boundaries and static assets only. It claims no
domain state, identity, provider, evidence-read, live-status, payment,
deployment, or submission authority.

A sitemap route is deliberately out of scope: it requires a deployment origin,
and no local contract selects one. It stays a named follow-up rather than a
silent omission.

## Activation

Activated at 2026-09-08T14:01:24Z after a fresh root rescan at pushed
`e2c3b3beefb637a9c06074ab90837c4658249cb4`. Every declared dependency remains
accepted, the shared branch is clean and current, the local guard is enabled,
and B03-T010 owns only disjoint Agent paths. This activation authorizes only
the declared durable RED file; no source, asset move, deployment, or external
action is authorized until the RED review is accepted.

## Durable RED acceptance

At `2026-09-08T14:36:34Z`, an independent review accepted the declared RED
contract. Under Node 22.21.1 it fails only because the seven declared final
metadata, route, and boundary paths do not yet exist. It introduces no route,
component, asset move, deployment, or external behavior.

The root may now authorize only the declared S12 GREEN paths after recording
this acceptance. Publication and every external action remain human-owned.
