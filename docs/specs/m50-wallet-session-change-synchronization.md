# M50 wallet session change synchronization

## Outcome

After an explicitly connected MetaMask session changes account or chain, the
wallet island no longer displays stale actionable content. It immediately hides
the child surface and passively derives the existing closed wallet state from
the provider's current chain and accounts.

## Inputs and trusted boundaries

- The existing EIP-6963/legacy selection boundary remains the sole way to
  choose MetaMask, and runs only inside the explicit Connect or Retry handler.
- Native EIP-1193 `accountsChanged` and `chainChanged` events are only
  invalidation signals. Their payloads have no authority.
- The existing `readCurrentSession` boundary remains the sole state decoder
  after an event. It reads `eth_chainId` and `eth_accounts`; it never requests
  accounts, switches a chain, signs, relays, or sends a transaction.
- The provider is subscribed only when it exposes both `on` and
  `removeListener`. Listener cleanup is mandatory whenever subscription occurs.

## Transitions

```text
explicit Connect or Retry
  -> selected MetaMask provider + existing wallet state
  -> subscribe to accountsChanged and chainChanged when cleanup-capable

accountsChanged or chainChanged
  -> connecting (actionable child content hidden)
  -> passive current-session read
  -> disconnected | wrong_chain | not_issuer | connected

Disconnect or unmount
  -> remove both listeners
  -> no retained listener can alter the rendered wallet state
```

The state union itself remains the accepted seven-kind union. No new state,
provider, account selection rule, persistence mechanism, or fallback wallet is
introduced.

## Invariants

- Event handling never calls `eth_requestAccounts`, a `wallet_*` method, a
  signing method, a relay, a fetch/API call, or a transaction method.
- Listener registration is exact and minimal: only `accountsChanged` and
  `chainChanged`.
- A missing event API is a safe no-subscription outcome, not an error or a
  fallback to polling.
- Listener cleanup is idempotent and makes later event invocations inert.
- M50 never changes the deploy stage state, request, results, candidate, or
  authority boundary. The existing dialog unmounts while the wallet island is
  non-connected, and its own signing bridge continues to re-read account and
  chain before any request.
- The implementation uses no browser storage, timer, automatic discovery,
  Wagmi, WalletConnect, Coinbase Wallet, or new dependency.

## Acceptance

Injected-fake tests must prove the event helper's exact registration/cleanup
and no-request behavior. Static integration checks must prove that the wallet
island enters its non-actionable state before calling `readCurrentSession` and
that only the native helper supplies event wiring. Existing wallet-state and
deploy/signing contracts remain green. No test may use a real provider, wallet,
account, signature, relay, endpoint, or transaction.
