# M02-T080 — UI-S03 RiskScan request and protocol-state flow

## State

- Tier: CORE_P0
- Queue state: 40-module-review
- Dependencies: M01-T040 accepted; M02-T010 accepted; M02-T020 accepted; M02-T050 accepted; M02-T060 accepted; M02-T070 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-010-002, D-M02-020-002, D-M02-050-002, D-M02-060-002, and D-M02-070-002 accepted
- Owner: implementation lane will own `apps/web/src/app/explore/riskscan/try/page.tsx`, `apps/web/src/components/riskscan/request/**`, `apps/web/tests/riskscan-request-state.test.mjs`, and `apps/web/tests/riskscan-try.test.mjs`; it may amend `apps/web/src/components/riskscan/detail/riskscan-detail.tsx` and `apps/web/tests/riskscan-detail.test.mjs` only to add the committed local Try link. The root owns this card, the manifest, ledger, plan, and queue records.
- Human actions: none for local request-state delivery. Configuration, a compatible payment consumer, settlement, evidence, deployment, and any external payment action remain human-authorized.

## Scope

Create a truthful browser request flow for the accepted RiskScan Quick API boundary. It may submit the bounded local Quick request, expose a response-derived typed state, and show only unavailable, payment-required, invalid-request, transport-failure, unexpected-response, or actual validated Quick-response boundaries. A payment challenge is not a payment, settlement, completed state, receipt, or evidence record.

The local manifest is [UI-S03](../../../ui/UI-S03.md), the selected local boundary is recorded in the [local UI ledger](../../../ui/IMPORT-LEDGER.md), and the implementation plan is [UI-S03 RiskScan request-flow plan](../../../superpowers/plans/2026-09-05-m02-ui-s03-riskscan-request-flow.md).

## Ready transition requirements

- The local UI-S03 manifest and implementation plan are committed before RED tests or implementation.
- All listed dependencies are accepted locally and the owned implementation paths are disjoint from any active lane.
- The card records CORE_P0 priority, exact browser/API boundaries, explicit human actions, and concrete validation commands.
- The flow excludes client configuration, wallet, signer, payment-header authoring, raw payment payloads, provider/account surfaces, fabricated result/payment/evidence state, direct facilitator access, and new dependencies.

## Validation

- RED/GREEN state-adapter tests cover the documented actual API response boundaries and reject malformed success payloads.
- Focused UI tests cover request fields, local navigation, accessible state feedback, and the exclusion boundary.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npx --no-install next build --webpack` from `apps/web` under Node 22.21.1
- `npm run queue:check`, the local-reference guard, desktop/narrow browser checks, and a narrow accessibility audit.

## Activation

Activated at 2026-09-05T08:13:01Z after the root verified the committed local manifest and plan, accepted dependencies, disjoint ownership, declared human-action boundary, and queue validation. Task 1's response-state adapter was accepted at 2026-09-05T08:22:50Z after RED/GREEN coverage, root Node 22.21.1 typecheck and 34-test web verification, an independent task review, and scoped re-review of its response-projection and test-output fix. Task 2's route/presentation work may now consume only that accepted adapter.

## Module-review transition

Entered module review at 2026-09-05T08:53:00Z after the bounded Try route and adapter were committed, independently task-reviewed, verified through the local browser, and pushed. The first fresh module-review generation was clean. The second identified an open response-validation defect: a structurally shaped but semantically incoherent success payload must not be rendered. This card remains unaccepted while the adapter receives a TDD correction and the two clean module-review generations restart.
