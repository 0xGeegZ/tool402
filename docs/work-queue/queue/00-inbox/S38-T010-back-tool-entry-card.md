# S38-T010 — Back this tool entry card

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: M02-T070 accepted, S23-T010 accepted, S25-T010 accepted,
  S18-T010 accepted. S39-T010 is a sibling in this batch and neither card
  blocks the other: they share no path.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S38 local targets: new
  `apps/web/src/components/backing/back-tool-card.tsx` and
  `apps/web/tests/back-tool-card.test.mjs`; and, each under a root
  integration reservation, the aside block of
  `apps/web/src/components/riskscan/detail/riskscan-detail.tsx` and the aside
  block of `apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`.
- Human actions: none. This change creates no authority, wallet permission,
  payment, provider, configuration, account, transaction, deployment, or live
  behaviour. It adds one internal link to a route that already exists.

## Scope

The accepted backer funding route at `/explore/riskscan/back` is reachable by
its address only. UI-S18 recorded that linking it from an accepted surface is
a later decision that owns its own file. This card is that decision: one
`Back this tool` card at the top of the aside on both tool detail pages,
rendered from a projection the page hands it. With no projection, or an
offering that is not `OPEN`, it says so and renders no control. With an
`OPEN` offering it shows four terms tiles and one link to the funding route.

Requested by the human operator on 2026-09-11 as the entry half of the
"make backing a project easy" request. The design canvas that settled the
placement and copy is
https://claude.ai/code/artifact/e48c5878-d745-40ad-9e30-6ccdca5ea9a3
(artboards "RiskScan detail · entry card" and "EntityCheck detail · no
offering"). The canvas's disabled `Back EntityCheck` control does not ship:
the no-offering variant renders text only, because a control that cannot act
is a claim the page cannot back.

The local contract is the
[UI-S38 back this tool entry card manifest](../../../ui/UI-S38.md). The
accepted slices it builds on are the
[UI-S18 backer funding manifest](../../../ui/UI-S18.md), the
[UI-S23 Explore EntityCheck entry manifest](../../../ui/UI-S23.md), and the
[UI-S25 manifest](../../../ui/UI-S25.md), recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md). Its sibling is the
[UI-S39 manifest](../../../ui/UI-S39.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The two new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox, including S39-T010's new paths under
  `apps/web/src/components/backing/`.
- Every amended path belongs to an accepted record named in the manifest;
  each amendment needs an explicit root integration reservation before source
  changes, limited to mounting the card once as the first aside child with
  `projection={null}`.
- The card's props, the `OPEN` gate, every fixed literal in both variants,
  and the rule that the no-offering variant renders no control are fixed in
  the manifest before code, so no fetch, capacity figure, or client behaviour
  can be added while the slice is built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because `back-tool-card.tsx` does not exist and neither aside mounts it.
- Focused tests prove by source scan the accepted state-module imports, the
  `OPEN` gate, both variants' fixed copy, exactly one `href` equal to the
  prop, the absence of `use client`, fetch, form, button, external link, and
  capacity literals, and that each detail component mounts the card once
  first in its aside with `projection={null}`, RiskScan with the back route
  href and EntityCheck without one.
- The accepted `riskscan-detail.test.mjs` and `entitycheck-detail.test.mjs`
  pass unchanged: their scanned file lists exclude the new card file and both
  pages still render only the accepted hrefs.
- Web typecheck, test, lint, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Desktop and 390px browser checks on both detail routes: the card renders
  first in the aside in its no-offering variant and nothing overflows.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation and adds one internal link. It adds no fetch,
client component, form, button, capacity, remaining, raised, funded,
progress, or balance figure, countdown, external link, EntityCheck funding
route, catalog card change, header change, dependency, or change to
`backing-state.ts`, `backing-flow.tsx`, the back page, or the discovery
cards. The manifest's exclusions govern; this card does not restate them.

## Human worktree lane request

- Requested at `2026-09-12T00:00:00Z` by the human operator (repository
  owner) through the operator's delegated session, under the
  explicit-request rule of the [runtime worktree policy](../../WORKTREE-POLICY.md).
  The card's tier, dependencies, declared paths, verification list, and
  boundary are unchanged.
- Worktree `.worktrees/s38`, branch `work/s38`, pushed to `origin/work/s38`.
  Implementer: the human operator's delegated Claude Code session
  (yannick). Reviewer: the root's independent task review and module
  review, unchanged.
- The lane delivers, in this commit order on that branch: the local
  implementation plan (the card itself); one test-only RED commit adding
  exactly the declared focused tests, failing only because the declared
  source paths are absent; the minimal GREEN commits limited to the
  declared source paths; and a delivery pull request marked "root
  integrates; do not merge by hand."
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, or evidence file. The root keeps the ready
  review, the activation decision, the independent reviews, the
  integration decision, and every queue record. The branch is mirrored as
  a pull request for human visibility only; nothing from it reaches `main`
  outside the root's integration decision.
