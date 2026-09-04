# M02-T030 — RiskScan backend projection

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T030 accepted; M02-T010 accepted
- Integration evidence: D-M01-FOUND-001 and D-M02-010-002 accepted
- Owner: implementation lane owns `packages/backend/src/risk-scan-projection.ts`, `packages/backend/src/index.ts`, and `packages/backend/tests/risk-scan-projection.test.mjs`; the root owns package metadata, the lockfile, this card, and queue records.
- Human actions: none

## Scope

Define a small pure backend projection from the accepted local RiskScan lifecycle into a serializable read model. It must preserve only the state-specific fields that the source state carries, avoid inventing a result, payment, receipt, evidence, or live service claim, and avoid every database, Convex function, endpoint, deployment, network, credential, and payment action.

## Validation

- Commit the minimum local projection specification before behavior.
- RED/GREEN tests cover every lifecycle state and prove non-completed projections expose no completed artifacts.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`

## Completion transition

Move to 10-ready only after the minimum local specification, owned-path preflight, and concrete commands are committed. Persistence, public backend functions, payment verification, and live evidence remain separate work.
