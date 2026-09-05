# M04-T070 — RiskScan internal pending-reconciliation selector

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M04-T010 accepted; M04-T040 accepted; M04-T060 accepted
- Integration evidence: D-M04-010-002, D-M04-040-002, and D-M04-060-002 accepted
- Owner: the proposed implementation scope is `packages/backend/convex/riskscan-pending-reconciliation-selector.ts` and `packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs`. The root owns this card, its local specification and plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for local internal-query code and controlled handler tests. Runtime configuration, deployment, external-store proof, payment, settlement, transaction verification, finality, receipt/evidence capture, accounts, wallets, and live assertions remain human-authorized.

## Scope

Create one internal read-only Convex query that selects at most one safe stored
`pending_reconciliation` attempt whose stored reconciliation timestamp is at
or before an explicit caller-supplied cutoff. It returns only an opaque attempt
ID. It uses the declared attempt index with an exact state constraint and a
two-row bound so it cannot choose arbitrarily from an ambiguous result.

The query rejects an invalid cutoff, unsafe/ineligible candidate, or ambiguous
bounded result; it writes nothing and never changes a state. It does not read a
clock, schedule or execute reconciliation, verify a transaction, payment,
settlement, finality, receipt/evidence, result, external store, or live
behavior; it adds no public API/UI surface, configuration, deployment, or
external action.

The local contract is [M04 RiskScan internal pending-reconciliation selector](../../../specs/m04-riskscan-pending-reconciliation-selector.md); its executable steps are in the [M04 pending-reconciliation selector plan](../../../superpowers/plans/2026-09-05-m04-riskscan-pending-reconciliation-selector.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED
  tests or implementation.
- M04-T010, M04-T040, and M04-T060 remain accepted locally, their integration
  evidence is recorded, and no active lane owns the two reserved backend paths.
- The card records CORE_P0 priority, internal read-only selector scope, exact
  cutoff/null/projection/conflict behavior, strict opaque durable-data
  boundaries, human boundary, and concrete validation commands.
- The delivery excludes public commands, generated output, API/UI wiring,
  schema/package/lockfile changes, runtime configuration, external-store proof,
  payment payload/signature data, credentials, wallets/accounts,
  payment/settlement/finality action, receipt/evidence/result/projection data
  beyond the approved opaque attempt ID, deployment, and live claims.

## Validation

- RED/GREEN backend tests cover exact internal-query registration, cutoff
  rejection before querying, empty-index null behavior, safe opaque attempt-ID
  projection, strict own-data/descriptor-prototype safety without getter reads,
  exact ordered bounded index reads, ambiguous/unsafe candidate rejection, and
  zero writes.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run lint`, production Webpack
  build, `npm run queue:check`, the enabled local-reference guard, independent
  task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T18:05:49Z after a fresh queue rescan confirmed M04-T010,
M04-T040, and M04-T060—including their integration evidence—are accepted; no
active lane owns the new two-path backend boundary; and no human action blocks
a local read-only selector specification or controlled handler work. This inbox
card authorizes neither RED/code nor an external runtime, store, payment,
settlement, transaction verification, finality, evidence, result, API/UI,
deployment, or live claim.

## Ready transition

Ready at 2026-09-05T18:11:12Z after the root revalidated accepted M04-T010,
M04-T040, and M04-T060 dependencies and their integration evidence; the pushed
local specification and corrected plan; disjoint two-path backend ownership; no
active lane; no pending human action; concrete validation commands; queue
validation; and the independent design review plus scoped re-review. The card
remains a local internal read-only query only; no configured runtime, external
store, payment, settlement, transaction verification, finality, evidence,
result, API/UI, deployment, or live claim is authorized.

## Activation

Activated at 2026-09-05T18:12:23Z after a fresh queue rescan confirmed the
pushed ready state, no active lane, accepted dependencies, and the same
disjoint backend ownership boundary. The task starts with its internal-selector
RED contract. No public function, generated API, configured runtime, external
action, payment, wallet/account action, deployment, transaction verification,
finality, evidence, or live claim is authorized.
