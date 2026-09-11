# M50-T010 — Wallet session change synchronization

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: S15-T010 accepted, S16-T010 accepted.
- Compatibility context: M49-T010 is accepted with no active reservation on
  this card's paths. M50 preserves its existing Stage-B revalidation behavior
  but does not depend on it for wallet-session synchronization.
- Owner: The root owns queue state, catalog, ownership, decisions, readiness,
  activation, reviews, commits, pushes, and integration. A delegated
  implementer may change only the exact RED/GREEN paths recorded after the
  normal reviews.
- Human actions: none for local source and injected-fake tests. This card does
  not request a wallet permission, select an account, switch a chain, sign,
  relay, create a durable record, send a transaction, or perform a live action.

## Purpose

The accepted wallet island reads its session after an explicit Connect or
Retry. If the user changes the selected MetaMask account or chain afterward,
the page can keep rendering the old in-memory state until a reload or another
manual read. M50 makes that stale display fail closed: after a native provider
session-change event, actionable child content is hidden immediately and the
existing passive session reader re-evaluates the currently exposed account and
chain.

## Local authority

The implementation contract is
[M50 wallet session change synchronization](../../../specs/m50-wallet-session-change-synchronization.md).
The implementation plan is
`docs/superpowers/plans/2026-09-11-m50-wallet-session-change-synchronization.md`.

The candidate surface is exactly:

- `apps/web/src/lib/wallet/metamask-provider.ts`;
- `apps/web/src/components/wallet/wallet-connect.tsx`;
- `apps/web/tests/wallet-state.test.mjs`; and
- `apps/web/tests/wallet-session-sync.test.mjs` (new).

S26-T010 remains an inbox-only, larger shared-session presentation slice with
no active reservation. When it is later rebased, it must preserve the M50
event synchronization behavior. M50 does not create or advance S26.

## Contract

- After an explicit successful Connect or Retry has selected the existing sole
  MetaMask provider, subscribe only when that provider supports both native
  `on` and `removeListener` methods.
- Subscribe exactly to `accountsChanged` and `chainChanged`; ignore event
  payloads as untrusted hints.
- On either event, immediately render the existing non-actionable connecting
  state, then call only the existing `readCurrentSession` boundary. That
  boundary may issue only its existing passive `eth_chainId` and `eth_accounts`
  reads.
- Do not call `eth_requestAccounts`, `wallet_switchEthereumChain`,
  `wallet_addEthereumChain`, a signer method, a relay, an API, or a transaction
  from a session-change event.
- The re-read must preserve the accepted closed state union: no account becomes
  `disconnected`, another account becomes `not_issuer`, another chain becomes
  `wrong_chain`, and the approved account on Hedera Testnet becomes `connected`.
- Cleanup removes the exact two listeners on local Disconnect and component
  unmount. A provider without either cleanup-capable event method remains
  usable but is not subscribed.
- This card does not amend `wallet-state.ts`, the command bridge, the relay,
  the signature dialog, `deploy-stage-signing.tsx`, configuration, or any
  Stage-B behavior. Existing signing still independently revalidates chain and
  account before a wallet request.

## Candidate ready requirements

- The card, local specification, plan, catalog, ownership, State, and decision
  record resolve at one committed repository revision before any test or source
  change.
- S15-T010, S16-T010, and M49-T010 remain accepted with no active reservation
  on the four candidate paths. S26-T010 remains `00-inbox` only.
- The two existing target paths are present and the new focused test is absent.
- The exact focused baseline, queue validation, whitespace validation, and the
  enabled local-reference guard are clear under Node 22.21.1.

## Readiness review

The independent [M50 readiness review](../../evidence/M50-T010-ready-review.md)
is clear at clean control head `795a5c1`. S15-T010 and S16-T010 are accepted,
M49-T010 is compatibility-only and accepted with no active reservation, and
S26-T010 remains inbox-only. The three existing candidate paths are present,
the new focused test is absent, and no source has changed. A separate fresh
activation may authorize only the two durable test paths; all source remains
prohibited until independent RED acceptance.

## Activation review

The independent [M50 activation review](../../evidence/M50-T010-activation-review.md)
is clear at current merged control head `96cce4c540c0510a9ab871b577a8b8f0b40ad9f6`.
Only durable RED changes to the following exact test paths are active:

- `apps/web/tests/wallet-state.test.mjs`; and
- `apps/web/tests/wallet-session-sync.test.mjs`.

Every source path remains prohibited pending independent RED acceptance. This
activation grants no discovery, account read or selection, chain switch,
signature, relay, request, transaction, deployment, or live action.

## RED acceptance

The independent [M50 RED review](../../evidence/M50-T010-red-review.md) accepts
durable test-only commit `3d8ad88a5d654b974ef7154874a7564d0f3e938e`. The durable
contract fails only for the absent native helper and island wiring; it separately rejects missing
cleanup capability, absent unmount/disconnect cleanup, unsafe event-handler
work, and direct raw event wiring.

The exact GREEN surface is now limited to:

- `apps/web/src/lib/wallet/metamask-provider.ts`;
- `apps/web/src/components/wallet/wallet-connect.tsx`;
- `apps/web/tests/wallet-state.test.mjs`; and
- `apps/web/tests/wallet-session-sync.test.mjs`.

`wallet-state.ts`, deploy-stage signing, every command/relay boundary,
configuration, packages, lockfiles, and all wallet/provider/live actions
remain prohibited. GREEN must preserve event payload as an untrusted hint and
use only the existing passive current-session reader.

## GREEN acceptance

The independent [task review](../../evidence/M50-T010-task-review.md),
[specification review](../../evidence/M50-T010-module-review-spec.md), and
[standards review](../../evidence/M50-T010-module-review-standards.md) are
clear. The accepted source set is the native event seam at `20ac68f`, passive
island wiring at `f10551d`, and stale-read correction at `03c5f36`.

The event seam is cleanup-capable, subscribes only to the two declared native
events, ignores their payloads, and does not itself request the provider. The
island enters `connecting` before its passive read. A monotonic read generation
prevents an older same-provider read from restoring actionable content after a
newer event or cleanup. No event path requests accounts, switches chains,
signs, relays, fetches, or submits a transaction.

Focused wallet/session/deploy tests, the complete Web suite, Web typecheck,
root lint, queue/reference/whitespace checks, the enabled local-reference
guard, and a non-signing local Next/Turbopack browser confirmation are clear
under Node 22.21.1. This card is accepted at `60-done`; it grants no wallet
permission, account selection, signature, relay, transaction, or live action.

## Verification

- A durable RED commit first changes only
  `apps/web/tests/wallet-state.test.mjs` and the new
  `apps/web/tests/wallet-session-sync.test.mjs`.
- Focused injected-provider tests prove exact event registration, no
  subscription without cleanup support, payload-independent callback handling,
  cleanup, no provider request during the helper callback, and the component's
  immediate non-actionable/passive-reader wiring.
- GREEN changes only the four candidate paths. It preserves the existing
  no-storage/no-Wagmi/no-second-wallet and click-only discovery contracts.
- Run the focused wallet tests, affected deploy/signing tests, complete Web
  tests, Web/root typecheck and lint, queue/reference/whitespace checks, the
  enabled guard, and an independent task plus module review.

## Boundary

M50 is a client-session synchronization correction only. It neither grants nor
uses wallet permission, account selection, chain switch, signing, relay,
authority provisioning, payment, transaction, candidate, verification,
deployment, or live evidence. Browser confirmation must remain non-signing;
any signature or other wallet action is a separate human gate.
