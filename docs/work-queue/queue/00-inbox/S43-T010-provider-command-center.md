# S43-T010 — Provider command center visual redesign

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S17-T010 and S25-T010 accepted.
- Raised by: human operator, 2026-09-12. The request is to restyle the existing loaded `/provider` campaign status route after the supplied command-center reference.
- Owner: root integrator. The root owns this card, its specification, review records, implementation, validation, and integration decision.
- Human actions: none. The slice introduces no wallet, account, command, signature, transaction, deployment, or external action.

## Scope

Recompose the existing server-rendered loaded campaign view into a command center that makes campaign readiness, evidence, current terms, and trust details scannable. It may use the existing admitted projections and routes only. It does not change their reader, schemas, outcome unions, source calls, or content boundary.

The local specification is [`s43-provider-command-center`](../../../specs/s43-provider-command-center.md) and the UI contract is [`UI-S43`](../../../ui/UI-S43.md). The future source paths are limited to `apps/web/src/app/provider/page.tsx`, `apps/web/src/components/provider/status/provider-status.tsx`, `apps/web/src/components/provider/status/provider-status-state.ts`, and `apps/web/tests/provider-status.test.mjs`.

## Candidate delivery gate

Before production source changes, commit the specification, UI contract, task catalogue, state, and ownership records; add a focused test that fails because the existing loaded view lacks the declared command-center regions; obtain an independent RED review; then make the minimum presentational GREEN change.

## Boundary

The page continues to render the current admitted projection as-is. Its existing `/provider/deploy`, `/explore/riskscan`, documentation, and Hashscan links retain their destinations. It may not create synthetic campaign values, claim an unavailable action occurred, use a wallet/provider, fetch a new resource, add state or timers, or change an API, package, configuration, backend, deployment, or financial path.
