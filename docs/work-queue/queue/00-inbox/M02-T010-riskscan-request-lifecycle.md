# M02-T010 — RiskScan request lifecycle contract

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T020 accepted
- Integration evidence: D-M01-FOUND-001 accepted
- Owner: implementation lane owns `packages/core/src/risk-scan.ts`, `packages/core/src/index.ts`, `packages/core/test/risk-scan.test.mjs`, and the local specification; root owns this card and queue records.
- Human actions: none

## Scope

Define the smallest pure-core RiskScan request lifecycle. The contract accepts a bounded opaque subject reference and bounded request context, returns explicit lifecycle states, and requires payment/result/evidence correlations before a completed state is possible. It must not create an adapter, endpoint, database, payment SDK, settlement flow, credential, external call, or live evidence claim.

## Validation

- Commit a local implementation specification before behavior.
- RED/GREEN tests reject blank or oversized input and require `payment_required` for a valid new request.
- Pending, failed, and assessment-failed states expose no completed result.
- A completed state requires structured reasons, declared limitations, and result, payment, and evidence correlations.
- `npm run typecheck --workspace @tool402/core`
- `npm run test --workspace @tool402/core`
- `npm run lint --workspace @tool402/core`

## Completion transition

Move to 10-ready only after the minimum local specification, owned-path preflight, and concrete commands are committed. Later payment, persistence, API, and UI-detail work are separate cards.
