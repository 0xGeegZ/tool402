# M02-T050 — RiskScan Quick

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M02-T010 accepted
- Integration evidence: D-M02-010-002 accepted
- Owner: implementation lane owns `packages/core/src/risk-scan-quick.ts`, `packages/core/src/index.ts`, and `packages/core/test/risk-scan-quick.test.mjs`; the root owns this card and queue records.
- Human actions: none

## Scope

Implement a pure, deterministic assessment of caller-reported disclosure declarations for a validated RiskScan request. It may identify exactly which declarations are missing and must state that it does not verify a service, payment, or evidence record. It must not assign a risk score, fetch a subject, create an API route, persist data, call a protocol, perform settlement, or claim live availability.

The local contract is [M02 RiskScan Quick contract](../../../specs/m02-riskscan-quick.md). The implementation plan is [RiskScan Quick plan](../../../superpowers/plans/2026-09-04-m02-riskscan-quick.md).

## Validation

- Commit the local Quick specification before behavior.
- RED/GREEN tests cover malformed declarations, stable reasons, both dispositions, and the limitation boundary.
- `npm run typecheck --workspace @tool402/core`
- `npm run test --workspace @tool402/core`
- `npm run lint --workspace @tool402/core`

## Completion transition

Activated at 2026-09-04T22:26:58Z after the local contract, plan, dependency, and owned-path preflight. Accepted at 2026-09-04T22:42:18Z after focused RED/GREEN coverage, core typecheck/test/lint, the local-reference guard, and two fresh clean review generations. Backend execution, paid HTTP handling, settlement, and UI detail remain separate work.
