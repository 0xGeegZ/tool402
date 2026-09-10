# S25-T010 — Shared page header, action buttons, and Campaign label

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T010 accepted, M02-T070 accepted, M02-T080 accepted,
  M08-T010 accepted, M11-T020 accepted, M13-T010 accepted, M14-T010 accepted,
  M15-T010 accepted, S11-T010 accepted, S16-T010 accepted, S17-T010 accepted;
  S22-T010, S24-T010, S31-T010, and S32-T010 accepted.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S25 local targets: new
  `apps/web/src/components/ui/page-header.tsx` and
  `apps/web/tests/page-header.test.mjs`; and, each under a root integration
  reservation, the header blocks of the nine routed `page.tsx` files and the
  two component headers named in the manifest, the `/provider` label in
  `apps/web/src/components/discovery/local-navigation.tsx`, the outcome
  sentences in
  `apps/web/src/components/provider/status/provider-status.tsx`, and the
  header, label, and copy assertions of the accepted tests the manifest
  lists.
- Human actions: none. This presentation change creates no wallet, payment,
  provider, configuration, account, transaction, deployment, or live
  behaviour.

## Scope

Nine routed pages and two page-level components each hand-write the same
header: a heading with one shared class string copied eleven times, a
description, and, on some, a kicker that is a `Badge` on one page and an
uppercase paragraph on another. Page actions are underlined text on
`/provider` and two other link styles elsewhere, while the accepted UI-S00
button primitive already exposes `buttonVariants` for links. The navigation
label `Provider` names a role the page never explains, and the `/provider`
regions print bare outcome tokens such as `absent.` with no sentence.

This card introduces one `PageHeader` primitive, migrates every listed header
to it, renders `/provider`'s two accepted local links as primary and outline
buttons, renames the navigation entry and page to `Campaign` while keeping the
`/provider` path, and fixes the four outcome sentences. It reads no new data
and adds no control. It does not list campaigns: `/provider` still reads the
single accepted offering id, and an issuer-scoped campaign list needs a
separate backend read card.

The local contract is the
[UI-S25 page header manifest](../../../ui/UI-S25.md). The accepted slices it
builds on are the [UI-S00 manifest](../../../ui/UI-S00.md) and the
[UI-S17 manifest](../../../ui/UI-S17.md), recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The two new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- Every amended path belongs to an accepted record named in the manifest;
  each amendment needs an explicit root integration reservation before source
  changes, limited to the header block, the one navigation label, the outcome
  sentences, or one named test assertion. The reconciled manifest names every
  exact test path and declares all other tests verification-only.
- The primitive's anatomy, the per-page eyebrow and action lists, the
  navigation label, and the four outcome sentences are fixed in the manifest
  before code, so no figure, control, or link can be added while the slice is
  built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because the primitive does not exist, every page still hand-writes its
  header, the navigation label is `For providers`, and `/provider` still renders
  bare tokens.
- Focused tests prove the primitive's fixed anatomy, primary-then-outline
  action styling, three-action cap, and that every listed page and component
  mounts `PageHeader` with no raw `h1` and no `underline` link class.
- The amended accepted tests pass with only their header, label, and copy
  assertions changed; every other assertion is untouched.
- Web typecheck, test, lint, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Desktop and 390px browser checks on `/provider` and `/explore` show one
  `main`, one `h1`, the eyebrow, wrapped action buttons, visible keyboard
  focus, and no horizontal overflow.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation only. It adds no data source, request, state,
route, redirect, external link, or economic claim, and it does not alter the
landing hero, the navigation order or hrefs, the wizard state machine, the
`/provider` reader, or the API routes. The manifest's exclusions govern; this
card does not restate them.

## Human worktree lane request

- Requested at `2026-09-10T14:10:00Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/page-header`, branch `work/page-header`. Implementer:
  the operator's delegated session. Reviewer: the root's independent task
  review and module review, unchanged.
- The lane delivers, in this order on that branch: one test-only RED commit at
  the declared test paths, failing only because the declared source does not
  exist or the declared amendment has not been made; then the minimal GREEN
  commits limited to the declared source paths.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, evidence, spec, or manifest file. The root keeps the
  ready review, the activation decision, the independent reviews, the
  integration decision, and every queue record. The branch is mirrored as a
  pull request for human visibility only; nothing from it reaches `main`
  outside the root's integration decision.
