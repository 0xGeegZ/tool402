# M08-T010 — Browser ToolLoop RiskScan journey

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T040 accepted; M01-T090 accepted; M02-T070 accepted;
  M02-T080 accepted; M07-T010 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-070-002, D-M02-080-002, and
  D-M07-010-002 accepted
- Owner: the proposed implementation scope is the root-owned Agent package
  exposure, Web package/configuration/lockfile integration, and
  `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`,
  `apps/web/src/components/riskscan/tool-loop/**`,
  `apps/web/tests/riskscan-tool-loop.test.mjs`, plus the constrained local
  ToolLoop detail link and focused detail test amendment. The root owns this
  card, local specification, UI manifest/ledger, plan, queue state, catalog,
  ownership, decisions, reviews, integration evidence, and pushes.
- Human actions: none for this controlled local browser surface.
  HA-X402-HEDERA-001 remains PENDING and authorizes/unblocks no payment client
  or live proof.

## Scope

Create one truthful browser surface for the accepted local ToolLoopAgent flow.
The route submits the accepted bounded Quick fields to the Agent flow against
the browser's current origin and renders only its terminal discovery/challenge
outcome. It makes local directory failure visible before a RiskScan request;
the valid local path makes one unsigned request and may render only an
unavailable or payment-required boundary.

The task does not create a payment client or result client. It excludes direct
header/payload handling, configuration, recipient/facilitator/price/network,
wallet/account/signer/provider, persistence, retry/timer/storage, receipt,
evidence, result, settlement, transaction, deployment, and live claims.

The local contract is [M08 Browser ToolLoop RiskScan journey](../../../specs/m08-browser-tool-loop-journey.md), its UI boundary is [UI-S04](../../../ui/UI-S04.md), the local UI ledger records that manifest at [UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the [M08 Browser ToolLoop plan](../../../superpowers/plans/2026-09-06-m08-browser-tool-loop-journey.md).

## Candidate ready requirements

- The local M08 specification, UI-S04 manifest/ledger row, and implementation
  plan are committed before RED tests or implementation.
- Every listed dependency and evidence record remains accepted locally; no
  active lane owns the new Web paths or root package integration.
- The card records the exact public Agent subpath, static/page-client boundary,
  current-origin flow, seven bounded outcomes, human boundary, tier, and
  concrete validation commands.
- The delivery preserves Cache Components and excludes all payment, result,
  persistence, live, and external capability.

## Validation

- RED/GREEN tests prove public Agent access, controlled GET-then-POST
  composition, zero POST after directory failure, outcome mapping, route/form
  shape, duplicate-submit locking, local link, and source exclusion boundary.
- Web/Agent typecheck/test, focused Web boundary tests, root lint, and root
  clean-install/typecheck/test pass alongside the production Webpack build,
  queue/reference/whitespace checks, and enabled local-reference guard.
- The Next development loop verifies desktop and narrow browser behavior:
  actual local directory discovery followed by the configuration-absent
  unavailable state, with clear framework/browser errors.
- Independent task review and two fresh clean Standards/Spec module-review
  generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T07:36:00Z after a fresh post-M07 rescan confirmed no
remaining active card, all listed dependencies/evidence accepted, disjoint new
Web paths, and a clear observer-value gap: the existing Try route directly
posts while the accepted ToolLoop composition is otherwise headless. This
inbox card authorizes neither RED/code nor a configured recipient/facilitator,
wallet/account action, payment, transaction, deployment, evidence, result, or
live claim.
