# M15-T010 — Guest RiskScan Quick preflight

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T020 accepted; M01-T040 accepted; M02-T050 accepted;
  M11-T020 accepted
- Owner: `apps/web/src/app/dashboard/riskscan/preflight/page.tsx`,
  `apps/web/src/components/riskscan/preflight/**`, and
  `apps/web/tests/riskscan-quick-preflight.test.mjs` are this card's
  implementation paths. The card also owns the constrained local preflight
  route-map amendment in `apps/web/src/components/workspace/workspace-navigation.tsx`
  and its matching assertion amendment in
  `apps/web/tests/workspace-shell.test.mjs`. The root owns this card, local
  specification/UI manifest/ledger, plan, queue state, catalog, ownership,
  decisions, reviews, integration evidence, and pushes.
- Human actions: none for the controlled pure local preflight. HA-X402-HEDERA-001
  remains a later human-only prerequisite for a payment client or live proof;
  while pending it grants no external authority and does not block this card.

## Scope

Add a guest Dashboard route at `/dashboard/riskscan/preflight` that lets a
caller assess the accepted RiskScan Quick disclosure contract before reaching
an unsigned request boundary. The client island collects intentionally blank
request reference, subject reference, and context fields plus four explicit
caller-reported declaration controls. On one deliberate valid submission, it
calls only the public `assessRiskScanQuick` core export locally and presents
the resulting `needs_disclosure` or `disclosures_reported` disposition,
reasons, and limitation. It contains one bounded invalid-input outcome if the
core rejects structurally invalid data.

This is local preparation only. It makes no network/API request and never
represents a declaration as verification, a preflight as a paid RiskScan
response, or an all-reported disposition as service, payment, evidence, or
live availability. The Workspace route map gains one semantic local link to
the preflight route.

The local contract is [M15 guest RiskScan Quick preflight](../../../specs/m15-guest-riskscan-quick-preflight.md),
its UI boundary is [UI-S10](../../../ui/UI-S10.md), the local UI ledger is
[UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the
[M15 guest RiskScan Quick preflight plan](../../../superpowers/plans/2026-09-06-m15-guest-riskscan-quick-preflight.md).

## Candidate ready requirements

- The local contract, UI-S10 manifest/ledger row, and implementation plan are
  committed before a RED test or code change.
- M01-T020, M01-T040, M02-T050, and M11-T020 remain accepted locally, and no
  active card owns the new route/island/test paths or the explicitly
  constrained Workspace navigation amendment.
- The card records blank text inputs, four explicit boolean declarations, one
  local core invocation per deliberate valid submission, bounded outcomes,
  truthful presentation, tier, human boundary, and concrete validation rules.
- The delivery excludes Sign/session/provider behavior, fabricated user or
  session identity, account, wallet, signer, configuration/environment reads,
  direct fetch/API/request
  construction, POST, payment-client behavior, storage, persistence,
  receipt/evidence, deployment, and live claims.

## Validation

- RED/GREEN contracts prove exact blank input and declaration construction,
  public Core-only local assessment, no direct or indirect request behavior,
  fixed truthful disposition/invalid-input feedback, and the constrained
  Workspace map link.
- Focused source checks prove a static server route plus one client island,
  required controls, explicit caller-declaration handling, no Agent/API/fetch
  boundary, and the absence of prohibited authority, storage, configuration,
  timer/retry, and external-link behavior.
- Web/root typecheck, test, lint, clean-install dry run, production Webpack
  build, queue/reference/whitespace checks, enabled local guard, desktop and
  narrow browser checks, independent task review, and two fresh clean
  module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T16:03:15Z after a fresh post-M14 rescan found accepted
pure Quick, Web, and guest workspace dependencies; no active or ready local
card; no ownership conflict for the new Dashboard route/island; and no human
blocker for local pure assessment. This gives the guest application a useful
preflight step without inventing the unresolved Sign/session/provider contract
or reopening payment/persistence. This inbox card authorizes only its local
contract, UI manifest/ledger row, and plan. It authorizes neither RED/code nor
Sign/session, payment, signing, account, wallet, transaction, deployment, or
live behavior.

## Ready transition

Ready at 2026-09-06T16:11:21Z after two fresh independent readiness reviews
found accepted M01-T020, M01-T040, M02-T050, and M11-T020 dependencies;
resolvable local records; a disjoint new Dashboard route/island/test boundary;
the explicitly constrained Workspace navigation/test amendment; public Core
client feasibility without package/configuration changes; and no human blocker
for pure local assessment. The reviews require typed form-data construction,
one local `assessRiskScanQuick` call inside a bounded invalid-input `try/catch`,
and tests that allow the required declaration `identity` field while banning
fabricated user/session identity state. This ready state authorizes only the
local RED/GREEN preflight contract. It does not authorize Sign/session,
payment, signing, account, wallet, transaction, deployment, or live behavior.

## Activation

Activated at 2026-09-06T16:15:52Z after a post-ready queue rescan confirmed
that M15-T010 is the sole ready card, no active card owns its bounded paths,
and no human action blocks its pure local scope. This activation authorizes the
specified RED/GREEN implementation and verification only; it does not expand
authority to Sign/session, payment, signing, account, wallet, transaction,
deployment, or live behavior.

## Acceptance

Accepted at 2026-09-06T16:39:35Z after a fresh queue rescan confirmed accepted
M01-T020, M01-T040, M02-T050, and M11-T020 dependencies and no conflicting
active owner of the new route/island/test paths or the constrained Workspace
navigation amendment.

- `MODULE_BASE` is `8c4684ea31e67bb09a985d2900088aeedbdc0af6`; `MODULE_HEAD`
  is `45b04f7125c4b96bf389370bb1236544a7b995bb`. The focused RED contract
  first observed the intentionally missing M15 state and route sources before
  the local Core-only implementation made all three focused checks GREEN.
- Focused M15 checks, Web typecheck/test, root typecheck/test/lint, clean-install
  dry run, root queue validation, whitespace/reference checks, and the enabled
  local guard passed under Node 22.21.1. The production Webpack build passed
  with Cache Components and emitted `/dashboard/riskscan/preflight` as a static
  route; it retains only the pre-existing optional upstream `@x402/paywall`
  resolution warning.
- Browser checks verified local Workspace navigation; the incomplete,
  all-disclosures-reported, and whitespace-invalid outcomes; truthful local
  feedback; and no browser error entries. At 390 px, the route had no horizontal
  overflow and its controls and feedback remained usable.
- Independent task review and two fresh clean module-review generations found
  no Critical, Important, or Minor finding.

Acceptance covers only caller-reported local preparation. It does not provide
or authorize Sign/session, user identity, account, wallet, payment, signing,
transaction, settlement, service, receipt, evidence, deployment, or live
behavior.
