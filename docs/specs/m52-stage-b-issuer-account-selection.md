# M52 Stage-B issuer account selection

## Outcome

The Stage-B browser bridge accepts a MetaMask `eth_accounts` array that
contains the fixed issuer exactly once, even when other site-authorized
accounts are present.

## Invariants

- The bridge still requires `eth_chainId === "0x128"` before any send.
- Each `eth_accounts` item must be a valid EVM address.
- After valid-address normalization, the fixed canonical issuer must occur
  exactly once; absent or duplicate issuer occurrences reject before a send.
- A qualifying multi-account response changes neither the fixed `from` issuer
  nor any Factory, calldata, value, digest, receipt, Mirror, or candidate
  behavior.
- The change is local source/test work only. It never performs a real provider
  request, transaction, or external read during implementation or tests.

## Acceptance

- An injected valid array containing the issuer once and other valid accounts
  reaches the existing single fixed send boundary.
- An injected array without the issuer rejects before a send.
- An injected array with the issuer more than once rejects before a send.
- Existing wrong-chain and one-account issuer contracts remain unchanged.
