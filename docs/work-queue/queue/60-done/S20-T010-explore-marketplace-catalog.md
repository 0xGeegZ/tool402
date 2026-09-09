# S20-T010 — Explore marketplace catalog

## State

- Tier: POLISH
- Queue state: 60-done
- Dependencies: M02-T040 accepted; M02-T070 accepted; M09-T010 accepted;
  M11-T020 accepted; M14-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. The source/test paths are exactly
  the UI-S20 local targets. The accepted Explore page, discovery card,
  landing/Explore test, and directory-discovery test are narrow root
  integration reservations only.
- Human actions: none. This presentation change creates no wallet, payment,
  provider, configuration, account, transaction, deployment, or live
  behavior.

## Activation

At pushed `bb937a7`, an independent activation review found a free Web
implementation lane, accepted predecessors, recorded root reservations, and
disjoint targets. This card is active only to create its durable test-only RED
contract in these existing test paths:

```text
apps/web/tests/explore-catalog.test.mjs
apps/web/tests/landing-explore.test.mjs
apps/web/tests/riskscan-directory-discovery.test.mjs
```

The Explore page, discovery card, catalog component, Directory island, guest
workbench, navigation, and every external or durable capability remain
prohibited until an independent RED review is clear.

## Scope

The product brief describes Tool402 as a marketplace-shaped experience, but
the accepted `/explore` route renders one card and one developer inspection
island stacked in a half-width column. It does not read as a catalog, and the
directory island is a RiskScan-specific inspection that the accepted guest
workbench already mounts as its first step.

Reshape `/explore` into a catalog: a heading block, a static filter rail with
counts derived from a frozen local catalog constant, and a tool card grid
holding the accepted RiskScan discovery card in a tool card anatomy plus one
truthful empty-state tile. Remove the directory island mount from `/explore`;
the island stays on `/dashboard/riskscan` unchanged. No second tool, mock
product, price, network, or control that implies an unavailable action is
added.

The local contract is the
[UI-S20 Explore marketplace catalog manifest](../../../ui/UI-S20.md). The
accepted slices it builds on are recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md), the
[UI-S01 manifest](../../../ui/UI-S01.md), the
[UI-S05 manifest](../../../ui/UI-S05.md), and the
[M09 contract](../../../specs/m09-native-directory-discovery.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are committed
  before any source change.
- The new component and new focused test are new files, disjoint from every
  accepted card's owned paths and from every sibling card in the inbox.
- `apps/web/src/app/explore/page.tsx`,
  `apps/web/src/components/discovery/riskscan-discovery-card.tsx`,
  `apps/web/tests/landing-explore.test.mjs`, and
  `apps/web/tests/riskscan-directory-discovery.test.mjs` belong to the
  accepted M02-T040, M02-T070, and M09-T010 records, so the amendments need
  an explicit root integration reservation recorded in the ownership file
  before source changes. At intake the inbox S17-T010 card declares a
  constrained navigation-assertion amendment to `landing-explore.test.mjs`;
  this card's amendment touches only that file's Explore and island
  assertions, and the root sequences the two amendments so each applies to
  the file as the other leaves it.
- The root records one amending sentence on the M09 contract and one on the
  UI-S05 manifest naming the guest workbench as the island's accepted mount.
- The catalog constant, rail groups, copy, card anatomy, and empty-state tile
  are fixed in the manifest before code, so no entry, figure, or control can
  be added while the slice is built.

## Verification

- A durable test-only RED commit precedes every source change.
- Focused tests prove the Explore page remains a server component, mounts the
  catalog component and the discovery card, and does not mount the directory
  island; the guest workbench still mounts the island; the catalog constant
  has exactly one entry with the fixed fields; the rail renders no zero-count
  row and no interactive element; the only page hrefs are `/explore/riskscan`
  and the accepted navigation entries; and the empty-state tile has no link
  or control.
- The accepted landing, navigation, UI-S01 truthfulness, and remaining
  directory-island assertions pass unchanged.
- Web and root typecheck, test, lint, build, `npm run queue:check`, and the
  enabled local-reference guard pass.
- Browser evidence covers the desktop two-column catalog, the narrow stacked
  layout, one main landmark, one `h1`, visible keyboard focus on the card
  link, and no horizontal overflow.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation and one mount point. It adds no tool, data
source, request, state, or economic claim, and it does not alter the
directory island, the guest workbench, the RiskScan detail route, or
navigation. The manifest's exclusions govern; this card does not restate
them.

## Human worktree lane request

- Requested at `2026-09-09T03:10:25Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/s20`, branch `work/s20`, pushed to `origin/work/s20`.
  Implementer: the operator's delegated session. Reviewer: the root's
  independent task review and module review, unchanged.
- The lane delivers, in this commit order on that branch: one test-only RED
  commit adding the new focused test and the two constrained test amendments,
  failing only because the catalog component does not exist and the Explore
  page still mounts the island; then the minimal GREEN commits limited to the
  three declared source paths.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, evidence, spec, or manifest file. The root keeps
  the ready review, the activation decision, the independent reviews, the
  integration decision, and every queue record. The branch is mirrored as a
  pull request for human visibility only; nothing from it reaches `main`
outside the root's integration decision.

## Acceptance

At source `746bf87`, the focused S20 tests passed 12/12 and the complete Web
suite passed 179/179 under Node 22.21.1. Web/root typecheck, root test/lint,
queue/reference/whitespace/Git-guard checks, equivalent Webpack production
build, Next diagnostics, desktop/mobile browser checks, and independent task
and module reviews are clear. The local host's standalone Turbopack build is
blocked by its CSS-helper port bind; this does not change the verified source
or grant deployment evidence. S20 is accepted as static presentation only.
