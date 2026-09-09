# M46-T040 — EntityCheck Tool Directory descriptor

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M05-T010 accepted, M06-T010 accepted; M46-T030 (this batch)
  must be accepted before activation, and M45-T010 (in inbox at intake) must
  be accepted before this card's amendments because M45 holds reservations
  over the same directory source and test
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `apps/web/src/lib/entity-check-tool-descriptor.ts`,
  `apps/web/tests/entity-check-tool-descriptor.test.mjs`, and constrained
  amendments under a root integration reservation to
  `apps/web/src/lib/tool-directory.ts` (one import and one array entry) and
  `apps/web/tests/tool-directory-api.test.mjs` (descriptor count and exact
  tool list assertions only). No package manifest, lockfile, or dependency
  change is proposed.
- Human actions: none. Discovery is static metadata plus a fail-closed
  configuration summary; it authorises no publication, payment, provider,
  wallet, account, transaction, deployment, or live claim.

## Scope

An agent finds tools through `GET /api/tools`. Once `POST /api/entitycheck`
exists it must be discoverable the same way RiskScan is, with the same input
schema, limitation, and configuration summary conventions, or agents cannot
call it without out-of-band knowledge.

This card adds one descriptor module for `entitycheck.fr` and mounts it as
the second entry of the accepted directory. The RiskScan descriptor, the
version literal, the route, and the M45 active view are unchanged.

The local authority is the
[M46 EntityCheck Tool Directory descriptor contract](../../../specs/m46-entity-check-tool-directory.md).
The accepted shape it extends is the
[M05 Tool Directory contract](../../../specs/m05-riskscan-tool-directory.md),
as amended by the [M45 active directory version](../../../specs/m45-active-directory-version.md).

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change.
- The two new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- `apps/web/src/lib/tool-directory.ts` and
  `apps/web/tests/tool-directory-api.test.mjs` belong to the accepted
  M05-T010 and M06-T010 records and carry M45-T010 reservations at intake,
  so this card's amendments need their own explicit root integration
  reservation, sequenced after M45-T010 is accepted, and apply to the files as
  M45 leaves them.
- M46-T030 is accepted so the `ENTITYCHECK_X402` parser exists.

## Verification

- A durable test-only RED commit precedes every source change and fails only
  because the descriptor module does not exist and the directory still lists
  one tool.
- Focused tests prove the exact EntityCheck descriptor, its fail-closed
  configuration summary for missing or malformed `ENTITYCHECK_X402` values,
  and that no private value is serialised.
- The amended directory tests prove two descriptors in fixed order, an
  unchanged RiskScan descriptor, an unchanged M45 view, and a build without
  network, clock, or random calls.
- Web typecheck, test, and production build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card publishes static metadata about a local route. It proves no
configured runtime, recipient, facilitator, source reachability, or live
availability, and registers nothing outside this repository.

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
