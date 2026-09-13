# W01-T010 — Wagmi wallet and dashboard-session migration

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: none. W01 is a root-authorized successor migration; its
  readiness record explicitly reconciles the active S26/S36/S40/M51/M53/M54/
  M56/M58/B04 source boundaries and preserves accepted M49/M50 invariants.
- Owner: root owns queue movement, specification, reservations, review,
  commits, push and the draft PR. No delegated lane may change a W01 path.
- Human actions: real wallet access, signing, funding, configuration,
  deployment, merge and submission remain human-owned and excluded.

## Scope

Migrate in-house MetaMask discovery, connection storage/listeners, direct
signature transport and direct browser transaction transport to Wagmi v3 and
Viem. Simplify only client integration with dashboard authentication. Preserve
server challenge/session endpoints, authorization, command admission, replay
protection, attempt reservation, payment evidence and verification.

The local contract is [W01](../../../specs/w01-wagmi-wallet-session.md), the
approved design is [the Wagmi migration design](../../../superpowers/specs/2026-09-13-wagmi-wallet-session-design.md), and readiness evidence is
[W01-T010-ready-review](../../evidence/W01-T010-ready-review.md).

## Ready boundary

The root record in `FILE-OWNERSHIP.md` declares all W01 candidate paths. They
remain prohibited until a separate W01 activation reserves focused RED test
paths. A later accepted RED review must separately authorize only the minimum
production paths needed for GREEN.

That activation may reserve only `apps/web/tests/wagmi-provider.test.mjs`,
`wallet-session.test.mjs`, `wallet-state.test.mjs`,
`wallet-session-sync.test.mjs`, `metamask-provider.test.mjs`,
`dashboard-auth.test.mjs`, `dashboard-session-sync.test.mjs`,
`tool402-command.test.mjs`, `tool402-command-wagmi-compatibility.test.mjs`,
`commands-api.test.mjs`, `backing-route.test.mjs`, `backing-state.test.mjs`,
`stage-b-browser-provider-bridge.test.mjs`, `ats-create-action.test.mjs`, and
`deploy-stage-signing.test.mjs`, all under `apps/web/tests/`. No application
source, package or lockfile path is active before the ensuing RED review.

The W01-M56 successor transfer replaces only the old custom wallet-hook names
inside the backing flow/state and their tests. It preserves the one shared
connection authority, funding reservation, no-second-send and durable
attempt/hash evidence boundaries.

Open PR #118 is a known competing, `main`-based wallet-balance lane. At its
recorded head `db83f47a`, it overlaps W01 wallet session/control/tests but is
not in `origin/dev`. W01 neither merges nor copies it. Before W01's final
rebase/PR update, the root must recheck #118 and either rebase after its merge
or explicitly reconcile its accepted balance behavior in a narrow follow-up.

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
