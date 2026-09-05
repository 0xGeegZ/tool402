# M04-T030 — RiskScan internal durable request writer

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M02-T010 accepted; M04-T010 accepted; M04-T020 accepted
- Integration evidence: D-M02-010-002, D-M04-010-002, and D-M04-020-002 accepted
- Owner: the proposed implementation scope is `packages/backend/convex/riskscan-requests.ts`, `packages/backend/convex/tsconfig.json`, and `packages/backend/tests/risk-scan-internal-request-writer.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for local internal-mutation code and handler-level tests. External-store configuration/runtime, deployment, payment, settlement, verification/finality, evidence capture, accounts, wallets, and live assertions remain human-authorized.

## Scope

Register one internal Convex mutation that receives the six already-safe durable request fields, delegates their normalization to the accepted admission boundary, and transactionally creates or replays the initial `riskScanRequests` record by exact `requestRef` correlation. It must query the accepted `by_request_ref` index, insert only a new canonical `payment_required` document, replay only an exactly matching existing document, and reject a conflicting request reference before any insertion.

The local contract is [M04 RiskScan internal request writer](../../../specs/m04-riskscan-internal-request-writer.md); its executable delivery steps are in the [M04 internal request-writer plan](../../../superpowers/plans/2026-09-05-m04-riskscan-internal-request-writer.md).

The registered function is internal-only and becomes a real transactional writer when run by a configured Convex runtime. The local handler test proves only registration and code-level query/insert decisions against a controlled context; it is not evidence of an external store, deployment, persistence, settlement, verification, evidence, or live result.

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M02-T010, M04-T010, and M04-T020 are accepted locally, their integration evidence is recorded, and no active lane owns the three reserved backend paths.
- The card records CORE_P0 priority, internal-only visibility, exact safe args/return values, request-reference replay/conflict rules, human-action boundary, and concrete validation commands.
- The delivery excludes a public mutation/query/action, generated output, API/UI wiring, schema changes, package or lockfile changes, runtime configuration, external stores, raw subject/context/request/payload/evidence data, credentials, wallets/accounts, payment/settlement action, deployment, and live claims.

## Validation

- RED/GREEN backend tests cover internal registration metadata and validator shape, new canonical insertion, exact replay without a second insert, conflict rejection without insertion, admission rejection before storage access, and exact safe returned fields.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T14:58:37Z after the root revalidated all accepted dependencies and their recorded integration evidence, the committed local specification and plan, no active lane, disjoint three-path backend ownership, no pending human action, concrete executable validation, and queue validation. This is internal writer code only; no configured runtime, deployed store, payment/settlement, verification, evidence, or live claim is included.

## Activation

Activated at 2026-09-05T14:59:49Z after a fresh queue rescan confirmed the pushed ready state, no active lane, and the same disjoint backend ownership boundary. Task 1 starts with its internal-writer RED contract. No public function, generated API, configured runtime, external action, payment, wallet/account action, deployment, verification, evidence, or live claim is authorized.
