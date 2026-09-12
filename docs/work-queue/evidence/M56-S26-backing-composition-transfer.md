# M56/S26 backing composition transfer

## Decision

Active S26 transfers to M56 only the backing-specific shared-session/wallet-mount
composition seam in `apps/web/src/components/backing/backing-flow.tsx` and the
matching shared-session assertions in `apps/web/tests/backing-route.test.mjs`.
S26 retains every other portion of those files and all of its other paths.

## Invariants

- Preserve `useWalletSession`, `connectedWalletSession`, and one shared wallet
  session.
- Do not restore `WalletIsland`, local duplicate wallet state, provider
  discovery, signatures, authority logic, or other wallet behavior.
- Do not transfer `wallet-session.tsx`, `wallet-connect.tsx`, layout/header,
  provider-deploy integration, S26's session state machine, or unrelated tests.

## Required follow-up

M56 rebases on the canonical main containing this transfer, runs focused backing
and S26 compatibility tests, and receives joint M56/S26 review before an
integration PR. Runtime `TOOL402_FUNDING_EVM_ADDRESS`, BACKER provisioning, and
an explicit testnet rehearsal remain separately Human Ops-owned and unexecuted.
