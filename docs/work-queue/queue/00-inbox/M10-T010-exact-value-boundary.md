# M10-T010 — Exact value boundary

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T020 accepted
- Owner: `packages/core/src/value.ts`, `packages/core/src/index.ts`, and
  `packages/core/test/value.test.mjs` are this card's implementation paths.
  The root owns this card, local specification/import ledger, plan, queue
  state, catalog, ownership, decisions, reviews, integration evidence, and
  pushes.
- Human actions: none for the pure local boundary.

## Scope

Create exact branded integer value and canonical identifier parsers in the
pure core package. The task makes later economic and network-facing work safe
to specify without accepting a lossy numeric representation. It does not
create an offering, quote, account configuration, payment client, signer,
wallet, request, transaction, settlement, external lookup, persistence,
deployment, or live claim.

The local contract is [M10 exact value boundary](../../../specs/m10-exact-value-boundary.md),
the neutral import record is [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M10 exact value plan](../../../superpowers/plans/2026-09-06-m10-exact-value-boundary.md).

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before a RED test or code change.
- M01-T020 remains accepted locally and no active card owns the listed core
  paths.
- The card records canonical input rules, lossless representation, tier,
  explicit exclusions, human boundary, and concrete validation commands.

## Validation

- RED/GREEN tests prove public export, canonical parsing, large-integer
  preservation, and malformed-input rejection.
- Core/root quality, queue/reference/whitespace checks, enabled local guard,
  independent task review, and two fresh clean module-review generations pass
  before acceptance.

## Inbox transition

Recorded at 2026-09-06T10:16:37Z after a fresh post-M09 rescan found the
accepted core foundation, no active core owner, and an unfilled exact-value
contract needed before later economic work. This inbox card authorizes only
the local contract/plan record; it authorizes neither RED/code nor any
external action.
