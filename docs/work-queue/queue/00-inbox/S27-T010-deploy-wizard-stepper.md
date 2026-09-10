# S27-T010 — Deploy wizard step progress

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S16-T010 accepted, S21-T010 accepted; S25-T010 (inbox,
  delivered lane) amends the same wizard file and must be integrated before
  this card's amendments, so the root sequences this card after it.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S27 local targets: new
  `apps/web/tests/deploy-wizard-stepper.test.mjs`; and, each under a root
  integration reservation, the `StepProgress` function, the step caption
  placement, and the step-count badge in
  `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`, the
  step-3 label in
  `apps/web/src/components/provider/deploy/provider-deploy-state.ts`, and the
  label, caption, and `StepProgress` assertions of
  `apps/web/tests/provider-deploy-state.test.mjs` and
  `apps/web/tests/provider-deploy-route.test.mjs`.
- Human actions: none. This presentation change creates no wallet, payment,
  provider, configuration, account, transaction, deployment, or live
  behaviour.

## Scope

The wizard's progress row renders five pill cards with a numbered circle and
a single-line label, so the two longest labels clip to `Pricing and target
agent cust…` and `Funding and revenue-note te…` at desktop width, and a
separate `N / 5` badge repeats the count the caption already gives. The
selected PREP-UI-001 wizard direction shows five equal thin bars with full
labels beneath and the `Step N of 5 · <label>` caption under the row.

This card reshapes `StepProgress` to that anatomy, keeps every accessibility
attribute and the return-to-completed-step behaviour, removes the redundant
badge, and shortens step 3 to `Pricing and customers`. It changes no step
count, order, field, stage, or copy beyond that label.

The local contract is the
[UI-S27 deploy wizard step progress manifest](../../../ui/UI-S27.md). The
accepted slices it builds on are the [UI-S16 manifest](../../../ui/UI-S16.md)
and the [UI-S21 manifest](../../../ui/UI-S21.md), recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The one new path is disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- Every amended path belongs to S16-T010's accepted record; each amendment
  needs an explicit root integration reservation before source changes,
  limited to the `StepProgress` function, the caption placement, the badge,
  the one label, or the one assertion, and the root sequences this card after
  S25-T010's amendment
  to the same wizard file.
- The segment anatomy, the caption placement, the badge removal, and the
  five labels are fixed in the manifest before code, so no control or copy
  can be added while the slice is built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because the progress buttons still render a numbered circle and a
  truncated label, the badge still exists, and the step-3 label is still
  `Pricing and target agent customers`.
- Focused tests prove the bar-then-label anatomy, the absence of `truncate`
  and `title`, current-step emphasis, the caption rendered once beneath the
  row, the badge removed, and the five labels.
- The amended accepted tests pass with only their label, caption, and
  `StepProgress` assertions changed; every other assertion is untouched.
- Web typecheck, test, lint, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Desktop and 390px browser checks on `/provider/deploy` show all five
  labels fully visible, the current label emphasised, the caption beneath the
  row, and no horizontal overflow.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation only. It adds no step, field, stage, state,
copy, icon, animation, route, request, or economic claim, and it does not
alter the signing island, the relay, the command bridge, or any API route.
The manifest's exclusions govern; this card does not restate them.

## Human worktree lane request

- Requested at `2026-09-10T19:00:00Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/wizard-stepper`, branch `work/wizard-stepper`.
  Implementer: the operator's delegated session. Reviewer: the root's
  independent task review and module review, unchanged.
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
