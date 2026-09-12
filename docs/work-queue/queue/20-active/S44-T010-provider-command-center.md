# S44-T010 — Provider command center visual redesign

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: S17-T010 and S25-T010 accepted.
- Raised by: human operator, 2026-09-12. The request is to restyle the existing loaded `/provider` campaign status route after the supplied command-center reference.
- Owner: root integrator. The root owns this card, its specification, review records, implementation, validation, and integration decision.
- Human actions: none. The slice introduces no wallet, account, command, signature, transaction, deployment, or external action.

## Scope

Recompose the existing server-rendered loaded campaign view into a command center that makes campaign readiness, evidence, current terms, and trust details scannable. It may use the existing admitted projections and routes only. It does not change their reader, schemas, outcome unions, source calls, or content boundary.

The local specification is [`s44-provider-command-center`](../../../specs/s44-provider-command-center.md) and the UI contract is [`UI-S44`](../../../ui/UI-S44.md). The future source paths are limited to `apps/web/src/app/provider/page.tsx`, `apps/web/src/components/provider/status/provider-status.tsx`, `apps/web/src/components/provider/status/provider-status-state.ts`, `apps/web/public/brand/provider-campaign-duo.png`, `apps/web/tests/provider-status.test.mjs`, `apps/web/tests/provider-visual-reconciliation.test.mjs`, and the Provider-only target assertions in `apps/web/tests/page-header.test.mjs`.

## Ready and RED activation

The local specification, UI manifest, task catalogue, state, ownership, and ledger records are committed at `f55dec52426d96f4c1b01f852ed422d14e09c5d5`. The focused Web baseline passes 431 tests with one separately blocked skip under Node 22.21.1. Independent readiness review found no remaining finding.

The repository owner explicitly requested implementation through the current isolated worktree. S43 is activated only for a durable RED amendment to `apps/web/tests/provider-status.test.mjs`: it must fail because the existing loaded view lacks the declared command-center regions. Production source stays prohibited until an independent RED review accepts that expected failure.

## RED acceptance and GREEN boundary

At `a8e9edd8dca707c25ccf46dd0d0ba11f5cbfe92f`, the focused Node 22.21.1
contract has ten passes and one intended presentation failure for the absent
`provider-command-center` marker. Independent review confirmed the contract
covers all five offering states against both independent Directory outcomes,
the existing `CLOSED` no-control case, and the no-runtime boundary.

Only `apps/web/src/app/provider/page.tsx`,
`apps/web/src/components/provider/status/provider-status.tsx`,
`apps/web/src/components/provider/status/provider-status-state.ts`, the
generated `apps/web/public/brand/provider-campaign-duo.png` illustration, and
the focused test may now change for minimal GREEN. Every reader, API, shell,
wallet/provider, command, transaction, deployment, and live path remains
outside the scope.

The GREEN full-suite run exposed two superseded S25/S28 assertions that still
require the removed generic Provider header and the former report hierarchy.
S44 therefore reserves only the Provider assertions in
`apps/web/tests/page-header.test.mjs` and the Provider-only
`apps/web/tests/provider-visual-reconciliation.test.mjs` contract for
reconciliation with this already-specified single-hero composition. No other
route or shared-header contract may change.

## Boundary

The page continues to render the current admitted projection as-is. Its existing `/provider/deploy`, `/explore/riskscan`, documentation, and Hashscan links retain their destinations. It may not create synthetic campaign values, claim an unavailable action occurred, use a wallet/provider, fetch a new resource, add state or timers, or change an API, package, configuration, backend, deployment, or financial path.
