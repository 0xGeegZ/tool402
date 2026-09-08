# S11-T010 — Guided demo narration route

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T040 accepted, M02-T070 accepted, M02-T080 accepted, M11-T010 accepted, M11-T020 accepted, M13-T010 accepted, M14-T010 accepted, M15-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  only `apps/web/src/app/demo/page.tsx`,
  `apps/web/src/components/demo/guided-demo-steps.tsx`,
  `apps/web/tests/guided-demo-route.test.mjs`, and the explicitly reserved
  local-link integration pair
  `apps/web/src/components/discovery/local-navigation.tsx` and
  `apps/web/tests/landing-explore.test.mjs`.
- Human actions: none granted by this card. It relates to HA-DEMO-VIDEO-001
  only as presentation scaffolding; narration, recording, deployment, and
  submission remain human-owned.

## Scope

Add one static guest route that walks a presenter or evaluator through the
routes already accepted in this repository, in demonstration order, with
expected-observation copy for each step.

The local contract is the [UI-S11 guided demo narration manifest](../../../ui/UI-S11.md).
The accepted slice history it composes is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

This card adds no domain state, client island, fetch, storage, configuration
read, dependency, or route behavior outside the new page and its one navigation
link amendment.

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- Every narrated route exists and is accepted at the same commit. The nine
  narrated targets are `/`, `/explore`, `/explore/riskscan`,
  `/explore/riskscan/try`, `/explore/riskscan/tool-loop`, `/dashboard`,
  `/dashboard/riskscan`, `/dashboard/riskscan/compatibility`, and
  `/dashboard/riskscan/preflight`.
- The declared paths are disjoint from every active card.
- The narration copy is fixed in the manifest boundary before code, so no step
  can promise an observation its target route does not produce.
- The only accepted-source overlap is the explicitly root-reserved local
  navigation link and its existing focused assertion. It may add exactly the
  local `/demo` link with label `Demo`; it must not alter any existing link,
  layout, navigation behavior, or route copy.

## Verification

- A durable RED test at `apps/web/tests/guided-demo-route.test.mjs` precedes
  the source change and fails only because the new page and guided-step source
  paths do not exist.
- Focused tests prove the static route shape, the exact narrated link set, the
  absence of client or network behavior, and the exclusion boundary.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Desktop and narrow browser checks cover rendering, local navigation, keyboard
  focus, reduced motion, no horizontal overflow, and clean diagnostics.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card produces presentation scaffolding only. It is not evidence that any
narrated step has been performed, and it claims no funding, offering, position,
identity, provider, evidence-read, live-status, payment, deployment, or
submission authority. Surfaces excluded by the recorded HI-001 CUT, by the
missing Sign/session contract, and by the missing evidence privacy contract
remain excluded here.

## Ready transition

Ready at 2026-09-08T18:13:14Z after an independent review at pushed
`745441773e9af3dbc738b7db505c5c54368a528e`. The [ready
review](../../evidence/S11-T010-ready-review.md) found every dependency and
narrated route accepted and present, every local reference resolved, all three
new source/test paths absent, no active ownership conflict, and exactly one
root-reserved navigation/assertion integration pair.

This ready state authorizes only a fresh root activation followed by the
durable RED test at `apps/web/tests/guided-demo-route.test.mjs`. It does not
authorize the demo page/component, navigation change, client behavior, network
behavior, human narration, recording, deployment, or submission.

## Activation

Activated at 2026-09-08T18:15:20Z after a fresh root rescan and independent
[activation audit](../../evidence/S11-T010-activation-review.md) at pushed
`bfe2e648aec50d51b63972edd9bca0762fb23427`. S11 was the sole ready card,
every dependency remained accepted, `HEAD` equaled `origin/main`, the worktree
was clean, the guard and queue checks passed, and all three future source/test
paths remained absent and disjoint.

This activation authorizes only the durable RED test at
`apps/web/tests/guided-demo-route.test.mjs`. It does not authorize the demo
page/component, navigation change, client behavior, network behavior, human
narration, recording, deployment, or submission.
