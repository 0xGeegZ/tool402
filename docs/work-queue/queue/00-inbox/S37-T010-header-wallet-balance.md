# S37-T010 — Header wallet HBAR balance

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S15-T010 accepted, M50-T010 accepted; the root sequences this
  card after S26-T010 (header wallet control and shared session) when S26 is
  integrated first, so the balance lands in the shared session rather than in
  island state. S26-T010 does not block the card: if this card is accepted
  first, S26 moves the balance value with the rest of the island state under
  its own reservation.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S37 local targets: new
  `apps/web/src/lib/wallet/wallet-balance.ts` and
  `apps/web/tests/wallet-balance.test.mjs`; and, each under a root
  integration reservation, the `connected` and `not_issuer` badge branch and
  session-change re-read of
  `apps/web/src/components/wallet/wallet-connect.tsx`, or the session value
  and re-read of `apps/web/src/components/wallet/wallet-session.tsx` if
  S26-T010 is accepted first.
- Human actions: none. This change creates no authority, wallet permission,
  payment, provider, configuration, account, transaction, deployment, or
  live behaviour. It reads a public balance through the wallet the person
  already connected.

## Scope

The accepted MetaMask control shows a connected address and the Hedera
Testnet chain gate, but nothing about whether that account holds any HBAR.
A provider or backer reaches a signing or funding step before learning the
account is empty. This card reads the native balance once per settled
session read through `eth_getBalance` on the already-selected provider and
renders it beside the address as `<address> · 12.34 HBAR`, with
`balance unavailable` when the read fails. Nothing polls, nothing persists,
and no state kind is added.

Requested by the human operator on 2026-09-11 as part of the "MetaMask in
the toolbar so anyone can connect first, on Hedera, with balances" request.
The connect-from-the-header half of that request is S26-T010; the Hedera
chain gate and the `Switch to Hedera Testnet` control are already accepted
under UI-S15 and unchanged here.

The local contract is the
[UI-S37 header wallet HBAR balance manifest](../../../ui/UI-S37.md). The
accepted slices it builds on are the [UI-S15 manifest](../../../ui/UI-S15.md)
and the
[M50 wallet session change synchronization specification](../../../specs/m50-wallet-session-change-synchronization.md),
recorded in the [local UI slice ledger](../../../ui/IMPORT-LEDGER.md). Its
sibling is the [UI-S26 manifest](../../../ui/UI-S26.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The two new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox, including S26-T010's
  `wallet-session.tsx` and `wallet-session.test.mjs`.
- Every amended path belongs to an accepted record named in the manifest;
  each amendment needs an explicit root integration reservation before source
  changes, limited to the badge branch and the session-change re-read, and
  the root decides at activation whether the reservation targets
  `wallet-connect.tsx` or the S26 `wallet-session.tsx`.
- The two module exports, the badge text format, the fallback literal, and
  the read-trigger rule are fixed in the manifest before code, so no fetch,
  poll, token, or state kind can be added while the slice is built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because `wallet-balance.ts` does not exist and the badge renders the
  address alone.
- Focused tests prove the single `eth_getBalance` call shape, the non-hex
  rejection, `BigInt` truncating formatting on the manifest's four cases, and
  by source scan that the owning component reads only after a settled
  `connected` or `not_issuer` read, sets no interval or timeout, and renders
  the separator and fallback literal.
- Web typecheck, test, lint, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Desktop and 390px browser checks with a funded Hedera Testnet account: the
  badge shows the balance after connect; switching account in MetaMask
  updates it without a click; the badge wraps without overflow.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation and adds one read-only RPC call. It adds no
state kind, wallet, auto-connect, storage, discovery outside a click, chain
switch outside a click, mainnet chain id, token or HTS balance, mirror-node
fetch, `viem` client, polling, currency conversion, refresh control,
low-balance warning, signature, transaction, authority display, route,
navigation change, API change, or dependency. The manifest's exclusions
govern; this card does not restate them.
