# M30-T010 — RiskScan route settlement evidence

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M02-T060 accepted; M03-T030 accepted; M06-T010 accepted
- Owner: The root owns this card, `docs/specs/m30-riskscan-route-settlement-evidence.md`,
  `docs/superpowers/plans/2026-09-07-m30-riskscan-route-settlement-evidence.md`,
  `docs/imports/SPEC-IMPORT-LEDGER.md`, queue state, catalog, ownership,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  only `apps/web/src/lib/riskscan-settlement-evidence.ts`,
  `apps/web/src/lib/riskscan-x402.ts`, and
  `apps/web/tests/riskscan-settlement-evidence.test.mjs`.
- Human actions: none. This local wiring card grants no authority over
  recipients, facilitators, runtime configuration, accounts, wallets, signers,
  payments, transactions, reserve, allocation, clearing, ATS, HCS, payout,
  deployment, or any external action.

## Scope

Make the accepted M03 settlement observer reachable from the public route, and
record each verified settlement it issues in one bounded server-owned
in-process sink. The route currently constructs its handler with no options, so
the observer never registers and a settled payment issues no local capability.

The local contract is the [M30 route settlement-evidence contract](../../../specs/m30-riskscan-route-settlement-evidence.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M30 implementation plan](../../../superpowers/plans/2026-09-07-m30-riskscan-route-settlement-evidence.md).

This card adds no durable store, no public read surface, no lifecycle
projection, no receipt or evidence binding, and no payment client.

## Candidate ready requirements

- The local contract, source-record amendment, plan, card, catalog, ownership,
  decision, and state records are committed before a RED test or source change.
- M02-T060, M03-T030, and M06-T010 remain accepted locally. M27 remains an
  inbox-only authority intake and is untouched.
- The three declared Web paths are disjoint from every active card. The M03
  card is accepted, so its owned source file is available for this amendment
  under an explicit root integration reservation recorded in the ownership file.
- The contract fixes the consumer seam, the default recorder, the sink bound
  and eviction order, and the unchanged protected-response behavior before any
  code.

## Verification

- A durable RED test file precedes the source change and fails for the stated
  reason: the default recorder is not wired and the module does not exist.
- Focused M30 tests pass, and the existing Web suite continues to pass
  unchanged, proving the accepted M03 behavior is preserved.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Independent task review and a fresh module-review generation report no
  Critical, Important, or Minor finding.

## Boundary

This card observes and records a settlement the accepted observer already
issues. It claims no durable record, no receipt, no evidence, no finality, no
deployed behavior, and no live result. Recorded evidence is process-local and
is lost on restart; no document may describe it as durable.

## Acceptance

Accepted at `b5a4dc3` plus the review correction that follows it. The local
verification, live exercise, and review outcomes are recorded in
[the M30 integration evidence](../../evidence/M30-T010-review.md).

The independent task review reported no Critical, Important, or Minor finding.
The fresh module-review generation reported no Critical finding and no
correctness defect: it confirmed the cache-bypass condition, the eviction order
and bound, and that no rule of the accepted M03 contract is contradicted. Its
one Important finding — that the module carried no statement of its
process-local, non-durable, caller-supplied-content nature for the next reader —
was applied as a header comment.

Three Minor findings were considered and declined, with reasons recorded here
rather than silently dropped.

- Folding the "no reader yet" note into the same header comment covers the
  second finding; a separate comment would repeat it.
- The default consumer appears at two call sites. Extracting a resolver helper
  was declined: the cached path uses the default because it is by definition
  the no-options path, and one imported identifier used twice does not justify
  an abstraction that would also make it easier to route a non-default consumer
  into the shared cache.
- `settlementObserverTimeoutMs` remains absent from `RiskScanPostOptions`. It
  is an internal test-only construction seam, it is unaffected by this diff,
  and exposing it is outside this contract. It is named here as a possible
  follow-up, not a defect of this card.
