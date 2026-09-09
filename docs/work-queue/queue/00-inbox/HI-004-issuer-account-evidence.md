# HI-004 — Testnet issuer account evidence intake

## Purpose

Human intake card. The human operator (repository owner) has completed the
funding step that `HA-ISSUER-ACCOUNT-001` asks for: the recorded disposable
Tool402 testnet issuer now exists as a Hedera testnet account. This card
carries the public evidence the row requires so the root can mark it
accepted. It authorizes no wallet, SDK, provider, asset, transaction,
deployment, publication, or live action.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-09
- Owner: root integrator on intake. The human-action row and its decision
  row are human-owned and root-recorded.
- Human actions: `HA-ISSUER-ACCOUNT-001` is complete as evidenced below.
  `HA-CAMPAIGN-CONVEX-001`, `HA-ATS-STAGE-B-001`, and
  `HA-B03-AGENT-PAYMENT-001` remain pending and untouched.

## Evidence

- Issuer address (unchanged from
  [HA-ATS-LIVE-AUTHORITY-001](../../evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md)):
  `0xc89f87052c3e080b4a9b021d4930055031ef378e`.
- Funding: the human operator requested 100 testnet HBAR for that address
  from the public Hedera portal faucet on 2026-09-09; the portal confirmed
  the transfer to the exact address above.
- Public account identifier, read from the Hedera testnet Mirror Node at
  `https://testnet.mirrornode.hedera.com/api/v1/accounts/0xc89f87052c3e080b4a9b021d4930055031ef378e`
  by the operator's delegated session after the transfer: account
  `0.0.10430887`, EVM address alias equal to the issuer address, balance
  10 000 000 000 tinybar (100 HBAR), created `2026-09-09T02:38:17Z`. The same record is
  visible at `https://hashscan.io/testnet/account/0.0.10430887`.
- The account was auto-created by the credit and carries no admin key yet;
  Hedera completes it with the ECDSA key on the first transaction that key
  signs, which is the human-executed Stage B `Bond.create` in MetaMask.
- Key material: the issuer's private key exists only in the human operator's
  MetaMask. It is not present in this repository, in any tracked or ignored
  file, in any environment value, or in any session transcript, and no agent
  has read it.

## Requested root records

1. One decision row marking `HA-ISSUER-ACCOUNT-001` accepted as bounded
   evidence of the funded issuer account, naming this card, the account
   identifier, and the Mirror Node reference.
2. No change to any other human-action row. M44-T010 may treat the row as
   accepted for its local delivery; every live ATS behavior still waits for
   `HA-ATS-STAGE-B-001`.

## Explicit non-authorizations

This card authorizes no wallet, key, signature, SDK, provider, asset
creation, transaction, funding of any other account, deployment,
publication, or live action.
