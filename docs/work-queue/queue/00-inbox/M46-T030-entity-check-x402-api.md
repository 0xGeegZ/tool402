# M46-T030 — x402-protected EntityCheck API

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M02-T060 accepted, M06-T010 accepted; M46-T010 and M46-T020
  (this batch) must be accepted before activation
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `apps/web/src/lib/x402-protected-route.ts`,
  `apps/web/src/lib/entity-check-x402.ts`,
  `apps/web/src/app/api/entitycheck/route.ts`,
  `apps/web/tests/entitycheck-api.test.mjs`, and
  `apps/web/src/lib/riskscan-x402.ts` as a behaviour-preserving extraction
  under a root integration reservation naming that file. The accepted
  `apps/web/tests/riskscan-api.test.mjs` is not amended and must pass
  unchanged. No package manifest, lockfile, or dependency change is proposed.
- Human actions: none for local delivery. Providing a recipient, facilitator,
  funding, signing, deployment, and evidence capture remain human-owned under
  the accepted HA-X402-HEDERA-001 and pending HA-PUBLIC-DEPLOY-001 rows;
  this card requires neither.

## Scope

The accepted x402 protection lives inside a 700-line module keyed to one
route and one environment prefix. A second paid route needs the same
challenge, settlement validation, native Hedera capability check, and handler
cache. Copying the module would double the surface the reviews must hold.

This card extracts that behaviour into one route-agnostic factory,
re-expresses the RiskScan route on top of it with identical exports and
behaviour, and adds `POST /api/entitycheck` under the `ENTITYCHECK_X402`
prefix. The EntityCheck handler fails closed before any challenge when either
x402 or source configuration is absent, returns `400` for malformed input,
returns `503` without settling when a source is unavailable, and settles
only after a `200` result.

The local authority is the
[M46 x402-protected EntityCheck API contract](../../../specs/m46-entity-check-x402-api.md).
The accepted behaviour it preserves is fixed by the
[M02 x402 RiskScan API contract](../../../specs/m02-riskscan-x402-api.md) and
the [M06 Hedera compatibility contract](../../../specs/m06-riskscan-hedera-x402.md).

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change.
- The four new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- `apps/web/src/lib/riskscan-x402.ts` belongs to the accepted M02-T060,
  M03-T030, and M06-T010 records, so the extraction needs an explicit root
  integration reservation recorded in the ownership file before the change.
  The reservation is bounded by the accepted RiskScan API test passing
  unchanged; any RiskScan behaviour change is out of scope.
- M46-T010 and M46-T020 are accepted so the evaluator and reader exist.
- The EntityCheck route registers no settlement observer; durable EntityCheck
  settlement evidence is a separate later card and is named as deferred in
  the specification.

## Verification

- A durable test-only RED commit precedes every source change and fails only
  because the declared factory, route module, and handler do not exist.
- The accepted `riskscan-api.test.mjs` passes unchanged after the extraction.
- Focused tests prove `503` without a payment header for missing x402
  configuration and for missing source configuration; `402` with
  `PAYMENT-REQUIRED` for an unsigned request with no source read; `400` for
  malformed input; `503` for each unavailable source outcome with no
  settlement; and `200` with the core result for a `read` outcome through an
  injected fetch fixture.
- Focused tests prove wrong-network and blank-transaction settlement results
  do not release the result, using the accepted M02 and M06 patterns.
- Focused tests prove the route registers only `POST`, reads
  `process.env` only through the handler entry point, and never calls a live
  facilitator, wallet, network, registry, or sanctions source.
- Web typecheck, test, and production build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Independent task review and two fresh module-review generations report no
  Critical finding, because the card touches the accepted paid boundary.

## Boundary

This card adds one paid route and one shared factory. It commits no
recipient, facilitator, price, key, or payload; fabricates no payment,
receipt, evidence, or transaction; and makes no configuration or source error
look paid. A `200` result asserts only the core assessment of one bounded
read.

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
