# S12-T010 — Deploy-readiness assets and boundary routes

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: M02-T020 accepted, M02-T040 accepted, M11-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  only `apps/web/src/app/not-found.tsx`, `apps/web/src/app/error.tsx`,
  `apps/web/src/app/robots.ts`, files under
  `apps/web/src/components/boundary/`, their focused tests, and the relocation
  of the two supplied icon files to the framework app-icon convention paths.
- Human actions: none granted by this card. It reduces the gap named by
  HA-PUBLIC-DEPLOY-001; publication itself remains human-owned.

## Scope

The repository currently ships no browser icon and no not-found or error
boundary. A visitor who mistypes a path, or hits a runtime error, sees the
framework default.

This card adds an honest not-found page, an honest error boundary, and a robots
route, using three image files that arrive with the slice because they cannot
be authored from inside the repository.

The local contract is the [UI-S12 deploy-readiness manifest](../../../ui/UI-S12.md).
The accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Supplied material

Three inert static files are already present under
`apps/web/public/brand/`: `icon.svg`, `apple-icon.png`, and `mascot-flag.png`.
They are referenced by no route yet. The root decides whether to accept them
with this card; if the card is rejected, they should be removed rather than
left unreferenced.

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any route change.
- The declared paths are disjoint from every active card.
- The copy boundary is fixed in the manifest before code, so no boundary page
  can claim anything about funds, payments, evidence, receipts, or transactions.

## Verification

- A durable RED test precedes the source change and fails because the boundary
  routes do not exist.
- Focused tests prove the not-found and error shapes, the exact local link set,
  the empty decorative `alt`, and the absence of any environment read, embedded
  origin, fetch, storage, or timer.
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
