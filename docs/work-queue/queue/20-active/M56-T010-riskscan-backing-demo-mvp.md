# M56-T010 — RiskScan backing demo MVP

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: S15-T010 accepted, S18-T010 accepted, M16-T010 accepted,
  M40-T010 accepted
- Owner: This lane owns this card and the M56 specification. The root retains
  queue movement, later source/test reservation, and every shared dependency.
- Human actions: Runtime configuration, BACKER provisioning, wallet use,
  signature, HBAR transfer, deployment, and demo recording remain human-owned.

## Proposed scope

The repository owner authorized one narrow successor to accepted S18. It makes
the backing journey actionable only for the canonical, OPEN RiskScan offering
with an explicit server-configured testnet treasury, adds its detail-page entry
point, and preserves the existing one-signature/one-transfer truth boundary.

The task may not add a funding ledger, persistence, allocation, a receipt
verifier, retry, transfer recovery, capacity handling, another wallet or relay,
an authority record, `external.attachCandidate`, token action, refund, payout,
or another project route. A returned transaction hash is shown only as
`payment_submitted` with allocation pending.

## RED activation

M56 may amend only its focused executable contract: the new projection and
presentation tests plus the three existing backing/detail contract tests. All
production source remains prohibited until the expected RED result is accepted.

## Shared boundaries

M56 does not modify the existing offering reader, wallet session, Signature
Dialog, command relay, or command admission. If root integration changes any
of those paths, it must preserve this card's closed projection and one-send
contract.
