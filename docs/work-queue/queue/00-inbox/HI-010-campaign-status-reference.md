# HI-010 — Campaign status reference and visual-pass reconciliation

## Purpose

Human intake card. The root's visual pass on `feat/s22-section-fidelity`
(draft PR #39) and three human records on `main` now overlap: the `S26` and
`S27` identifiers are allocated twice, the delivered S25-T010 lane conflicts
with the branch's accepted Provider overview, and the branch's Provider deploy
slice overlaps the human's deploy-stepper card. This card hands the root the
human's Campaign status reference for `/provider`, asks for one ruling per
overlap, and asks that the reference's empty-state panel be catalogued as a
gated successor rather than built now. It authorizes no wallet, SDK,
provider, transaction, deployment, or live action and changes no accepted
card's boundary.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-10
- Owner: root integrator on intake. The decision rows are root-recorded; the
  root owns every card and queue record it creates from this card.
- Human actions: none.

## Observation

- Branch `feat/s22-section-fidelity` (PR #39, head `32f11ee`, based on
  `5407fc3`) records root-owned S26-T010 (ToolLoop visual and dashboard
  terminology, `60-done`), S27-T010 (application shell visual
  reconciliation, `20-active`), S28-T010 (Provider overview visual
  reconciliation, `60-done` per D-S28-010-004; source `591da42`, acceptance
  `93bdd30`), and S29-T010 (Provider deploy visual reconciliation, `60-done`
  per D-S29-010-005; source `7e62d92`, acceptance `d579a23`), and moves
  S23-T010 to `10-ready`. The branch was rebased, so the source hashes its
  own S26, S28, and S29 records cite (`4382af2`, `5352f05`, `dc9f010`) no
  longer resolve. Its visual authority is the ledger alias `PREP-UI-001`.
  None of these records is on `main`.
- `main` (head `a5cfdce`) records, since the PR #47 merge `b7a86f7`
  (2026-09-10T20:04Z), the human's S26-T010 (header wallet control and
  shared session) and S27-T010 (deploy wizard step progress) with
  `docs/ui/UI-S26.md` and `docs/ui/UI-S27.md`. The root's allocation came
  first (S26 card at `fa22448`, 2026-09-10T17:09Z; S27 card at `af83608`,
  17:14Z); the human's PR #47 was opened later, at 19:14Z, and reused the
  numbers without seeing the branch. A dry-run merge of the branch onto `main`
  reports add/add conflicts on both manifests and content conflicts in
  `STATE.md` and `TASK-CATALOG.md`.
- The delivered S25-T010 lane (`work/page-header`, RED `976f2c3`, GREEN
  `700ff9f`, head `9965897`, PR #40) adds one `PageHeader` primitive,
  migrates the listed page headers to it, renames the `/provider` navigation
  entry to `Campaign`, and replaces the bare outcome tokens on `/provider`
  with the UI-S25 sentences. On the branch, the pre-card visual pass
  `64894ac` (2026-09-10T15:59Z), now claimed by the branch's UI-S27
  manifest, replaces the whole navigation list (drops `Home` and
  `Workspace`, adds `How it works`, relabels `/provider` to `For providers`)
  and rewrites the `layout.tsx` header block that the human's S26 reserves
  for the wallet control; S27's GREEN `ea4bcf5` only adjusts that header's
  sizing. The branch's `/provider` header is titled `Provider workspace`
  since `e3c26e5` (16:05Z); S28's `591da42` re-lays it out, changes the
  description, and relabels the primary action `Prepare a tool offering`. A
  dry-run merge of the lane onto the branch conflicts in nine files:
  `apps/web/src/app/explore/page.tsx`,
  `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`,
  `apps/web/src/app/provider/page.tsx`,
  `apps/web/src/components/discovery/local-navigation.tsx`,
  `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`,
  `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`,
  `apps/web/tests/guided-demo-route.test.mjs`,
  `apps/web/tests/landing-explore.test.mjs`, and
  `apps/web/tests/workspace-shell.test.mjs`. No root record on `main` or on
  the branch mentions S25-T010.
- The branch's S29 restyles `StepProgress` in `provider-deploy-wizard.tsx`
  (wrapper styling; the step label is hidden below `sm` and keeps
  `truncate`) and leaves the caption placement, the `N / 5` badge, the
  `title` attribute, and the step-3 label unchanged. The human's S27 (UI-S27
  on `main`) targets that same function, the caption placement, and the
  badge against the same `PREP-UI-001` direction, and requires no truncated
  label at 390px, which the branch's hidden-label rule contradicts.
- The human's Campaign status reference is committed at
  [HI-010-campaign-status-reference.md](../../evidence/HI-010-campaign-status-reference.md).
  It is the `Campaign · initial state, nothing admitted yet` artboard: the
  UI-S25 page header, one dashed `No campaign yet` panel with a four-step
  list, then the accepted UI-S17 regions in order (the ribbon as two badges
  reading `No offering` and `No directory version`; `Next action`,
  `Deployment evidence`, and `Active terms` carrying the UI-S25 absent
  sentence plus one added sentence; `Active directory` and `Signer`
  carrying the sentence alone), and the three record cards in one row. It
  adopts none of the tiles UI-S17 declines. Steps 3 and 4 of its list
  describe the MetaMask `deployBond` transaction and the Directory
  publication, which no accepted source path can run: `AtsCreateAction` is
  disabled, `ATS_CREATE` receipt verification returns `NOT_CONFIGURED` so no
  offering reaches `READY`, the Directory record literal carries no clearing
  account, and the backer funding route (S18-T010) that the step-4 sentence
  `Backers can now fund units.` assumes is still in the inbox.

## Requested sequence

1. Rule on the identifier collision. The human's preference: keep the
   branch's S26/S27 as recorded and re-identify the human's two cards and
   manifests to the next free numbers at integration, with no change to
   their text beyond the identifier and its cross-references. If the root
   prefers the human to renumber on `main` first, say so in the decision row
   and the human does it in one docs pull request.
2. Rule on the human's S27 (deploy wizard step progress) against the accepted
   S29. The human's preference: S27 keeps its full contract, is sequenced
   after S29, and names the branch's hidden-label rule as the conflict it
   resolves; narrow it only if the root finds part of it already done. Rule
   on the human's S26 (header wallet control) against the branch's S27
   shell: keep it sequenced after S27 with its `layout.tsx` header
   reservation retargeted to the S27 header block.
3. Take the S25 lane as input to the Provider overview, not as a competing
   rewrite: adopt the `PageHeader` primitive and its focused test, the
   `Tool operator` / `Campaign status` header copy and description, the two
   UI-S25 actions (`Open the deploy wizard` primary, `Explore RiskScan`
   outline) in place of S28's `Prepare a tool offering` label, and the four
   outcome sentences, on top of S28's accepted composition and under the
   committed UI-S25 manifest. Integrate as fresh root commits on the branch,
   as the root did for earlier lanes; `work/page-header` is not rebased or
   force-pushed. The navigation label is the root's call; the human's
   preference is `Campaign`, as UI-S25 and the reference record. Nothing
   else in the reference's shell row is requested; the branch's S27 owns the
   shell. In this integration the ribbon keeps the UI-S25 sentence; the
   reference's two ribbon badges belong to item 4.
4. Catalogue one successor slice for the reference's empty-state panel,
   ribbon badges, and three-card row on `/provider`. Its ready gate is the
   root's truthfulness rule: the slice becomes ready only when every step in
   the panel names a path the accepted source can run. The human expects
   that to require at least the HI-009 transaction-execution successor,
   positive `ATS_CREATE` receipt verification, an accepted Directory
   clearing account, and S18-T010 for the step-4 sentence; the root may
   instead require the step copy to be cut to what is accepted at the time.
   Until then the panel is not built and the page keeps the UI-S25
   `No admitted record exists yet.` sentences.
5. Position in the working order is the root's call. The human's preference:
   items 1 and 2 with the PR #39 integration, because the root meets those
   conflicts there anyway; item 3 immediately after; item 4 when its gate is
   met; and none of them ahead of the Stage B successors.

## Requested root records

1. One decision row per item 1 to 4 of the requested sequence; item 5 needs
   no row of its own.
2. The successor card for item 4 with its gate.
3. No change to any human-action row.

## Explicit non-authorizations

This card authorizes no configuration bridge, durable attempt, Convex
publication, `commandAuthorities` row, wallet or provider interaction,
transaction, deployment, or live behavior. It does not move any card between
queue states by itself, amends no manifest itself, and does not merge,
rebase, or close any pull request.

## Human ruling

The human operator ruled GO on the requested sequence at the time this card
was merged, through the operator's delegated session. The root records the
decision rows from this card.
