# B04-T010 — Security scan remediation

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M02-T060 accepted, M46-T030 accepted, M47-T010 accepted
- Owner: Root owns queue records, code, tests, review, commit, push, and integration.
- Human actions: none for local delivery. Wallets, providers, payments,
  transactions, deployments, and live evidence remain human-only and excluded.

## Scope

This user-directed remediation addresses only the two reproduced scan findings:

1. one immutable public Stage-B digest must be shared by the display, command,
   execution, and browser/provider guard; and
2. protected RiskScan and EntityCheck request JSON must be read through one
   65,536-byte streaming limit and reject an over-limit body with `413`.

The authority is the local [B04 specification](../../../specs/b04-security-scan-remediation.md)
and [implementation plan](../../../superpowers/plans/2026-09-11-b04-security-scan-remediation.md).

## Activated durable RED surface

Readiness and activation confirm the accepted dependencies, absent new identity
and bounded reader targets, and no active ownership collision. This card
authorizes a durable RED contract only in these exact tests:

- `apps/web/tests/stage-b-ats-create-canonical-identity.test.mjs`;
- `apps/web/tests/bounded-request-json.test.mjs`;
- `apps/web/tests/entitycheck-api.test.mjs`;
- `apps/web/tests/riskscan-api.test.mjs`;
- `apps/web/tests/provider-deploy-route.test.mjs`;
- `apps/web/tests/provider-deploy-state.test.mjs`;
- `apps/web/tests/stage-b-ats-create-command-projection.test.mjs`; and
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`.

The independent RED review accepts the test-only failures and authorizes the
smallest GREEN change only in:

- `apps/web/src/lib/ats/stage-b-ats-create-canonical-identity.ts`;
- `apps/web/src/components/provider/deploy/ats-create-configuration.ts`;
- `apps/web/src/lib/ats/stage-b-ats-create-command-projection.ts`;
- `apps/web/src/lib/ats/stage-b-ats-create-execution-projection.ts`;
- `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`;
- `apps/web/src/lib/bounded-request-json.ts`;
- `apps/web/src/lib/x402-protected-route.ts`; and
- `apps/web/src/lib/entity-check-x402.ts`.

No other source path, payment, wallet/provider authority, transaction,
deployment, or live action is authorized.

Payment, settlement, wallet/provider, transaction, deployment, and live
boundaries remain excluded.

## M53 overlap release

The root transfers only `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`
and `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts` to M53-T010 for
the distinct confirmed receipt-log selection defect. Every remaining B04 path
and exclusion stays unchanged.

## Completion requirements

The final patch must keep the Stage-B execution preimage unchanged, preserve
the existing `400` invalid-body and unsigned `402` paths, prove `413` before
source read or settlement for an over-limit EntityCheck request, pass focused
and workspace verification, and receive one fresh bypass/regression review.

## Acceptance

B04-T010 is accepted by the repository operator's ruling of 2026-09-12 on the
delivered work already merged on `main` at `07beeffe`. The minimal GREEN was
delivered by commit `a64edd97`, "fix: Harden Stage-B and x402 inputs",
integrated at merge commit `44054b96` through pull request #76. All sixteen
declared files exist on `main`: the eight activated RED contracts and the eight
authorized GREEN sources, including
`apps/web/src/lib/ats/stage-b-ats-create-canonical-identity.ts`,
`apps/web/src/lib/bounded-request-json.ts`,
`apps/web/src/lib/x402-protected-route.ts`, and
`apps/web/src/lib/entity-check-x402.ts`. Running the eight declared contracts
together on `main` at `07beeffe` under Node 22 reports 115 tests, 115 passes,
and no failure, cancellation, or skip, so both reproduced findings are closed:
one immutable public Stage-B digest is shared by the display, command,
execution, and browser or provider guard, and protected RiskScan and
EntityCheck request JSON is read through one 65,536-byte streaming limit that
rejects an over-limit body with `413`. Verification is the merged-`main` state at `07beeffe`: the complete Web suite passes 547 of 548 with no failure and one skip, Web typecheck is clean, and the Web build renders 37 of 37 routes. The acceptance releases every B04
source and test reservation, including the bridge pair already transferred to
M53-T010, and grants no payment, wallet, provider authority, transaction,
deployment, or live action.
