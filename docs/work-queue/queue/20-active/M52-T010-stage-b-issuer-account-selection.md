# M52-T010 — Stage-B issuer account selection

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M47-T010 accepted, M48-T010 accepted, M50-T010 accepted.
- Owner: root integrator owns queue/control records, reviews, integration, commits, and pushes.
- Human actions: none. This card does not authorize a wallet request, transaction, Mirror read, candidate, attachment, or other live action.

## Purpose

MetaMask legitimately returns every account that the user authorized for a
site from `eth_accounts`. The Stage-B bridge currently rejects that ordinary
multi-account response even when the fixed approved issuer is present exactly
once. The Provider UI consequently reports a generic local rejection before
requesting `eth_sendTransaction`.

## Local authority

The implementation contract is [M52 Stage-B issuer account selection](../../../specs/m52-stage-b-issuer-account-selection.md).
The [M52 readiness review](../../evidence/M52-T010-ready-review.md) and
[M52 activation review](../../evidence/M52-T010-activation-review.md) are clear.

## RED acceptance and GREEN authorization

The [M52 RED review](../../evidence/M52-T010-red-review.md) is clear. Its
single intended failure proves that the existing strict array-length guard
rejects a valid MetaMask account set containing the issuer once. The minimal
GREEN scope is exactly `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`
and `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`.

## Boundary

M52 changes only the pre-send `eth_accounts` membership check. The chain must
remain exactly `0x128`, the issuer must remain the fixed canonical address,
and `eth_sendTransaction` must keep its fixed `from`, Factory `to`, calldata,
and zero value. Missing issuer, malformed entries, or duplicate issuer entries
remain rejected before a send. The card changes no configuration, digest,
wallet selection, authority, transaction, receipt, Mirror, candidate,
attachment, deployment, or live-action boundary.
