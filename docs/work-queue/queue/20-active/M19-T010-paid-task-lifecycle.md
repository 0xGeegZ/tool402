# M19-T010 — Requirement-bound paid-task lifecycle

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M17-T010 accepted
- Owner: `packages/core/src/paid-task-lifecycle.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/paid-task-lifecycle.test.mjs`, and
  `packages/core/test/paid-task-lifecycle.types.ts` are proposed
  implementation paths. The root owns this card, local specification/import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, commits, and pushes.
- Human actions: none for this pure local lifecycle. Existing human payment
  evidence grants no new authority and does not block this intake scope.

## Scope

Create the smallest dependency-correct pure Core state machine for a
requirements-bound paid task. It creates its own task-local snapshot from an
opaque task reference, opaque offering-version correlation, canonical
requirements digest, and explicit expiry. It makes the local payment,
execution, valid-result, failure, and unknown workflow labels closed before a
later durable outcome or revenue-routing boundary is specified.

The local contract is the [M19 paid-task lifecycle](../../../specs/m19-paid-task-lifecycle.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M19 paid-task lifecycle plan](../../../superpowers/plans/2026-09-07-m19-paid-task-lifecycle.md).

This card does not reuse the offering-purchase quote, parse a payment
semantically, validate a price/recipient/asset/network/result, create a
payment attempt, verify settlement/finality/receipt, deduplicate durable
records, persist a task, or submit a split. It creates no funding, allocation,
ATS, account, wallet, signer, transaction, clearing, refund, HCS, payout,
deployment, or live claim.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before any RED test or code change.
- M17-T010 remains accepted locally. Its canonical requirements digest
  materially supplies this card's only pure input.
- M18-T010 is accepted and no active card owns the proposed Core paths. The
  card remains disjoint from the funding-purchase lifecycle, RiskScan, backend,
  Agent, and Web paths.
- The contract records its own task snapshot, exact legal table, explicit
  expiry, full-object requirements drift, identity/immutability, successful
  source consumption, rejected-source preservation, reentrant/concurrent
  rejection, terminal unknown behavior, tier, human boundary, and concrete
  validation commands.
- A scoped independent design review is clean before the card enters 10-ready.

## Validation

- A test-only RED commit must precede every production module or barrel-export
  commit for this card. The focused command is
  `node --test packages/core/test/paid-task-lifecycle.test.mjs` from the
  repository root; its initial missing-export failure must be preserved before
  GREEN.
- RED/GREEN tests prove frozen minimal snapshots, canonical expiry,
  full-object requirements drift, every legal edge, execute-before-settlement
  and result-before-execution rejection, skipped/duplicate edges, unknown
  retry rejection, issued-source consumption/non-consumption, structural-copy
  rejection, and reentrant/concurrent rejection.
- A public compile-time fixture proves the state/event surface preserves the
  accepted digest brand.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T23:24:26Z after a fresh source-to-runtime critical-path
rescan following M18 acceptance. The accepted canonical requirements boundary
materially satisfies the smallest missing pure paid-task predecessor. The
rescan deliberately keeps the task snapshot independent from the
funding-purchase quote and leaves durable outcomes, clearing split,
offering schema, generic external attempts, ATS configuration, and live work
to separate dependency-correct cards. This intake authorizes only local
authority records and independent design review; it authorizes neither RED/code
nor any external action.

## Ready transition

Ready at 2026-09-06T23:44:27Z after a fresh post-commit rescan confirmed the
accepted M17 canonical requirements/digest dependency, committed and resolvable
local authority, disjoint proposed Core ownership, corrected clean independent
design review, enabled local boundary, and no human blocker for this pure local
scope. This ready state authorizes only the bounded RED/GREEN contract after
root activation; it does not authorize payment, funding, allocation, ATS,
account, wallet, signer, transaction, settlement, receipt, persistence,
clearing, HCS, payout, deployment, or live behavior.

## Activation

Activated at 2026-09-06T23:45:43Z after a fresh post-ready rescan confirmed
that M19-T010 is the sole ready card, no active card owns its bounded Core
paths, its accepted M17 dependency remains present, and the pending human
action grants no external authority but does not block this pure local work.
This activation authorizes the specified test-only RED commit, subsequent
minimal Core implementation, and verification only; it does not expand
authority to payment, funding, allocation, ATS, account, wallet, signer,
transaction, settlement, receipt, persistence, clearing, HCS, payout,
deployment, or live behavior.
