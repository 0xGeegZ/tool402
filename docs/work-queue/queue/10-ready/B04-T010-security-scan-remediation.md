# B04-T010 — Security scan remediation

## State

- Tier: CORE_P0
- Queue state: 10-ready
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

## Ready boundary

Readiness confirms the accepted dependencies, absent new identity and bounded
reader targets, and no active ownership collision. This card reserves its
declared candidate paths for a future activation review only. Its exact
durable-RED candidates are:

- `apps/web/tests/stage-b-ats-create-canonical-identity.test.mjs`;
- `apps/web/tests/bounded-request-json.test.mjs`;
- `apps/web/tests/entitycheck-api.test.mjs`;
- `apps/web/tests/riskscan-api.test.mjs`;
- `apps/web/tests/provider-deploy-route.test.mjs`;
- `apps/web/tests/provider-deploy-state.test.mjs`;
- `apps/web/tests/stage-b-ats-create-command-projection.test.mjs`; and
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`.

No source or test change, RED, or GREEN work is authorized while it is
`10-ready`.

Payment, settlement, wallet/provider, transaction, deployment, and live
boundaries remain excluded.

## Completion requirements

The final patch must keep the Stage-B execution preimage unchanged, preserve
the existing `400` invalid-body and unsigned `402` paths, prove `413` before
source read or settlement for an over-limit EntityCheck request, pass focused
and workspace verification, and receive one fresh bypass/regression review.
