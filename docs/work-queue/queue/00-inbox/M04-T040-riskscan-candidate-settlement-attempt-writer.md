# M04-T040 — RiskScan candidate settlement-attempt writer

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M04-T010 accepted; M04-T030 accepted
- Integration evidence: D-M04-010-002 and D-M04-030-002 accepted
- Owner: the proposed implementation scope is `packages/backend/src/risk-scan-settlement-attempt-admission.ts`, `packages/backend/convex/riskscan-settlement-attempts.ts`, `packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs`, and `packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for pure candidate admission, internal-mutation code, and handler-level tests. Runtime configuration, deployment, external-store proof, payment, settlement, finality, verification, receipt/evidence capture, accounts, wallets, and live assertions remain human-authorized.

## Scope

Create a strict pure admission boundary and one internal Convex mutation for a candidate `riskScanSettlementAttempts` record. The mutation first admits only safe candidate metadata, loads an existing durable request by its document ID, requires that request's initial `payment_required` state, derives its `publicId` from that stored request, and uses the declared idempotency index with a two-row bound. It inserts one canonical `pending_reconciliation` attempt, replays only an exact existing attempt, or rejects a missing/ineligible request, duplicate index result, or conflict before an insertion.

The local contract is [M04 RiskScan candidate settlement-attempt writer](../../../specs/m04-riskscan-candidate-settlement-attempt-writer.md); its executable delivery steps are in the [M04 candidate settlement-attempt writer plan](../../../superpowers/plans/2026-09-05-m04-riskscan-candidate-settlement-attempt-writer.md).

The mutation is internal-only and becomes a real transactional writer only when a configured Convex runtime invokes it. Local tests prove admission and handler decisions against a controlled database context; they are not proof of an external store, deployment, payment, settlement, finality, verification, evidence, or live result.

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M04-T010 and M04-T030 are accepted locally, their integration evidence is recorded, and no active lane owns the four reserved backend paths.
- The card records CORE_P0 priority, fixed candidate states, safe opaque input limits, internal-only visibility, exact replay/conflict behavior, human-action boundary, and concrete validation commands.
- The delivery excludes a public mutation/query/action, generated output, API/UI wiring, schema changes, package or lockfile changes, runtime configuration, external stores, payment payload/signature data, credentials, wallets/accounts, payment/settlement or finality action, receipt/evidence/result/projection data, deployment, and live claims.

## Validation

- RED/GREEN backend tests cover strict candidate admission, internal registration and validator shape, invalid input before storage access, missing/ineligible request rejection, canonical creation, exact replay without a second insert, duplicate index rejection, conflicts across all protected stored fields, and exact safe return values.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.
