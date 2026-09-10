# M46-T020 — EntityCheck source adapters

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted, M02-T050 accepted; M46-T010 (this batch)
  must be accepted before activation because this card maps into its types
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `apps/web/src/lib/entity-check-sources.ts` and
  `apps/web/tests/entity-check-sources.test.mjs`. No package manifest,
  lockfile, or dependency change is proposed.
- Human actions: none for local delivery. Both sources are public and need no
  credential. One human-authorised live read against both sources is
  requested as a new pending row `HA-ENTITYCHECK-LIVE-001`, recorded by the
  root; this card neither requires nor marks it complete, and every test uses
  an injected fetch.

## Scope

The core assesses already-fetched records. This card adds the one server-only
reader that fetches them: one bounded search against the French
`recherche-entreprises` open API and one bounded read of the OFAC SDN CSV,
mapped into the core candidate and dataset types with the source descriptors
the core echoes. The SDN dataset is parsed once and cached in memory for at
most 24 hours; every result cites the descriptor of the dataset actually used.

The local authority is the
[M46 EntityCheck source adapters contract](../../../specs/m46-entity-check-sources.md).
It reads the types of the
[M46 core contract](../../../specs/m46-entity-check-core.md) and follows the
bounded-reader rules of the accepted
[M45 active directory version](../../../specs/m45-active-directory-version.md):
fixed base URL from configuration, timeout, byte cap, injected fetch and
clock, and no upstream detail in a failure outcome.

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change.
- The two new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- M46-T010 is accepted so the mapped types exist.
- The exact registry field mapping and the SDN column mapping are pinned by
  recorded fixtures in the durable RED contract rather than asserted from
  memory; the fixtures are redacted excerpts of public responses observed on
  2026-09-09.

## Ready record

Ready at 2026-09-10T00:41:00Z after an independent current-head review at
`1ce6bb4030ad36c55cb28d87466e98f30f622e3c` found M01-T040, M02-T050, and
M46-T010 accepted; the committed card, specification, catalog, ownership,
State, and human-action records resolvable; and the two declared Web paths
absent and disjoint. `HA-ENTITYCHECK-LIVE-001` is explicitly optional future
evidence and does not block the injected-fetch local delivery. A separate
activation may authorize only the durable test-only RED contract; the source
adapter and every source read remain prohibited pending RED acceptance.

## Activation record

Activated at 2026-09-10T04:53:21Z after an independent current-head review at
`0223f7b8a787e0a903b00d3c958674d3f39ae082` found the ready authority intact,
M01-T040, M02-T050, and M46-T010 accepted, the declared source/test paths
absent and disjoint, and no active-path collision. This activation authorizes
only `apps/web/tests/entity-check-sources.test.mjs` as a durable test-only RED
contract. The source adapter, configuration, every source read, and every
payment, wallet, provider, transaction, deployment, or live path remain
prohibited pending RED acceptance.

## RED acceptance record

The independent RED review at clean pushed
`860eab43e2a1c5e6487b86c24b1d823565d8ca76` is clear. Under Node 22.21.1,
the focused contract fails exactly once because the declared adapter is absent,
with twelve source-dependent assertions skipped and no incidental failure. The
fixture covers configuration, injected dependencies, bounded public-response
parsing, source mappings, closed failures, RFC 4180 parsing, clock validity,
and the exact cache boundary without a live request. Only
`apps/web/src/lib/entity-check-sources.ts` may now enter local GREEN. No
provider, wallet, payment, transaction, deployment, or live source action is
authorized.

## Verification

- A durable test-only RED commit precedes every source change and fails only
  because the declared module does not exist.
- Focused tests prove `null` configuration for each missing or malformed
  value, the `not_configured` outcome with no fetch call, the exact registry
  URL, SIREN-over-query precedence, the field mapping, the drop rules with
  the dropped count, and the timeout, cap, and non-200 outcomes.
- Focused tests prove the CSV column mapping, `-0-` handling, program
  splitting, `Last-Modified` and SHA-256 reporting, the 24 hour cache reuse,
  and that the cache holds no raw body.
- Focused tests prove no default fetch, no environment read outside the
  parser, no log output, and no upstream text in any failure outcome.
- Web and root `npm run typecheck`, `npm run test`, `npm run lint`,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card performs bounded reads of two public sources when a caller supplies
configuration. A `read` outcome asserts only what those responses contained
at that moment. It holds no key, initiates no payment, records nothing
durably, and proves no live availability, ownership, solvency, or compliance
fact.

## Acceptance record

Accepted at 2026-09-10T05:38:30Z at source commit
`b8843b03fa0cd5452445ae7b90aaa496757a8bd4` after fresh independent task,
module/security, and test reviews. The focused M46 contract passed 13/13; the
complete Core and Backend suites passed 152/152 and 275/275. Root typecheck,
lint, queue validation, whitespace validation, and the enabled local-reference
guard passed under Node 22.21.1. The equivalent Webpack production build
completed; it retains the known optional dependency warning in the existing
RiskScan x402 import trace. The complete Web/root suite has only the two
separately blocked M44 source-absence RED failures (222 passed, 2 failed, 19
skipped); no M46 assertion failed. The final correction rejects an
extended-year injected clock before any fetch so a Core-invalid source
descriptor cannot be returned. This acceptance adds no configuration value,
live source read, payment, wallet, provider, transaction, deployment, or
other external authority.

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
