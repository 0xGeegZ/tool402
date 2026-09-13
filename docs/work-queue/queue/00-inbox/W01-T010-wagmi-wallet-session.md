# W01-T010 — Wagmi wallet and dashboard-session migration

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: S26-T010, S36-T010, S40-T010, M49-T010, M50-T010 and
  M58-T010 accepted or explicitly superseded/reconciled by the root.
- Owner: root owns the queue, specification, source/test reservations, review,
  commits, push and draft PR. No delegated lane may edit shared wallet or
  dashboard-auth paths without a root reservation.
- Human actions: none. Connecting a real wallet, signing, sending a
  transaction, configuration, deployment, narration, merge and submission
  remain human-owned and are outside this card.

## Scope

Migrate in-house MetaMask discovery, connection storage/listeners, direct
signature transport and direct browser transaction transport to Wagmi v3 and
Viem. Simplify only the client integration with dashboard authentication.
Preserve server challenge/session endpoints, authorization, command admission,
replay protection, attempt reservation, payment evidence and verification.

The local contract is [W01](../../../specs/w01-wagmi-wallet-session.md) and
the reviewed design is
[the Wagmi migration design](../../../superpowers/specs/2026-09-13-wagmi-wallet-session-design.md).

## Candidate path and ownership declaration

After separate readiness and RED acceptance, W01 may reserve only the relevant
wallet config/provider/hook, root layout provider mount, wallet control,
dashboard sign-in/session synchronizer, command signature seam/dialog,
Stage-B browser transaction adapter, backing flow/state, their focused tests,
`apps/web/package.json`, `package-lock.json`, this card/specification and
targeted documentation. Exact paths must be listed in the activation record;
this inbox declaration grants no source or package modification.

W01 must coordinate the overlapping `wallet-session.tsx`, `wallet-connect.tsx`
and wallet test paths with open PR #118. It must not silently duplicate the
old system, overwrite unmerged work, or make a claim from copied evidence.

## Acceptance requirements

- One Wagmi connection authority, no custom provider discovery or wallet
  connection store/listeners left in the delivered application.
- The precise connection/authentication/authorization/payment separation and
  all command, ATS, backing and evidence invariants in W01 remain true.
- Tests are RED-first and include the required connection, auth race,
  typed-data compatibility and no-second-transaction cases.
- Pinned compatible dependencies, lockfile, concise migration/rollback
  documentation, targeted browser mock evidence and a fresh independent
  review are present.
- Node 22.21.1 validation covers the required root test/typecheck/lint/queue/
  build/whitespace gates. A draft PR is opened only after a final rebase on
  refreshed `origin/main`; it is not merged or deployed.
