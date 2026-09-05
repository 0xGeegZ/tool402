# M03-T030 — RiskScan settlement observer

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M02-T050 accepted; M02-T060 accepted; M03-T020 accepted
- Integration evidence: D-M02-050-002, D-M02-060-002, and D-M03-020-002 accepted
- Owner: the accepted implementation scope was `apps/web/src/lib/riskscan-x402.ts` and `apps/web/tests/riskscan-api.test.mjs`. The root owns this card, the local specification, plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for the bounded local observer. Any external payment, settlement verification, durable store, account, wallet, receipt/evidence capture, deployment, or live journey remains human-authorized.

## Scope

Create an optional private server observation seam that gives a supplied server-owned consumer an exact core verified-settlement capability only after a compatible local x402 settlement event. It is disabled by default and deliberately does not create an API/UI state, persistence, proof, or live assertion.

The local contract is [M03 RiskScan settlement observer](../../../specs/m03-riskscan-settlement-observer.md); its executable delivery steps are in the [M03 settlement observer plan](../../../superpowers/plans/2026-09-05-m03-riskscan-settlement-observer.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED tests or production code.
- M02-T050, M02-T060, and M03-T020 are accepted locally, their integration evidence is recorded, and no active lane owns the two reserved web paths.
- The card records CORE_P0 priority, protected-only issuance, an explicit Exact authorization/after-handler flow, transient digest boundary, duplicate fail-closed behavior, human-action boundary, and concrete validation commands.
- The delivery excludes persistence, replay protection, external payment or settlement assertion, receipt/evidence, completion, backend/API/UI behavior, configuration, dependencies, accounts, wallets, deployment, and live claims.

## Validation

- RED/GREEN web tests cover valid capability delivery, explicit authorization/after-handler flow selection, direct/unsigned/invalid paths, settlement/cancellation failures, result validation, duplicate collision isolation, timeout cleanup, synchronous/rejected-Promise consumer failure isolation, and native response preservation.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run build --workspace @tool402/web`
- Root `npm run typecheck`, `npm run test`, `npm run queue:check`, the enabled local-reference guard, independent task review, and two fresh clean module-review generations.

## Ready transition

Ready at 2026-09-05T11:01:41Z after the root revalidated all accepted dependencies and their recorded integration evidence, committed local specification and plan, disjoint two-file web ownership, no active lane, no pending human action, concrete executable validation, and queue/reference checks. An independent readiness audit corrected the non-existent lint command and made rejected-Promise consumer isolation explicit before this transition. No external payment, durable state, evidence, deployment, or live action is included.

## Activation

Activated at 2026-09-05T11:02:49Z after a fresh queue rescan confirmed the pushed ready state, no active lane, and the same disjoint web ownership boundary. Task 1 starts with its protected-handler RED contract. The observer remains optional and local-only; no payment, account, wallet, evidence, persistence, deployment, or live action is authorized.

## Completion transition

Accepted at 2026-09-05T11:53:58Z. The implementation completed the optional protected observer from an observed RED through GREEN coverage, then corrected a review-found pre-handler correlation risk by committing the local authorization-flow contract before its minimal route requirement change. Root verification passed Node 22.21.1 workspace typecheck, the 64-test suite, lint, queue validation, whitespace checks, and the enabled local-reference guard. A production Webpack build completed successfully; the default Turbopack build remains host-blocked by an internal port-bind `EPERM` reproduced outside the sandbox, so it is recorded as a diagnostic rather than a green result. Independent task review found and verified the corrective flow pin; a fresh post-fix task review and two final fresh clean Standards/Spec review generations found no Critical, Important, or Minor finding. `MODULE_BASE` was `b114047eaa949c69a4ae3d930fc271a2e6f61207`; `MODULE_HEAD` was `7bf06fe133819e8288bf038ef84702995eb6d502`. No persistence, API/UI behavior, configuration, external payment, settlement assertion, evidence capture, wallet/account action, deployment, or live claim was added.
