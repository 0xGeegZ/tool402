# M14-T010 — Guest RiskScan Workbench

## State

- Tier: CORE_P0
- Queue state: 20-active
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
