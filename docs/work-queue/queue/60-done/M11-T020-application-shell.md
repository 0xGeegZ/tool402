# M11-T020 — Application workspace shell

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M02-T020 accepted
- Owner: `apps/web/src/app/dashboard/page.tsx`,
  `apps/web/src/components/workspace/**`,
  `apps/web/src/components/discovery/local-navigation.tsx`, and
  `apps/web/tests/workspace-shell.test.mjs`, plus the constrained navigation
  assertion amendment in `apps/web/tests/landing-explore.test.mjs`, are this
  card's implementation paths. The root owns this card, local
  specification/UI manifest/ledger, plan, queue state, catalog, ownership,
  decisions, reviews, integration evidence, and pushes.
- Human actions: none for the static guest workspace shell.

## Scope

Add a truthful `/dashboard` product-workspace route and a local `Workspace`
navigation item. The route deliberately shows a guest/unconfigured preview
and links only to existing local product routes. It begins the interface that
will sit behind a real future Sign flow without pretending that a session or
personal data exists today.

The card does not modify the landing, make an external call, create a Sign or
sign-out control, add a user/session/account/wallet/provider/balance/position,
or represent a payment, result, evidence, transaction, deployment, or live
status.

The local contract is [M11 application workspace shell](../../../specs/m11-application-shell.md),
its UI boundary is [UI-S07](../../../ui/UI-S07.md), the local UI ledger is
[UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the
[M11 application shell plan](../../../superpowers/plans/2026-09-06-m11-application-shell.md).

## Candidate ready requirements

- The local contract, UI-S07 manifest/ledger row, and implementation plan are
  committed before a RED test or code change.
- Every dependency remains accepted locally; no active card owns the dashboard,
  workspace, or local-navigation paths.
- The card records guest-state truthfulness, exact local links, accessible
  route criteria, tier, human boundary, and concrete validation commands.

## Validation

- RED/GREEN tests prove dashboard structure, guest/unconfigured language,
  exact local links/navigation, primitive use, and the exclusion boundary.
- Web/root quality, production build, queue/reference/whitespace checks,
  enabled local guard, desktop/narrow browser checks, independent task review,
  and two fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T10:16:37Z after the user confirmed the application
after Sign belongs in product scope and a fresh rescan found accepted Web/UI
foundations, no active owner of these paths, and no human action needed for a
static guest shell. This inbox card authorizes only its local
contract/manifest/plan record; it authorizes neither RED/code nor session,
wallet, account, payment, or live behavior.

## Design review correction

The independent readiness review found that the new Workspace navigation link
requires a corresponding amendment to the accepted navigation assertion, and
that the current button primitive cannot represent a route-map link. This card
now owns the narrow legacy-test amendment and styles semantic local links
directly. Its paths remain disjoint from M11-T010. The corrected card requires
scoped clean re-review before ready.

## Ready transition

Ready at 2026-09-06T10:35:41Z after the independent readiness review and its
scoped clean re-review found accepted Web/UI dependencies, exact existing
route-map targets, semantic local links, and ownership of the dashboard,
workspace, navigation, and its constrained legacy navigation-test amendment.
Those paths are disjoint from M11-T010. This ready state authorizes only the
local guest-shell RED/GREEN contract; it does not authorize a Sign session,
account, wallet, payment, transaction, deployment, or live behavior.

## Activation

Activated at 2026-09-06T10:37:51Z after a fresh queue rescan confirmed the
pushed 10-ready state, accepted Web/UI dependencies, scoped clean readiness
re-review, exact existing route-map targets, and disjoint dashboard/workspace/
navigation paths including the constrained legacy navigation-test amendment.
The lane starts with its focused workspace RED contract in the current
repository workspace under the local worktree policy. No Sign session, account,
wallet, payment, transaction, deployment, or live behavior is authorized.

## Acceptance

Accepted at 2026-09-06T11:48:07Z after a fresh queue rescan confirmed the
accepted Web/UI dependencies and no conflicting active owner of dashboard,
workspace, or local-navigation paths.

- `MODULE_BASE` is `05f821252556c90ccd264b0bab9cff93c4d8f4bc`; `MODULE_HEAD`
  is `c3ea8a4d5d81a0de442450ecb6070de1029bba88`. M11-T020-scoped commits are
  `7830503`, `3aba05f`, and `c3ea8a4`; concurrent M10 and M11 landing paths
  remain disjoint.
- The focused guest-shell contract, root clean-install dry run, root
  typecheck/test/lint, production Webpack build with Cache Components,
  queue/reference/whitespace checks, and enabled local-reference guard passed
  under Node 22.21.1. The build retains only the pre-existing optional x402
  package-resolution warning outside this card's paths.
- Desktop and narrow browser checks verified the static route, the three
  local route-map links, visible keyboard focus, no horizontal overflow, and
  no framework or browser errors. The test-only correction did not alter
  runtime behavior.
- Independent task review found missing fabricated signer and affirmative
  session coverage; the root added that focused test coverage, pushed it, and
  the scoped re-review was clean. Two fresh clean Standards/Specification
  module-review generations at `c3ea8a4` found no Critical, Important, or
  Minor finding.

This acceptance covers only a static local guest workspace shell. It grants no
authority for Sign/session behavior, identity, account, signer, wallet,
payment, transaction, settlement, deployment, or live behavior.
