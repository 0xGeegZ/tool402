# M04-T020 — RiskScan durable request-admission contract

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M02-T010 accepted; M04-T010 accepted
- Integration evidence: D-M02-010-002 and D-M04-010-002 accepted
- Owner: the accepted implementation scope was `packages/backend/src/risk-scan-durable-request-admission.ts` and `packages/backend/tests/risk-scan-durable-request-admission.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
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

## Activation

Activated at 2026-09-05T13:55:44Z after a fresh queue rescan confirmed the pushed ready state, no active lane, and the same disjoint backend ownership boundary. Task 1 starts with its durable-request-admission RED contract. No writer, reader, generated API, external action, payment, wallet/account action, deployment, verification, evidence, or live claim is authorized.

## Completion transition

Accepted at 2026-09-05T14:39:58Z. The admission boundary began from an observed missing-module RED and reached a Green exact-candidate contract. Independent specification review found that an accessor descriptor could inherit `value` from a polluted `Object.prototype`; the scoped fix requires an own descriptor value and passed a fresh clean task re-review. Root verification passed Node 22.21.1 typecheck, the 69-test suite, lint, queue validation, whitespace, the enabled local-reference guard, and a production Webpack build. Two fresh clean Standards/Spec review generations found no Critical, Important, or Minor finding. `MODULE_BASE` was `76e7a3928d4419079a7dd39499a69e67ff39219c`; `MODULE_HEAD` was `514331387e69783c4049d38e1c1216d7036a771a`. No database writer, reader, generated API, external connection, payment action, settlement assertion, account/wallet action, deployment, verification/evidence capture, or live claim was added.
