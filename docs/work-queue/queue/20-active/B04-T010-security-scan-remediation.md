# B04-T010 — Security scan remediation

## State

- Tier: CORE_P0
- Queue state: 20-active
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

## Completion requirements

The final patch must keep the Stage-B execution preimage unchanged, preserve
the existing `400` invalid-body and unsigned `402` paths, prove `413` before
source read or settlement for an over-limit EntityCheck request, pass focused
and workspace verification, and receive one fresh bypass/regression review.
