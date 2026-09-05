# M04-T020 — RiskScan durable request-admission contract

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M02-T010 accepted; M04-T010 accepted
- Integration evidence: D-M02-010-002 and D-M04-010-002 accepted
- Owner: the proposed implementation scope is `packages/backend/src/risk-scan-durable-request-admission.ts` and `packages/backend/tests/risk-scan-durable-request-admission.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for the pure local admission contract. Any external-store runtime, deployment, payment, settlement, account, wallet, verification, finality, evidence capture, or live assertion remains human-authorized.

## Scope

Create a strict pure admission boundary for the initial `riskScanRequests` document shape. It accepts only sanitized opaque correlation data, produces a fresh frozen unpersisted candidate, and fixes the initial stored state to `payment_required`. It does not write, register a backend function, create a generated API output, connect to an external store, or claim persistence, verification, replay protection, evidence, result completion, or a live state.

The local contract is [M04 RiskScan durable request admission](../../../specs/m04-riskscan-durable-request-admission.md); its executable delivery steps are in the [M04 durable request-admission plan](../../../superpowers/plans/2026-09-05-m04-riskscan-durable-request-admission.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M02-T010 and M04-T010 are accepted locally, their integration evidence is recorded, and no active lane owns the two reserved backend paths.
- The card records CORE_P0 priority, exact admission fields/limits, initial-state boundary, unpersisted/verification boundary, human-action boundary, and concrete validation commands.
- The delivery excludes database mutations/queries/actions, schema changes, generated output, package or lockfile changes, projection/API/UI changes, runtime configuration, external stores, raw request/input/payload/evidence data, credentials, wallets/accounts, payment/settlement action, deployment, and live claims.

## Validation

- RED/GREEN backend tests cover accepted canonical admission, exact safe output, frozen fresh candidates, malformed input, unknown/raw/sensitive keys, invalid identifier/hash/timestamp values, 64-bit bounds, and initial timestamp consistency.
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Root `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T13:54:27Z after the root revalidated all accepted dependencies and their recorded integration evidence, the committed local specification and plan, no active lane, disjoint two-file backend ownership, no pending human action, concrete executable validation, and queue validation. This remains a pure candidate boundary; no writer, reader, generated API, external connection, payment action, deployment, verification, evidence, or live claim is included.
