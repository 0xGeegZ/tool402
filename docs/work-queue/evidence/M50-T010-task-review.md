# M50-T010 independent task review

## Reviewed change

Review covers the accepted native event seam at `20ac68f`, passive island
wiring at `f10551d`, and final stale-read correction at `03c5f36`, after the
durable RED contract `3d8ad88`.

## Findings

**CLEAR.** The provider helper subscribes only when native registration and
removal are both available, registers exactly `accountsChanged` and
`chainChanged`, ignores event payloads, and makes retained callbacks inert on
idempotent cleanup. The island immediately renders `connecting`, then uses
only `readCurrentSession` for passive `eth_chainId`/`eth_accounts` reads.

The final race correction assigns each event read a monotonic generation. A
result is rendered only when both its provider and generation remain current;
effect cleanup and local disconnect invalidate pending results. Deferred fake
provider tests fail against the preceding island and pass against the accepted
source. No event path discovers a provider, requests accounts, switches a
chain, signs, relays, fetches, or submits a transaction.

## Verification

Under Node 22.21.1:

- focused wallet/session/deploy tests: 22/22 passed;
- complete Web suite: 346/346 passed;
- Web typecheck, root lint, queue validation, whitespace, and enabled
  local-reference guard passed; and
- fresh Next 16.3.4 Turbopack reported no compilation issue. An isolated
  non-signing browser rendered `/` and `/provider/deploy`; no Connect click,
  wallet prompt, signature, relay, or transaction was invoked.

## Verdict

Accept M50-T010 as a local, passive session-synchronization correction only.
Every wallet and live-action gate remains separate.
