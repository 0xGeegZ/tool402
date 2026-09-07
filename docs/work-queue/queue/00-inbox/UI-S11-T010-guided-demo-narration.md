# UI-S11-T010 — Guided demo narration route

## State

- Tier: DEMO_P1
- Queue state: 00-inbox
- Dependencies: UI-S06, UI-S07, UI-S09, and UI-S10 accepted; M30-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  only `apps/web/src/app/demo/page.tsx`, files under
  `apps/web/src/components/demo/`, one focused demo route test, and the one
  constrained local navigation link amendment named in the slice manifest.
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

## Verification

- A durable RED test precedes the source change and fails because the route does
  not exist.
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
