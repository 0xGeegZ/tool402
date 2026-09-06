# M14-T010 — Guest RiskScan Workbench

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M08-T010 accepted; M09-T010 accepted;
  M11-T020 accepted; M13-T010 accepted
- Owner: `apps/web/src/app/dashboard/riskscan/page.tsx`,
  `apps/web/src/components/workspace/guest-riskscan-workbench.tsx`, and
  `apps/web/tests/guest-riskscan-workbench.test.mjs` are this card's
  implementation paths. The card also owns the constrained local workbench
  route-map amendment in `apps/web/src/components/workspace/workspace-navigation.tsx`
  and its matching assertion amendment in
  `apps/web/tests/workspace-shell.test.mjs`. The root owns this card, local
  specification/UI manifest/ledger, plan, queue state, catalog, ownership,
  decisions, reviews, integration evidence, and pushes.
- Human actions: none for the controlled guest composition. HA-X402-HEDERA-001
  remains a later human-only prerequisite for a payment client or live proof;
  while pending it grants no external authority and does not block this card.

## Scope

Add a guest Dashboard route at `/dashboard/riskscan` that turns the already
accepted RiskScan surfaces into one coherent workbench. It composes the
existing local components in a fixed inspect-before-act order:

1. inspect the local Directory;
2. evaluate a caller-supplied native compatibility policy; then
3. follow the existing unsigned ToolLoop challenge boundary.

The workbench is a static server composition: it changes no accepted Agent,
Core, API, or client-island behavior. Each embedded island retains its own
bounded interaction and truthfulness contract. The Workspace route map gains
one semantic local link to the workbench.

The local contract is [M14 guest RiskScan workbench](../../../specs/m14-guest-riskscan-workbench.md),
its UI boundary is [UI-S09](../../../ui/UI-S09.md), the local UI ledger is
[UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the
[M14 guest RiskScan workbench plan](../../../superpowers/plans/2026-09-06-m14-guest-riskscan-workbench.md).

## Candidate ready requirements

- The local contract, UI-S09 manifest/ledger row, and implementation plan are
  committed before a RED test or code change.
- M01-T040, M08-T010, M09-T010, M11-T020, and M13-T010 remain accepted
  locally, and no active card owns the new route/component/test paths or the
  explicitly constrained Workspace navigation amendment.
- The card records fixed workbench order, server/client boundary preservation,
  semantic route requirements, tier, human boundary, and concrete validation
  rules.
- The delivery excludes Sign/session/provider behavior, identity, account,
  wallet, signer, configuration/environment reads, new direct fetch or API
  construction, payment-client behavior, storage, persistence, result/receipt/
  evidence, deployment, and live claims.

## Validation

- RED/GREEN source contracts prove the new route has one `main` and one `h1`,
  the server workbench composes exactly the accepted Directory, native
  compatibility, and ToolLoop islands in that order, and the Workspace map
  links locally to it.
- Focused source checks prove no new client directive, network/API construction,
  configuration, storage, timer/retry, Sign/session/account/wallet/provider/
  signer behavior, payment client, persistence, external link, or live claim
  enters the route or workbench component.
- Web/root typecheck, test, lint, clean-install dry run, production Webpack
  build, queue/reference/whitespace checks, enabled local guard, desktop and
  narrow browser checks, independent task review, and two fresh clean
  module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T15:24:54Z after a fresh post-M13 rescan found the
accepted Web foundation, guest workspace shell, Directory inspection, native
compatibility, and bounded ToolLoop surfaces; no active or ready local card;
and no human blocker for a server-side guest composition. The user confirmed
the landing and future signed-in app belong in scope. This card provides a
useful guest workbench now while deliberately leaving the unresolved Sign/
session/provider contract untouched. This inbox card authorizes only its local
contract, UI manifest/ledger row, and plan. It authorizes neither RED/code nor
Sign/session, payment, signing, account, wallet, transaction, deployment, or
live behavior.

## Ready transition

Ready at 2026-09-06T15:30:23Z after two fresh independent readiness reviews
found the accepted M01-T040, M08-T010, M09-T010, M11-T020, and M13-T010
dependencies; resolvable local records; a disjoint new Dashboard
route/workbench/test boundary; the explicitly constrained Workspace
navigation/test amendment; and no human blocker for the controlled guest
composition. The technical review also confirmed that the new static route can
compose the accepted client islands without changing their behavior, and that
the focused M14 test must inspect only new route/workbench sources rather than
reject existing ToolLoop behavior. This ready state authorizes only the local
RED/GREEN workbench contract. It does not authorize Sign/session, payment,
signing, account, wallet, transaction, deployment, or live behavior.

## Activation

Activated at 2026-09-06T15:31:56Z after a fresh local rescan confirmed the
pushed ready state, accepted M01-T040, M08-T010, M09-T010, M11-T020, and
M13-T010 dependencies, no active conflicting owner, resolvable local records,
and no human blocker for the controlled guest composition. The lane starts
with its focused local RED route/workbench contract in the current repository
workspace under the local worktree policy. No Sign session, account, wallet,
payment, transaction, deployment, or live behavior is authorized.

## Acceptance

Accepted at 2026-09-06T15:55:16Z after a fresh queue rescan confirmed the
accepted M01-T040, M08-T010, M09-T010, M11-T020, and M13-T010 dependencies
and no conflicting active owner of the new route/workbench/test paths or its
constrained Workspace navigation amendment.

- `MODULE_BASE` is `c5f65b73145f482619231d7262462c39287cc6dc`; `MODULE_HEAD`
  is `2231baa402b16a2f279088a29ec5f6eb2af63dc6`. The focused RED contract
  first observed the missing planned route/workbench sources. A review-driven
  contract amendment then observed the absence of explicit section-to-island
  ownership before GREEN added labelled section relationships and truthful
  non-gating copy.
- Focused workbench/navigation contracts, root typecheck/test/lint, root queue
  validation, whitespace/reference checks, enabled local guard, and
  clean-install dry run passed under Node 22.21.1. The production Webpack build
  passed with Cache Components and the new static Dashboard route; it retains
  only the pre-existing optional upstream `@x402/paywall` resolution warning.
- Browser checks verified the static guest route, all three labelled sections,
  local Workspace navigation, Directory inspection, an honest unavailable
  native-summary outcome for the current local configuration, and reachability
  of the existing unsigned ToolLoop controls. Desktop visual inspection passed.
  At a narrow rendered width of 325 px, the route had no horizontal overflow;
  its sections and controls remained accessible, and browser diagnostics had
  no error entries.
- Independent task review and two fresh clean module-review generations found
  no Critical, Important, or Minor finding.

Acceptance covers only the guest local workbench composition. It does not
provide or authorize Sign/session, identity, account, wallet, payment, signing,
transaction, settlement, result, receipt, evidence, deployment, or live
behavior.
