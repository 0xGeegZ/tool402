# M03-T010 — RiskScan verified receipt/evidence binding

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M02-T010 accepted
- Integration evidence: D-M02-010-002 accepted
- Owner: the accepted implementation scope was `packages/core/src/risk-scan.ts`, `packages/core/src/index.ts`, and `packages/core/test/risk-scan.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, decisions, and integration evidence.
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

Ready at 2026-09-05T09:49:31Z after the root verified the committed local specification and plan, accepted M02-T010 dependency and integration evidence, disjoint core ownership, explicit human-action boundary, concrete validation commands, and queue validation.

## Activation

Activated at 2026-09-05T09:51:28Z after a fresh queue rescan confirmed no active lane, clean pushed queue state, and the accepted core-only ownership boundary. Task 1 starts with the public RED artifact-binding contract; no external action is included.

## Completion transition

Accepted at 2026-09-05T10:14:53Z. The implementation completed the pure core binding contract from an observed RED contract through GREEN coverage. Root verification passed Node 22.21.1 workspace typecheck, 55-test suite, lint, queue validation, whitespace checks, and the enabled local-reference guard. Independent task review and scoped re-review were clean; two final fresh module-review generations found no Critical, Important, or Minor finding. `MODULE_BASE` was `95d01b8f89d9989349829effe841b3fd564b77da`; `MODULE_HEAD` was `ad60a64bcccb1e013ac17cd9f7ca5a27ba3be137`. No adapter, API/UI, persistence, configuration, payment, external evidence, deployment, or live claim was added.
