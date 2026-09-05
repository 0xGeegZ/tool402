# M04-T050 — RiskScan pending-verification settlement-record writer

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M04-T010 accepted; M04-T040 accepted
- Integration evidence: D-M04-010-002 and D-M04-040-002 accepted
- Owner: the proposed implementation scope is `packages/backend/src/risk-scan-settlement-record-admission.ts`, `packages/backend/convex/riskscan-settlement-records.ts`, `packages/backend/tests/risk-scan-settlement-record-admission.test.mjs`, and `packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs`. The root owns this card, its local specification and plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for local candidate admission, internal mutation code, and controlled handler tests. Runtime configuration, deployment, external-store proof, payment, settlement, finality, verification, receipt/evidence capture, accounts, wallets, and live assertions remain human-authorized.

## Scope

Create a strict pure admission boundary and one internal Convex mutation for a candidate `riskScanSettlementRecords` record. The mutation must first admit only a bounded opaque transaction reference and timestamp, then load one existing durable settlement attempt by document ID. It may proceed only when that attempt is a safe own-data record with the fixed `risk_scan_settlement` operation, `pending_reconciliation` state, a valid stored network, and a candidate reference exactly matching the admitted transaction reference. It derives network solely from that stored attempt.

The writer uses the declared `by_attempt` and `by_network_and_transaction_ref` indexes with two-row bounds. It creates one canonical `pending_verification` record only when both lookups are empty; it replays only a single exact canonical record returned consistently by both indexes; otherwise it rejects before an insertion. It never verifies a transaction or finality, mutates an attempt/request, parses payment data, or creates evidence, a result, a public API/UI surface, runtime configuration, a deployment, or a live claim.

The local contract is [M04 RiskScan pending-verification settlement-record writer](../../../specs/m04-riskscan-pending-verification-settlement-record-writer.md); its executable steps are in the [M04 pending-verification settlement-record writer plan](../../../superpowers/plans/2026-09-05-m04-riskscan-pending-verification-settlement-record-writer.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or implementation.
- M04-T010 and M04-T040 remain accepted locally, their integration evidence is recorded, and no active lane owns the four reserved backend paths.
- The card records CORE_P0 priority, fixed candidate state, strict opaque input and stored-record boundaries, both index contracts, exact replay/conflict behavior, human boundary, and concrete validation commands.
- The delivery excludes public commands, generated output, API/UI wiring, schema/package/lockfile changes, runtime configuration, external stores, payment payload/signature data, credentials, wallets/accounts, payment/settlement/finality action, receipt/evidence/result/projection data, deployment, and live claims.

## Validation

- RED/GREEN backend tests cover strict candidate admission, descriptor-prototype pollution, internal registration and validator shape, invalid input before storage access, unsafe/ineligible attempt rejection, exact two-index creation/replay, duplicate/divergent/malformed index results, all protected-field conflicts, no accessor reads, and exact safe return values.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run lint`, production webpack build, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T16:55:43Z after a fresh queue rescan confirmed M04-T010 and M04-T040, including their integration evidence, are accepted; no active lane owns the four reserved backend paths; and no human action blocks local specification or controlled handler work. This inbox card defines only a future internal candidate-record boundary and does not authorize RED/code until its local specification and plan are committed. It makes no configured-runtime, store, payment, settlement, finality, verification, evidence, result, API/UI, deployment, or live claim.
