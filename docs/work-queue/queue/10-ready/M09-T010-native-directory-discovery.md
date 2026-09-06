# M09-T010 — Browser RiskScan Directory inspection

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M01-T040 accepted; M01-T090 accepted; M02-T040 accepted;
  M05-T010 accepted; M05-T020 accepted; M06-T010 accepted; M08-T010 accepted
- Integration evidence: D-M01-FOUND-001, D-M01-090-003, D-M02-040-002,
  D-M05-010-002, D-M05-020-002, D-M06-010-002, and D-M08-010-002 accepted
- Owner: the proposed implementation scope is root-owned
  `apps/agent/package.json`, `apps/web/src/app/explore/page.tsx`,
  `apps/web/src/components/discovery/riskscan-directory-discovery.tsx`,
  `apps/web/src/components/discovery/riskscan-directory-state.ts`,
  `apps/web/tests/riskscan-directory-discovery.test.mjs`, and the constrained
  `apps/web/tests/landing-explore.test.mjs` amendment. The root owns this card,
  local specification, UI manifest/ledger, plan, queue state, catalog,
  ownership, decisions, reviews, integration evidence, and pushes.
- Human actions: none for this controlled local browser inspection surface.
  HA-X402-HEDERA-001 remains PENDING and authorizes/unblocks no configuration,
  payment client, or live proof.

## Scope

Add one explicit, read-only Directory inspection island to `/explore`. It uses
only the accepted public Agent directory boundary with the browser current
origin and renders the bounded selected RiskScan Quick descriptor or truthful
directory failure. It makes capability/limitation details and safe native
atomic metadata inspectable before ToolLoop, without submitting RiskScan or
creating any payment behavior.

The task preserves the accepted UI-S01 static card and does not modify Agent
source/tests, API/x402 helpers, core, backend, existing ToolLoop/Try flows,
runtime configuration, or external services. It excludes direct endpoint,
header, body, payment client, wallet/account/signer/provider, recipient,
facilitator, result, receipt/evidence, persistence, retry/timer/storage,
external link, transaction, deployment, and live claim behavior.

The local contract is [M09 Browser RiskScan Directory inspection](../../../specs/m09-native-directory-discovery.md), its UI boundary is [UI-S05](../../../ui/UI-S05.md), the local UI ledger records the slice at [UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the [M09 Directory inspection plan](../../../superpowers/plans/2026-09-06-m09-native-directory-discovery.md).

## Candidate ready requirements

- The local M09 specification, UI-S05 manifest/ledger row, and implementation
  plan are committed before RED tests or implementation.
- Every listed dependency/evidence record remains accepted locally; no active
  lane owns the proposed package or Explore paths.
- The card records one public Agent subpath, static/client separation,
  current-origin single-GET behavior, bounded projection, native atomic
  metadata, the narrow UI-S05 authority amendment, human boundary, tier, and
  concrete validation commands.
- The delivery preserves Cache Components and excludes every request,
  payment/action, persistence, result, external, and live capability.

## Validation

- RED/GREEN tests prove public Agent access, exact controlled one-GET/zero-POST
  composition, no selected descriptor after directory failure, bounded native
  projection, duplicate-inspection locking, static-card preservation, and
  source exclusion boundary.
- Web/Agent typecheck/test, root lint, root clean-install/typecheck/test,
  production Webpack build, queue/reference/whitespace checks, and enabled
  local-reference guard pass.
- The Next development loop verifies desktop and narrow browser behavior:
  actual local directory inspection renders configuration-required selection
  after one GET and zero POSTs, with clear framework/browser errors.
- Independent design/task review and two fresh clean Standards/Specification
  module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T08:54:51Z after a fresh post-M08 rescan confirmed all
listed dependencies/evidence are accepted, no active card owns the proposed
package/Explore paths, and the next CORE_P0 observer-value gap is readable
Directory inspection rather than another persistence/reconciliation slice.
This inbox card authorizes neither RED/code nor a configured recipient or
facilitator, wallet/account action, signing, payment, transaction, deployment,
evidence, result, or live claim.

## Design review

The independent design review found one Important UI-authority contradiction:
UI-S05 permitted parser-derived configuration metadata while leaving UI-S01's
price/payment-state prohibition apparently intact. The local M09 contract,
UI-S05 manifest, and plan now narrowly amend only the new island's one public
directory `GET` and explicitly enumerated EVM/native parser-derived
configuration-summary fields; UI-S01's static card and every other boundary
remain unchanged. A scoped re-review found the EVM fields had to be enumerated
in the manifest as well, and this correction makes that set exact. The final
scoped independent re-review is clean and approves the normal ready
transition. No code, payment, configuration, or external action was created
during review.

## Ready transition

Ready at 2026-09-06T09:15:28Z after a fresh rescan confirmed the pushed
`a2363507ec7f78408831a51c4fd35c6321adf40a` M09 card, local specification,
UI-S05 manifest/ledger, and plan; every listed dependency and integration
record accepted; the proposed Agent package/Explore paths disjoint; no active
lane; concrete validation; queue validation; and the independent design review
plus two scoped re-reviews. The card is ready only for its local RED public
Agent/browser contract. HA-X402-HEDERA-001 remains PENDING and grants no
authority for configuration, recipient/facilitator setup, wallet/account/key
action, signing, payment, transaction, deployment, evidence, result, or live
claim.
