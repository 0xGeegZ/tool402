# M16-T010 — Offering terms and revenue math

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M10-T010 accepted
- Owner: `packages/core/src/offering-economics.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/offering-economics.test.mjs`, and
  `packages/core/test/offering-economics.types.ts` are this card's
  implementation paths. The root owns this card, local specification/import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, and pushes.
- Human actions: none for the pure local economics boundary. The pending live
  payment action remains separate and does not block this card.

## Scope

Create the smallest dependency-correct pure Core contract for immutable
versioned offering terms, exact purchase quote/capacity math, remaining payout
capacity, and the approved capped 80/20 reserve/operator clearing split. It
uses only the accepted exact-value boundary and explicit caller-supplied
lifecycle facts; it does not create or validate any external fact.

The local contract is [M16 offering terms and revenue math](../../../specs/m16-offering-terms-and-revenue-math.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M16 offering terms and revenue math plan](../../../superpowers/plans/2026-09-06-m16-offering-terms-and-revenue-math.md).

This card intentionally precedes the ATS boundary: that later capability still
requires a dependency-correct offering schema and generic external-attempt
model. It also precedes any clearing adapter because no verified payment,
versioned account plan, or human authorization exists here.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before a RED test or code change.
- M10-T010 remains accepted locally. Its canonical parsers materially satisfy
  this card's exact-value prerequisite; its excluded offering semantics remain
  owned by this card.
- No active card owns the proposed Core paths, and the proposed public API
  remains disjoint from accepted RiskScan lifecycle, native quote, backend,
  Agent, and Web paths.
- The card records exact value/capacity/share rules, no-default behavior,
  explicit maturity fact, tier, human boundary, and concrete validation
  commands.
- The delivery excludes ATS SDK/configuration, offering publication, account
  or asset configuration, wallets, signers, keys, funding/payment/transfer
  activity, transaction/settlement/receipt handling, persistence, HCS,
  deployment, and live claims.
- A scoped independent re-review of the amended local contract and plan is
  clean: no Critical, Important, or Minor finding remains.

## Validation

- RED/GREEN tests prove public exports, exact valid allocation/split vectors,
  floor rounding, cap remainder, maturity, capacity, version, and invalid
  terms behavior. The focused command is
  `node --test packages/core/test/offering-economics.test.mjs` from the
  repository root.
- A public compile-time fixture proves branded monetary/unit/BPS separation.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T16:55:49Z after a source-to-runtime critical-path
rescan confirmed that the accepted M10 exact-value boundary satisfies the
smallest pure economics prerequisite, while the ATS boundary still lacks its
separate offering-schema and generic external-attempt prerequisites. This card
authorizes only local contract/plan records and independent design review; it
authorizes neither RED/code nor an ATS, payment, funding, allocation, clearing,
HCS, account, wallet, signer, transaction, deployment, or live action.

## Design review correction

Independent readiness review found that the planned split result left its
capacity timing ambiguous and that the original focused test command selected
the whole existing Core suite. The contract now exposes capacity only through
`remainingPayoutCapacity`, derived from prior verified cumulative credits, and
explicitly defines allocation capacity after the requested units. The plan and
card use the direct focused Node test command. A scoped re-review completed at
2026-09-06T17:09:07Z and found no remaining Critical, Important, or Minor
issue. Once these local authority records are committed, the root may move the
card to 10-ready; that move still does not authorize RED/code until activation.

## Ready transition

Ready at 2026-09-06T17:10:48Z after a fresh post-commit rescan confirmed the
accepted M10-T010 dependency, resolvable local authority records, disjoint
proposed Core paths, no active-card conflict, and no human blocker for the
pure local scope. The independent re-review is clean and the public terms/math
contract has concrete direct RED/GREEN validation. This ready state authorizes
only the bounded local RED/GREEN economics contract after root activation; it
does not authorize ATS, payment, funding, allocation, clearing, HCS, account,
wallet, signer, transaction, deployment, or live behavior.

## Activation

Activated at 2026-09-06T17:12:56Z after a post-ready rescan confirmed that
M16-T010 is the sole ready card, no active card owns its bounded Core paths,
and the pending human action grants no external authority but does not block
this pure local work. This activation authorizes the specified Core RED/GREEN
implementation and verification only; it does not expand authority to ATS,
payment, funding, allocation, clearing, HCS, account, wallet, signer,
transaction, deployment, or live behavior.

## Acceptance

Accepted at 2026-09-06T17:42:45Z after a fresh queue rescan confirmed the
accepted M10-T010 dependency, no conflicting active owner, and no human
blocker for this deterministic local scope.

- `MODULE_BASE` is `d7d7db238a21b52a2b7d98ee8d17f165dde87a06`; `MODULE_HEAD`
  is `80d5d14c7b57bf35b9d028413476c554222e9c04`. The focused public contract
  observed its intended missing-export RED before the bounded Core module and
  public export made all six focused tests GREEN.
- Under Node 22.21.1, the focused suite, Core typecheck, all 39 Core tests,
  Core boundary lint, root typecheck/test/lint, clean-install dry run,
  queue check, range whitespace check, enabled local guard, and local
  reference check passed.
- Independent task reviews found and then cleanly re-reviewed two RED-test
  gaps: an uncapped fractional floor-rounding vector and direct brand checks
  on constructed terms/allocation values. The implementation task review
  found no Critical, Important, or Minor issue. Two consecutive fresh module
  review generations were clean on both standards and specification axes.

Acceptance covers pure, caller-supplied local economics only. It provides no
ATS, offering publication, account/asset, wallet, signer, payment, funding,
allocation, clearing, transaction, settlement, receipt, persistence, HCS,
deployment, or live evidence or authority.
