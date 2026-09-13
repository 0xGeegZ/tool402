# M58-T010 — Verified backing record

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M43-T010 accepted.
- Owner: root integrator for this card, its specification, focused contracts,
  backing/server projection, dashboard presentation, verification, and draft PR.
- Human actions: Wallet connection, signature, HBAR transfer, authority
  provisioning, deployment, and demo narration remain human-owned.

## Scope

M58 extends the existing M56 `HEDERA_FUNDING` attempt only after MetaMask has
returned a canonical transaction hash. It consumes S40's existing signed
dashboard session without changing it. That session reveals the already signed
intent parameters alongside the hash; the server recomputes the stored
commitment before forwarding through the existing protected provider-session
ingress. The backend attaches it to the already admitted attempt, reads the
pinned Hedera Testnet evidence, and records only a verified `CONFIRMED`,
`REJECTED`, or still-uncertain outcome. The backing page and the signed backer
dashboard read that durable record after reload.

## Exclusions

This card does not send, repeat, speed up, cancel, or sign a wallet action. It
does not allocate note units, create a ledger, promise a payout, alter offering
terms, change command authorities, configure environment values, deploy, or
perform a live verification in tests. A browser receipt wait may inform the
immediate UI but never creates durable confirmation.

## Activation

The user approved this bounded page-plus-backer-dashboard continuation after a
confirmed testnet transfer exposed M56's intentional submitted-only boundary.
M58 starts with a focused RED contract. Product source is limited to the paths
declared in its specification; M56's existing calculation and one-send guard
remain intact.
