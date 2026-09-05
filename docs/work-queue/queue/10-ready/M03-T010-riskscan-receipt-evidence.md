# M03-T010 — RiskScan verified receipt/evidence binding

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M02-T010 accepted
- Integration evidence: D-M02-010-002 accepted
- Owner: implementation lane will own `packages/core/src/risk-scan.ts`, `packages/core/src/index.ts`, and `packages/core/test/risk-scan.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, decisions, and integration evidence.
- Human actions: none for the pure local core contract. Any wallet, account, payment, settlement, external receipt/evidence capture, deployment, or live journey remains human-authorized.

## Scope

Make receipt and evidence artifact correlations structural capabilities tied to the exact accepted verified settlement. The card replaces caller-supplied completion correlations with a frozen registered artifact that can be consumed only by the settlement object that issued it.

The local contract is [M03 RiskScan verified receipt/evidence binding](../../../specs/m03-riskscan-receipt-evidence.md); its executable delivery steps are in the [M03 implementation plan](../../../superpowers/plans/2026-09-05-m03-riskscan-receipt-evidence.md).

## Ready transition requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M02-T010 and D-M02-010-002 are accepted locally, and no active lane owns the three declared core paths.
- The card records CORE_P0 priority, exact artifact/settlement identity invariants, the human-action boundary, and concrete validation commands.
- The delivery excludes payment adapters, protocol parsing, I/O, persistence, backend projection changes, API/UI changes, configuration, dependencies, live payment, settlement, evidence capture, and deployment.

## Validation

- RED/GREEN core tests cover valid binding, trimming, immutability, blank artifact fields, forged artifacts, reflective copies, and a distinct settlement object with matching visible correlations.
- `npm run typecheck --workspace @tool402/core`
- `npm run test --workspace @tool402/core`
- `npm run lint --workspace @tool402/core`
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- `npm run queue:check`, the local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T09:49:31Z after the root verified the committed local specification and plan, accepted M02-T010 dependency and integration evidence, disjoint core ownership, explicit human-action boundary, concrete validation commands, and queue validation. The root may activate Task 1 for RED tests.
