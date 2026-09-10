# M46-T010 — EntityCheck core contract

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M02-T050 accepted
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `packages/core/src/entity-check.ts`,
  `packages/core/test/entity-check.test.mjs`,
  `packages/core/test/entity-check.types.ts`, and
  `packages/core/src/index.ts` as an export-only amendment under a root
  integration reservation naming that file.
- Human actions: none. This card is pure in-process domain behaviour and
  creates no request, source read, wallet, payment, provider, configuration,
  account, transaction, deployment, or live behaviour.

## Scope

The catalog has one tool, and it sits on the most crowded x402 shelf: token
and tool risk verdicts. The second tool should serve a buyer outside crypto
with sources that need no credential. A company registry record plus a
sanctions screen is what an agent needs before it pays a counterparty, and
at least six live x402 sellers already charge for it.

This card adds the pure core: request validation for one jurisdiction
(`FR`), typed registry candidate and sanctions dataset inputs, the
`found`, `ambiguous`, and `not_found` dispositions, the exact-normalised
sanctions screen with `clear`, `hit`, and `not_screened`, and the baseline
limitation. It fetches nothing and echoes the source descriptors it is given.

The local authority is the
[M46 EntityCheck core contract](../../../specs/m46-entity-check-core.md). It
follows the accepted [RiskScan Quick contract](../../../specs/m02-riskscan-quick.md)
shape: a validator, a pure assessment, closed unions, and no I/O. The four
sibling cards in this batch (M46-T020, M46-T030, M46-T040, S23-T010) depend
on this card in that order.

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change.
- The three new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- `packages/core/src/index.ts` belongs to accepted core records, so the
  export-only amendment needs an explicit root integration reservation
  recorded in the ownership file before the change. The amendment adds only
  the EntityCheck value and type exports and reorders nothing.
- The disposition union, screen union, normalisation rules, five-pair
  ambiguity cap, and baseline limitation are fixed in the specification
  before code.

## Verification

- A durable test-only RED commit precedes every source change and fails only
  because the declared core module does not exist.
- Table-driven tests reject malformed request, candidate, entry, and source
  input and preserve a valid request.
- Focused tests prove `found` by single candidate and by SIREN match,
  `ambiguous` with the exact limitation and the five-pair cap, `not_found`,
  `clear`, `hit` with every match in dataset order, `not_screened`, and the
  exact normalisation of diacritics, punctuation, case, and whitespace.
- Focused tests prove the baseline limitation and the absence of score,
  price, receipt, payment, settlement, evidence-record, and availability
  fields, and that the module imports no I/O, framework, network, or RiskScan
  module.
- The compile-time fixture proves the exported types, following the accepted
  M10 pattern.
- Core and root `npm run typecheck`, `npm run test`, `npm run lint`,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card defines pure local behaviour over supplied records. A `found`
result asserts only that the supplied candidates resolved to one record; a
`clear` screen asserts only that no supplied entry matched exactly. Nothing
here reads a source, claims a live service, a payment, a receipt, or a
compliance opinion.

## Human worktree lane request

- Requested at `2026-09-09T17:20:00Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/entitycheck`, branch `work/entitycheck`, shared by the
  five EntityCheck batch cards as sequential commits in card order.
  Implementer: the operator's delegated session. Reviewer: the root's
  independent task review and module review, unchanged.
- The lane delivers, per card and in this order on that branch: one test-only
  RED commit at the declared test paths, failing only because the declared
  source does not exist or the declared amendment has not been made; then the
  minimal GREEN commits limited to the declared source paths.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, evidence, spec, or manifest file. The root keeps the
  ready review, the activation decision, the independent reviews, the
  integration decision, and every queue record. The branch is mirrored as a
  pull request for human visibility only; nothing from it reaches `main`
outside the root's integration decision.

## Ready record

Ready at 2026-09-09T22:33:30Z after an independent current-head review found
M02-T050 accepted, the full committed local authority resolvable, the three
new paths absent and disjoint, and the no-reorder Core barrel reservation
recorded. A separate activation may authorize only the durable test-only RED
fixtures; the source module and barrel remain prohibited until a fresh RED
review.

## Activation record

Activated at 2026-09-09T22:33:30Z after an independent current-head review
found a clean pushed head, no Core-path conflict, accepted M02-T050, and the
exact targets absent. This activation authorizes only the two declared Core
test fixtures; EntityCheck source, the Core barrel, and every I/O or external
boundary remain prohibited pending a fresh RED review.

## RED acceptance record

Accepted at pushed `f8a42e7` after an independent review found the focused
Node 22.21.1 contract fails exactly once only because the declared
`packages/core/src/entity-check.ts` module is absent; fifteen source-dependent
assertions skip, and the Core typecheck passes. The runtime contract covers
later-index hostile arrays and a returned 513-character sanctions match. Its
gated virtual TypeScript fixture directly imports the named public type-only
exports after GREEN and checks them against the public value signatures and
closed unions.

The follow-up test correction at `f893759` explicitly serves that virtual
fixture through the TypeScript compiler host. It preserves the same
source-absence-only RED outcome and does not alter the GREEN scope.

The further test correction at `ff27d7e` replaces the sanctions-hit fixture's
near-equivalent legal name with one that is exactly equal after the specified
normalisation. It preserves the contract's prohibition on fuzzy or token-based
matching and adds no GREEN path.

Only `packages/core/src/entity-check.ts` and the declared export-only
EntityCheck amendment to `packages/core/src/index.ts` are now authorized. No
I/O, source adapter, API, Directory, UI, package, configuration, payment,
wallet, provider, transaction, deployment, or live behavior is authorized.
