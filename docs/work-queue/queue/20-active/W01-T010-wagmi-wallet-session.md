# W01-T010 — Wagmi wallet and dashboard-session migration

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: none. W01 is a root-authorized successor migration; its
  readiness/activation records reconcile S26/S36/S40/M51/M53/M54/M56/M58/B04
  boundaries and preserve accepted M49/M50 invariants.
- Owner: root owns queue movement, reservations, review, commits, push and the
  draft PR. No delegated lane may change a W01 path.
- Human actions: real wallet access, signing, funding, configuration,
  deployment, merge and submission remain human-owned and excluded.

## Scope

Migrate in-house MetaMask discovery, connection storage/listeners, direct
signature transport and direct browser transaction transport to Wagmi v3 and
Viem. Simplify only client integration with dashboard authentication. Preserve
server challenge/session endpoints, authorization, command admission, replay
protection, attempt reservation, payment evidence and verification.

The local contract is [W01](../../../specs/w01-wagmi-wallet-session.md), the
approved design is [the Wagmi migration design](../../../superpowers/specs/2026-09-13-wagmi-wallet-session-design.md), and activation evidence is
[W01-T010-activation-review](../../evidence/W01-T010-activation-review.md).

## Activated durable RED surface

Only these W01 tests may change for RED: `apps/web/tests/wagmi-provider.test.mjs`,
`wallet-session.test.mjs`, `wallet-state.test.mjs`,
`wallet-session-sync.test.mjs`, `metamask-provider.test.mjs`,
`dashboard-auth.test.mjs`, `dashboard-session-sync.test.mjs`,
`tool402-command.test.mjs`, `tool402-command-wagmi-compatibility.test.mjs`,
`commands-api.test.mjs`, `backing-route.test.mjs`, `backing-state.test.mjs`,
`stage-b-browser-provider-bridge.test.mjs`, `ats-create-action.test.mjs`,
`deploy-stage-signing.test.mjs`, and `provider-tool-journey.test.mjs`.

No application source, package, lockfile, configuration, wallet request,
signature, transaction, authority, deployment, merge or live action is
authorized until a fresh independent RED review accepts intended W01 failures.
The preexisting Stage-2 provider journey failure and legacy wallet discovery
count failure are baseline facts, not W01 RED evidence.

## Acceptance requirements

- One Wagmi connection authority; no custom provider discovery, connection
  store or listeners remain in delivered application code.
- Connection/authentication/authorization/payment separation and every W01
  command, ATS, backing and evidence invariant remain true.
- RED-first deterministic mock-connector and race tests cover connection,
  auth, typed-data compatibility and no-second-transaction behavior.
- Pinned compatible dependencies, lockfile, migration/rollback documentation,
  browser mock evidence and a fresh independent final review are present.
- Node 22.21.1 root test/typecheck/lint/queue/build/whitespace gates pass.
  A draft PR targets refreshed `origin/dev`; it is never merged or deployed.
