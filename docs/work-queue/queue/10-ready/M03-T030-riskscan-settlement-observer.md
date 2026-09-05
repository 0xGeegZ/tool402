# M03-T030 — RiskScan settlement observer

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M02-T050 accepted; M02-T060 accepted; M03-T020 accepted
- Integration evidence: D-M02-050-002, D-M02-060-002, and D-M03-020-002 accepted
- Owner: implementation scope is reserved for `apps/web/src/lib/riskscan-x402.ts` and `apps/web/tests/riskscan-api.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for the bounded local observer. Any external payment, settlement verification, durable store, account, wallet, receipt/evidence capture, deployment, or live journey remains human-authorized.

## Scope

Create an optional private server observation seam that gives a supplied server-owned consumer an exact core verified-settlement capability only after a compatible local x402 settlement event. It is disabled by default and deliberately does not create an API/UI state, persistence, proof, or live assertion.

The local contract is [M03 RiskScan settlement observer](../../../specs/m03-riskscan-settlement-observer.md); its executable delivery steps are in the [M03 settlement observer plan](../../../superpowers/plans/2026-09-05-m03-riskscan-settlement-observer.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M02-T050, M02-T060, and M03-T020 are accepted locally, their integration evidence is recorded, and no active lane owns the two reserved web paths.
- The card records CORE_P0 priority, protected-only issuance, transient digest boundary, duplicate fail-closed behavior, human-action boundary, and concrete validation commands.
- The delivery excludes persistence, replay protection, external payment or settlement assertion, receipt/evidence, completion, backend/API/UI behavior, configuration, dependencies, accounts, wallets, deployment, and live claims.

## Validation

- RED/GREEN web tests cover valid capability delivery, direct/unsigned/invalid paths, settlement/cancellation failures, result validation, duplicate collision isolation, timeout cleanup, synchronous/rejected-Promise consumer failure isolation, and native response preservation.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run build --workspace @tool402/web`
- Root `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T11:01:41Z after the root revalidated all accepted dependencies and their recorded integration evidence, committed local specification and plan, disjoint two-file web ownership, no active lane, no pending human action, concrete executable validation, and queue/reference checks. An independent readiness audit corrected the non-existent lint command and made rejected-Promise consumer isolation explicit before this transition. No external payment, durable state, evidence, deployment, or live action is included.
