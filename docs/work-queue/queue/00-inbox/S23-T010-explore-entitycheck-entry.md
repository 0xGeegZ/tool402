# S23-T010 — Explore EntityCheck entry and detail route

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S20-T010 accepted, M02-T070 accepted, M14-T010 accepted;
  M46-T040 (this batch) must be accepted before activation so the detail
  page describes an existing route and descriptor
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S23 local targets:
  `apps/web/src/components/discovery/entitycheck-discovery-card.tsx`,
  `apps/web/src/app/explore/entitycheck/page.tsx`,
  `apps/web/src/app/explore/entitycheck/loading.tsx`,
  `apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`,
  `apps/web/tests/entitycheck-detail.test.mjs`, and constrained amendments
  under a root integration reservation to
  `apps/web/src/components/discovery/explore-catalog.tsx`,
  `apps/web/tests/explore-catalog.test.mjs`,
  `apps/web/tests/route-loading-skeletons.test.mjs`, and, only if its
  Explore href assertions constrain the page,
  `apps/web/tests/landing-explore.test.mjs`.
- Human actions: none. This presentation change creates no wallet, payment,
  provider, configuration, account, transaction, deployment, or live
  behaviour.

## Scope

The accepted catalog holds one real tool and one truthful empty-state tile.
Once the EntityCheck route and descriptor are accepted, the catalog should
show it: a second frozen entry, a second card, a second category row in the
static rail, and one descriptive detail route in the accepted UI-S02 pattern.
The rail stays static; a second entry is what makes a later interactive
filter card meaningful, but that card is not this one.

The local contract is the
[UI-S23 Explore EntityCheck entry manifest](../../../ui/UI-S23.md). The
accepted slices it builds on are the
[UI-S20 manifest](../../../ui/UI-S20.md) and the
[UI-S02 manifest](../../../ui/UI-S02.md), recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The five new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- `explore-catalog.tsx` and `explore-catalog.test.mjs` belong to the accepted
  S20-T010 record, `route-loading-skeletons.test.mjs` to M14-T010, and
  `landing-explore.test.mjs` to M02-T040 with S17-T010 declaring a
  navigation-assertion amendment at intake; each amendment needs an explicit
  root integration reservation before source changes, and the root sequences
  this card's amendments after any sibling amendment to the same file.
- The catalog entry, rail rows, card copy, and detail regions are fixed in
  the manifest before code, so no entry, figure, or control can be added while
  the slice is built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because the card, route, and detail component do not exist and the catalog
  still holds one entry.
- Focused tests prove the two-entry catalog with the fixed fields, the exact
  rail rows, no interactive element, the only page hrefs being
  `/explore/riskscan`, `/explore/entitycheck`, and the accepted navigation
  entries, and the unchanged empty-state tile.
- Focused tests prove the detail page's fixed regions, one `main`, one
  `h1`, no form, fetch, client component, price, or external link, and the
  exact baseline limitation text.
- The accepted landing, navigation, UI-S01 truthfulness, and loading-skeleton
  assertions pass after their constrained amendments.
- Web typecheck, test, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Desktop and narrow browser checks show the three-tile grid, the stacked
  rail, one main landmark, one `h1`, visible keyboard focus on both card
  links, and no horizontal overflow.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation only. It adds no data source, request, state,
or economic claim, and it does not alter the Directory island, the guest
workbench, the RiskScan detail route, navigation, or the API routes. The
manifest's exclusions govern; this card does not restate them.

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
