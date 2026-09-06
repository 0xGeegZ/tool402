# M18-T010 — Requirements-bound offering purchase lifecycle

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M16-T010 accepted; M17-T010 accepted
- Owner: `packages/core/src/offering-purchase-lifecycle.ts`,
  `packages/core/src/requirements-offering-quote.ts` for a narrow internal
  issuance verifier only,
  `packages/core/src/index.ts`,
  `packages/core/test/offering-purchase-lifecycle.test.mjs`, and
  `packages/core/test/offering-purchase-lifecycle.types.ts` are proposed
  implementation paths. The root owns this card, local specification/import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, commits, and pushes.
- Human actions: none for this pure local state-machine contract. The accepted
  human payment evidence does not authorize any additional external action.

## Scope

Create the smallest dependency-correct pure Core purchase lifecycle that
snapshots an accepted requirements-bound offering quote and makes legal funding
and allocation workflow states explicit before any persistence, signer, wallet,
ATS, or payment adapter exists.

The local contract is [M18 requirements-bound purchase lifecycle](../../../specs/m18-offering-purchase-lifecycle.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M18 requirements-bound purchase lifecycle plan](../../../superpowers/plans/2026-09-06-m18-offering-purchase-lifecycle.md).

This card adds no offering publication/schema, durable generic external attempt,
payment client, account/asset/recipient configuration, wallet, signer, funding,
allocation, ATS action, transaction, settlement, receipt, clearing, HCS,
payout, deployment, or live claim.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before any RED test or code change.
- M16-T010 and M17-T010 remain accepted locally. Their terms/allocation and
  requirements/expiry boundaries materially supply this card's pure inputs.
- No active card owns the proposed Core paths. The proposal is disjoint from
  accepted RiskScan, backend, Agent, and Web paths.
- The contract records one closed discriminated state union, transition matrix,
  successful-source consumption, terminal unknown behavior, explicit expiry
  comparison, no-clock behavior, provenance/immutability, tier, human boundary,
  and concrete validation commands.
- A scoped independent design review is clean before the card enters 10-ready.

## Validation

- RED/GREEN tests prove public exports, quote snapshotting, each legal edge,
  successful-source consumption, rejected-transition non-consumption, illegal
  skipped/duplicate edges, explicit expiry behavior, terminal unknown behavior,
  structural-copy rejection, and frozen outputs. The focused command is
  `node --test packages/core/test/offering-purchase-lifecycle.test.mjs` from
  the repository root. The transparent [M18 TDD execution trace](../../evidence/M18-T010-tdd.md)
  preserves observed RED/GREEN outcomes but does not claim earlier commit
  chronology that was not durably recorded.
- A public compile-time fixture proves the state surface preserves the accepted
  Core brands.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T21:26:23Z after a fresh source-to-runtime critical-path
rescan confirmed that the accepted local terms/allocation and
requirements-bound quote are the dependency-correct pure inputs for this
smallest missing funding lifecycle. Broader offering schema, durable generic
attempt, ATS boundary/configuration, payment client, and live work remain
separate non-eligible capabilities. This card authorizes only its local
authority records and independent design review; it authorizes neither RED/code
nor any external action.

## Design re-review

Fresh scoped re-review at 2026-09-06T21:58:53Z confirmed that the amended
authority defines the complete public discriminated union and immutable typed
snapshot, consumes only the exact source identity of successful transitions,
preserves a source after a rejected transition, closes every listed transition,
uses explicit expiry timestamps without a clock, and keeps unknown outcomes
fail-closed. It found no remaining contract, dependency, pure-Core, authority,
or local-reference defect. A fresh ready-transition rescan remains required;
this result does not authorize RED/code by itself.

## Ready transition

Ready at 2026-09-06T21:58:53Z after a fresh post-review rescan confirmed the
accepted M16/M17 dependencies, committed and resolvable corrected authority,
disjoint proposed Core ownership, clean independent design re-review, enabled
local boundary, and no human blocker for this deterministic local scope. This
ready state authorizes only the bounded RED/GREEN contract after root
activation; it does not authorize payment, funding, allocation, ATS, account,
wallet, signer, transaction, settlement, receipt, persistence, clearing, HCS,
payout, deployment, or live behavior.

## Activation

Activated at 2026-09-06T22:01:19Z after a fresh post-ready rescan confirmed
that M18-T010 is the sole ready card, no active-card conflict owns its bounded
Core paths, accepted M16/M17 dependencies remain present, and the accepted
human evidence grants no external authority but does not block this pure local
work. This activation authorizes the specified Core RED/GREEN implementation
and verification only; it does not expand authority to payment, funding,
allocation, ATS, account, wallet, signer, transaction, settlement, receipt,
persistence, clearing, HCS, payout, deployment, or live behavior.

## Module-review correction

The first fresh module review at 2026-09-06T22:24:16Z found that a structural
or mutable JavaScript quote lookalike could create a purchase and influence a
later expiry read. The root accepted this as an implementation-boundary defect.
M18 now owns only the narrow internal quote-issuance verifier needed to reject
every non-issued quote before fields are read; it adds no barrel API, external
integration, persistence, or live behavior. The regression suite must prove
that forged, copied, proxied, and mutable lookalikes reject, then a fresh task
review and two fresh clean module-review generations remain required.

## TDD evidence preservation

The root observed the initial missing-export RED, the reentrant-source RED,
and the quote-issuance RED during active execution, but no durable run record
was committed before the first implementation commit. The local
[TDD execution trace](../../evidence/M18-T010-tdd.md) preserves those actual
outcomes after the fact and explicitly does not claim independent proof of
earlier commit chronology. Fresh task and module review must assess the final
code and this limitation directly.
