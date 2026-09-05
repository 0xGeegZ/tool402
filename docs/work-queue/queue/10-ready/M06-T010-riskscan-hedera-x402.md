# M06-T010 — RiskScan Hedera testnet x402 service path

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M02-T060 accepted; M03-T030 accepted; M05-T010 accepted;
  M05-T020 accepted; M05-T030 accepted
- Integration evidence: D-M02-060-002, D-M03-030-002, D-M05-010-002,
  D-M05-020-002, and D-M05-030-002 accepted
- Owner: the proposed implementation scope is `apps/web/package.json`,
  `package-lock.json`, `apps/web/src/lib/riskscan-x402.ts`,
  `apps/web/src/lib/tool-directory.ts`, focused web tests,
  `apps/agent/src/riskscan-tool-directory.ts`, and focused Agent tests. The
  root owns package/lockfile integration, local specifications, plan, queue
  state, catalog, file ownership, decisions, reviews, evidence, and pushes.
- Human actions: none for local server integration and controlled tests. Real
  account creation/funding, token association, recipient/facilitator setup,
  environment configuration, signer creation, payment signing/submission,
  deployment, verification/finality, evidence, and submission remain
  human-authorized.

## Scope

Create one native Hedera testnet x402 seller path for the existing RiskScan
Quick route. It preserves the accepted EVM behavior, adds only the matching
native server mechanism, requires a controlled facilitator capability with a
fee payer before emitting an unsigned challenge, and makes the Tool Directory
and Consumer Agent accurately represent the safe native price summary.

The delivery does not add a client payment flow, wallet, key, account,
signer, payment-fetch helper, payment header/payload construction, external
facilitator call in a test, transaction, settlement, finality, receipt,
evidence, result, deployment, or live claim.

The local contract is [M06 RiskScan Hedera testnet x402 compatibility](../../../specs/m06-riskscan-hedera-x402.md); its executable steps are in the [M06 Hedera x402 plan](../../../superpowers/plans/2026-09-05-m06-riskscan-hedera-x402.md).

## Candidate ready requirements

- The local M06 specification, associated M02/M05 contract amendments, and
  implementation plan are committed before RED tests or implementation.
- Every dependency and listed evidence record remains accepted locally; no
  active lane owns any proposed web/Agent/package path or root lockfile
  integration reservation.
- The card records CORE_P0 priority, exact EVM/Hedera configuration split,
  canonical native id/atomic-price rules, unique facilitator
  capability/fee-payer gate, Tool Directory/Agent summary boundary, human
  boundary, and concrete validation commands.
- The delivery excludes client payment, signing, wallet/account/key access,
  live facilitator or network proof, transaction/finality/receipt/evidence/
  result material, deployment, and live claims.

## Validation

- RED/GREEN web tests cover strict EVM preservation, strict native testnet
  configuration, canonical recipient/asset identifiers, atomic native
  requirements, supported native challenge, discriminated scheme loading, and
  no-capability/mismatched/duplicate/accessor-backed-capability fail-closed
  behavior.
- RED/GREEN directory/Agent tests cover exact safe native metadata, cloning,
  malformed/hostile descriptor rejection, and no sender/client/signer path.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run typecheck --workspace @tool402/agent`
- `npm run test --workspace @tool402/agent`
- `npm run lint --workspace @tool402/agent`
- Root clean-install/typecheck/test/lint, production Webpack build,
  queue/reference checks, controlled local exercise, independent task review,
  and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T21:33:00Z after a fresh post-M05-T030 queue rescan
confirmed all five dependencies and their integration evidence are accepted;
no active lane owns the proposed web/Agent paths or root lockfile reservation;
and the next CORE_P0 vertical must advance native payment compatibility rather
than create another persistence/reconciliation task. This inbox card
authorizes neither RED/code nor a real recipient/facilitator configuration,
signing, wallet/account action, transaction, deployment, or live claim.

## Ready transition

Ready at 2026-09-05T21:44:15Z after a fresh queue rescan confirmed all five
accepted dependencies and their listed decision evidence; the pushed
`e54cd6a0ce9a9e75959ee1642eb837e5ebc32c52` native configuration, Directory,
Agent, and implementation-plan contracts; root-only lockfile integration;
disjoint proposed web/Agent ownership; no active lane; no pending human
action; concrete validation commands; queue validation; and an independent
design review plus scoped re-review with no remaining finding. The card is
ready only for its local RED configuration/server tests. It does not authorize
a real recipient/facilitator configuration, wallet/account/key action,
signing, payment, transaction, deployment, or live claim.
