# M46-T040 — EntityCheck canonical Tool Directory v2

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M05-T010 accepted, M05-T020 accepted, M06-T010 accepted,
  M45-T010 accepted, and M46-T030 accepted. The canonical-directory migration
  correction recorded in [D-M46-040-001](../../DECISIONS.md) is a required
  local control before a ready review.
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `apps/web/src/lib/entity-check-tool-descriptor.ts`,
  `apps/web/src/lib/tool-directory.ts`, and
  `apps/agent/src/riskscan-tool-directory.ts` under root migration
  reservations; plus only the focused test paths
  `apps/web/tests/entity-check-tool-descriptor.test.mjs`, and
  `apps/web/tests/tool-directory-api.test.mjs`,
  `apps/agent/test/riskscan-tool-directory.test.mjs`,
  `apps/agent/test/riskscan-tool-flow.test.mjs`,
  `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`,
  `apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`,
  `apps/agent/test/riskscan-tool-payment.test.mjs`,
  `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`,
  `apps/web/tests/riskscan-directory-discovery.test.mjs`,
  `apps/web/tests/riskscan-native-quote-compatibility.test.mjs`, and
  `apps/web/tests/riskscan-tool-loop.test.mjs`. No route, active-directory
  reader, UI component, package manifest, lockfile, or dependency path is
  amendable. The `tool-directory-api.test.mjs` reservation includes only the
  canonical tuple assertions and the exact M45 builder-import-vector update
  declared by the local M46 specification; its route, active-view, and no-I/O
  assertions remain unchanged.
- Human actions: none. Discovery is static metadata plus a fail-closed
  configuration summary; it authorises no publication, payment, provider,
  wallet, account, transaction, deployment, or live claim.
- Ready authority: the clear independent review at
  [M46-T040 readiness review](../../evidence/M46-T040-ready-review.md)
  authorises a separate activation only for the durable test-only RED contract
  at the eleven declared test paths. No source path is authorized yet.

## Scope

Tool402 has one canonical Tool Directory at `GET /api/tools`, not two parallel
directories. This card atomically migrates its default response from the
closed one-tool `v1` form to a closed ordered two-tool `v2` form. It migrates
the current RiskScan decoder and every local consumer fixture in the same
reviewed delivery, so no ToolLoop, native quote, payment, or browser inspection
is left expecting the obsolete server form.

The canonical v2 body contains the unchanged RiskScan descriptor first and the
EntityCheck descriptor second. The route remains `GET /api/tools`; no
`/api/tools/v2` route, content negotiation, fallback endpoint, or duplicate
catalog is created. The M45 active-directory view remains its explicitly
separate `?view=active-directory-version` response and is not merged into the
v2 tool list.

The local authority is the
[M46 EntityCheck canonical Tool Directory v2 contract](../../../specs/m46-entity-check-tool-directory.md).
The accepted shape it extends is the
[M05 Tool Directory contract](../../../specs/m05-riskscan-tool-directory.md),
with the [M45 active-directory view](../../../specs/m45-active-directory-version.md)
remaining separate under the scoped M46 amendment.

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change.
- The new descriptor source/test paths are absent. Every existing source/test
  amendment is exactly reserved above, has no active collision, and is
  disjoint from M44-T010's SDK-bundle scope.
- M46-T030 is accepted so the shared `ENTITYCHECK_X402` parser exists; M05,
  M05-T020, and M45 are accepted so the one-tool producer/consumer contract
  being superseded is known exactly.

## Activation review

The independent current-head review at
[M46-T040 activation review](../../evidence/M46-T040-activation-review.md)
is clear. This card is active only to create its durable test-only RED
contract at the eleven declared test paths. The three source paths, route,
active-directory view, UI, package metadata, lockfile, configuration,
source read, payment, wallet/provider, transaction, deployment, and live
paths remain prohibited pending a fresh independent RED acceptance.

## RED review correction

The independent review at
[M46-T040 RED review](../../evidence/M46-T040-red-review.md) found the
delegated `bc1ab6c12fd3b54ade03989898699c49a9489356` test-only diff otherwise
within the declared eleven paths, but incomplete for native-Hedera
configuration failure coverage. This card remains `20-active` only so the
delegated lane may amend
`apps/web/tests/entity-check-tool-descriptor.test.mjs` with missing and
malformed native asset and amount RED cases. No source, route, active view, UI,
package, lockfile, configuration, source-read, payment, wallet/provider,
transaction, deployment, or live path is authorized. A fresh independent RED
review remains required before any GREEN authorization.

## RED acceptance and GREEN scope

The corrected durable RED contract at
`ca1d1bfee99fc53e1844dd52237b73fefd8088f3` is independently clear. It adds
the four required missing/malformed native-Hedera asset and amount cases while
remaining limited to the eleven declared test paths. The focused Node 22.21.1
suite has 43 passes, 37 intended RED failures, and 7 skips; failures are
limited to the absent descriptor source and the unchanged canonical v1
producer/decoder.

This card remains `20-active` and authorizes minimal local GREEN only in:

- `apps/web/src/lib/entity-check-tool-descriptor.ts`;
- `apps/web/src/lib/tool-directory.ts`; and
- `apps/agent/src/riskscan-tool-directory.ts`.

The same eleven declared test paths remain reserved for the corresponding
test-to-GREEN amendments. The route, M45 active-directory view, UI, package
metadata, lockfile, configuration/environment reads, source reads, payment,
wallet/provider, transaction, deployment, and live behavior remain prohibited.

## Verification

- A durable test-only RED commit precedes every source change and fails only
  because the EntityCheck descriptor is absent and the canonical directory and
  decoder still implement the one-tool v1 form.
- Focused tests prove the exact EntityCheck descriptor, its fail-closed
  configuration summary for missing or malformed `ENTITYCHECK_X402` values,
  and that no private value is serialised.
- Focused tests prove the canonical v2 order, unchanged RiskScan descriptor,
  strict rejection of malformed/reordered/extra v2 entries, retained strict
  legacy-v1 decoding only for a valid one-tool legacy response, the unchanged
  M45 view, the exact approved three-import builder vector, and construction
  without network, clock, or random calls.
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
