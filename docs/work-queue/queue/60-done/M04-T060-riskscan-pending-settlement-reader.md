# M04-T060 — RiskScan internal pending-settlement reader

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M04-T010 accepted; M04-T040 accepted; M04-T050 accepted
- Integration evidence: D-M04-010-002, D-M04-040-002, and D-M04-050-002 accepted
- Owner: the proposed implementation scope is `packages/backend/convex/riskscan-pending-settlement-reader.ts` and `packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs`. The root owns this card, its local specification and plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for local internal-query code and controlled handler tests. Runtime configuration, deployment, external-store proof, payment, settlement, transaction verification, finality, receipt/evidence capture, accounts, wallets, and live assertions remain human-authorized.

## Scope

Create one internal read-only Convex query that retrieves a coherent `pending_verification` candidate record for a safe existing `pending_reconciliation` settlement attempt. It loads the attempt by opaque ID, derives the network and candidate transaction reference only from its safe own data fields, then reads the declared record indexes with two-row bounds. It returns `null` only when the attempt is absent or no matching candidate record exists; it returns a narrow candidate projection only when both indexes identify the same safe canonical record.

The query rejects unsafe/ineligible attempts and duplicate, divergent, malformed, mismatched, advanced, or finality-bearing record rows before returning a projection. It writes nothing and never promotes a state. It does not verify a transaction, payment, settlement, finality, receipt/evidence, result, external store, or live behavior; it adds no public API/UI surface, configuration, deployment, or external action.

The local contract is [M04 RiskScan internal pending-settlement reader](../../../specs/m04-riskscan-pending-settlement-reader.md); its executable steps are in the [M04 pending-settlement reader plan](../../../superpowers/plans/2026-09-05-m04-riskscan-pending-settlement-reader.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or implementation.
- M04-T010, M04-T040, and M04-T050 remain accepted locally, their integration evidence is recorded, and no active lane owns the two reserved backend paths.
- The card records CORE_P0 priority, read-only/internal query scope, exact null/projection/conflict behavior, strict opaque durable-data boundaries, human boundary, and concrete validation commands.
- The delivery excludes public commands, generated output, API/UI wiring, schema/package/lockfile changes, runtime configuration, external-store proof, payment payload/signature data, credentials, wallets/accounts, payment/settlement/finality action, receipt/evidence/result/projection data beyond the approved candidate fields, deployment, and live claims.

## Validation

- RED/GREEN backend tests cover exact internal-query registration, absent attempt and absent record results, safe candidate projection, strict own-data/descriptor-prototype safety without getter reads, ordered bounded dual-index reads, duplicate/divergent/malformed/conflicting/finality record rejection, and zero writes.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run lint`, production Webpack build, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T17:36:12Z after a fresh queue rescan confirmed M04-T010, M04-T040, and M04-T050—including their integration evidence—are accepted; no active lane owns the new two-path backend boundary; and no human action blocks a local read-only query specification or controlled handler work. This inbox card authorizes neither RED/code nor an external runtime, store, payment, settlement, transaction verification, finality, evidence, result, API/UI, deployment, or live claim.

## Ready transition

Ready at 2026-09-05T17:46:02Z after the root revalidated accepted M04-T010, M04-T040, and M04-T050 dependencies and their integration evidence; the pushed corrected local specification and plan; disjoint two-path backend ownership; no active lane; no pending human action; concrete validation commands; queue validation; and the independent design review plus scoped re-review. The card remains a local internal read-only query only; no configured runtime, external store, payment, settlement, transaction verification, finality, evidence, result, API/UI, deployment, or live claim is authorized.

## Activation

Activated at 2026-09-05T17:47:13Z after a fresh queue rescan confirmed the pushed ready state, no active lane, accepted dependencies, and the same disjoint backend ownership boundary. The task starts with its internal-reader RED contract. No public function, generated API, configured runtime, external action, payment, wallet/account action, deployment, transaction verification, finality, evidence, or live claim is authorized.

## Acceptance

Accepted at 2026-09-05T18:02:38Z. `MODULE_BASE` is `3b6cf0f8b550098942738c6e1e3947244f65866b`; `MODULE_HEAD` is `623bd1835d62fe67e38961114bcfe863a891d125`. The controlled internal-reader RED/GREEN contract, backend typecheck/test/lint, root Node 22.21.1 typecheck, 120-test suite, lint, production Webpack build, queue validation, whitespace check, and enabled local-reference guard passed. The independent task review and two fresh final module-review generations returned PASS with no Critical, Important, or Minor finding. This acceptance covers only controlled local query registration and handler behavior; it does not assert a configured durable store, payment, settlement, transaction verification, finality, evidence, result, deployment, or live behavior.
