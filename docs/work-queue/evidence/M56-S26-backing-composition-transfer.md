# M56/S26 backing composition transfer

## Decision

Because canonical main does not yet contain M56's card, specification, and
catalog row, this is a conditional reservation, not active M56 ownership. It
takes effect only in the rebased M56 integration PR that commits those controls.
It then transfers only `BackingForm`'s
`useWalletSession`/`connectedWalletSession` consumption and
`section[aria-labelledby="backing-status"]` composition in
`apps/web/src/components/backing/backing-flow.tsx`, plus matching shared-session
assertions in `apps/web/tests/backing-route.test.mjs`. S26 retains all other S26
selectors, assertions, and paths.

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
