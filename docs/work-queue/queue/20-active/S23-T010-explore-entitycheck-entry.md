# S23-T010 — Explore EntityCheck entry and detail route

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: S20-T010 accepted, M02-T070 accepted, M14-T010 accepted,
  M46-T040 accepted, and B03-T020 accepted. M46-T040 is the implementation
  boundary that makes the detail page's route/descriptor copy truthful; B03
  acceptance satisfies the recorded EntityCheck sequencing request.
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
  `apps/web/tests/route-loading-skeletons.test.mjs`. The shared
  `apps/web/tests/landing-explore.test.mjs` is deliberately excluded: S22/S31
  currently own its active shared assertions and S23 needs no amendment.
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
  S20-T010 record and `route-loading-skeletons.test.mjs` to M14-T010; each
  amendment needs an explicit root integration reservation before source
  changes, and the root sequences this card's amendments after any sibling
  amendment to the same file. `landing-explore.test.mjs` remains outside S23
  because its active shared assertions belong to S22/S31.
- The catalog entry, rail rows, card copy, and detail regions are fixed in
  the manifest before code, so no entry, figure, or control can be added while
  the slice is built.

## Ready authority

The independent review at clean
`f742e5e583021dad42dbed478fa3399ccc93fcd4` is clear once its missing ledger
and ownership records are committed by the root: every dependency is accepted,
the existing EntityCheck descriptor/API supports the fixed descriptive copy,
the five new targets are absent/disjoint, and the focused Explore/loading/
navigation baseline passes 10/10 alongside Web typecheck and queue validation.
That review moved the card to `10-ready`; the subsequent independent activation
below controls the only test paths that may now change.

## RED authorization

The independent activation review at pushed
`32f11eedc30e5d2ba06ac5cde6ff66a1f8a4d4e1` is clear. D-S23-010-002 permits
only `apps/web/tests/explore-catalog.test.mjs`,
`apps/web/tests/route-loading-skeletons.test.mjs`, and new
`apps/web/tests/entitycheck-detail.test.mjs` to define durable RED. Every
source path remains prohibited until a fresh independent RED review accepts
exact minimal GREEN.

## GREEN authorization

The independent exact-head RED review at
`ce217576051dec17a63aac5b973f1a04a3a59a34` is clear: it observed exactly the
three declared absent-source failures and two source-dependent skips, with no
S23 source change, no S22/S31 shared-test collision, and M48 disjoint. Only
the UI-S23 local targets and their three matching RED test paths may now enter
minimal GREEN. All exclusions remain unchanged.

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

## Execution-lane boundary

- The historic remote `work/entitycheck` branch is stale and unreviewed; it is
  not authority for S23. This ready control record creates no new worktree or
  branch. A later activation records the approved implementation lane.
- Any later lane delivers a test-only RED commit first, failing only because
  the declared source is absent or the declared amendment has not been made;
  only a subsequent independent RED acceptance may permit minimal GREEN.
