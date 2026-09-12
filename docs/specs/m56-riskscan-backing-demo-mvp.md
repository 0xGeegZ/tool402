# M56 RiskScan backing demo MVP

## Proposed delivery boundary

M56 proposes a narrow successor to accepted S18: one already-admitted, OPEN
RiskScan campaign may become actionable through a server-owned projection and
an explicit server configuration treasury. No product source or executable
contract is reserved by this intake.

The proposed result is deliberately only this sequence:

```text
OPEN RiskScan offering -> Back this tool -> HEDERA_FUNDING signature
-> one explicit MetaMask HBAR submission -> transaction hash
-> Payment submitted / Allocation pending
```

No returned wallet hash is confirmation, settlement, allocation, token
ownership, or a contribution record. There is no persistence, capacity
reservation, verifier, refund, payout, token action, automatic retry, or
external candidate attachment in this card.

## Proposed controls

Any later readiness must establish the exact source/test reservation and a
durable RED contract before implementation. It must retain S18's bigint money
calculation, one user-clicked transfer, fresh account/chain read, shared
signature/relay path, canonical transaction hash display, no automatic retry,
and the truthful allocation-pending terminal state.

## Human and runtime boundaries

Human Ops alone may configure the treasury, provision the dedicated chain-296
BACKER authority for HEDERA_FUNDING, connect the wallet, sign, send HBAR,
deploy, or demonstrate a live payment. This intake neither reads a secret nor
performs any of those actions.
