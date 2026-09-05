# M03-T020 — RiskScan payment-state provenance

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M02-T010 accepted; M03-T010 accepted
- Integration evidence: D-M02-010-002 and D-M03-010-002 accepted
- Owner: the implementation lane owns `packages/core/src/risk-scan.ts` and `packages/core/test/risk-scan.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for the pure in-process core hardening. Any payment adapter, external settlement verification, receipt/evidence capture, deployment, or live journey remains human-authorized.

## Scope

Make issued `payment_required` and `payment_pending` states identity-backed frozen capabilities before they can advance to a verified settlement. This closes the structural-forgery path without changing current multi-settlement retry semantics or creating any external claim.

The local contract is [M03 RiskScan payment-state provenance](../../../specs/m03-riskscan-payment-state-provenance.md); its executable delivery steps are in the [M03 payment-state provenance plan](../../../superpowers/plans/2026-09-05-m03-riskscan-payment-state-provenance.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M02-T010 and M03-T010 are accepted locally, and no active lane owns the two declared core paths.
- The card records CORE_P0 priority, exact issued-state identity invariants, unchanged multiple-settlement semantics, the human-action boundary, and concrete validation commands.
- The delivery excludes adapters, protocol parsing, I/O, persistence, backend projection changes, API/UI changes, configuration, dependencies, live payment, settlement, receipt/evidence capture, and deployment.

## Validation

- RED/GREEN core tests cover frozen issued states, literal and reflective-copy rejection at both advancement boundaries, and legitimate lifecycle compatibility.
- `npm run typecheck --workspace @tool402/core`
- `npm run test --workspace @tool402/core`
- `npm run lint --workspace @tool402/core`
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T10:29:35Z after the root verified both accepted dependencies and their integration evidence, the committed local specification and plan, no active lane, disjoint two-file core ownership, explicit human-action boundary, concrete validation commands, and queue validation. No external settlement, evidence, or deployment action is included.

## Activation

Activated at 2026-09-05T10:31:06Z after a fresh queue rescan confirmed no active lane, a clean pushed ready state, and the accepted two-file core ownership boundary. Task 1 starts with the public RED issued-state provenance contract; no external action is included.
