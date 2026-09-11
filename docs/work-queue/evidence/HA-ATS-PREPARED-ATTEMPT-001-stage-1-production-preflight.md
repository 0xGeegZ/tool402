# HA-ATS-PREPARED-ATTEMPT-001 — Stage 1 production preflight

## Status

**CLOSED BEFORE SIGNATURE.** This is secret-free evidence of a bounded
production preflight only. It is not evidence of a wallet signature, relay,
offering, durable attempt, transaction, asset, candidate, receipt, finality,
or Stage B action.

## Authorized intent

The human authorized one temporary issuer authority record on Hedera testnet
for the exact issuer tuple below, followed by at most one UI-generated
`offering.create` signature on the named public host. The human did not
authorize `external.prepare`, a transaction, an ATS asset, a payment, a retry,
or Stage B.

```text
canonicalSignerAddress = 0xc89f87052c3e080b4a9b021d4930055031ef378e
chainId                = 296
principalPublicId      = tool402_ats_issuer_testnet_v1
role                   = ISSUER
authorityVersion       = ats_issuer_testnet_v1
ownedSubjectPublicIds  = [riskscan_revenue_note_demo]
```

The authorization named public source
`5de50e0ae045b60e6091877b7092d38b55178975`.

## Observed preflight and terminal stop

On 2026-09-11, the public host was inspected only in Arc. Its current
production deployment identified source
`aa0fdce4d6abaad2913eee05174b12da61dc61f5`, not the exact source named in the
authorization. No equivalence between those sources is inferred for a signing
decision.

The prefilled provider form reached wallet discovery without changing its
terms. Arc reported that MetaMask was not found, and Arc's extension inventory
contained no MetaMask extension. Therefore no EIP-1193 provider was available,
no signing prompt was requested, and no `offering.create` relay was invoked.

## Temporary authority and durable-store checks

Before temporary enablement, the exact issuer/chain tuple had no enabled
authority record. During the bounded preflight, exactly one matching record
held the approved fields above. After the terminal stop, that exact record was
set to `enabled: false` and independently checked inactive.

At closure, the production stores contained no offering, external-attempt, or
wallet-command replay artifact:

```text
offerings                       = empty
externalPrepareCommandAttempts  = empty
walletCommandReplayClaims       = empty
```

The disabled authority record itself remains one related durable record.

No credential, environment value, raw signature, signed header, payment
payload, private key, or funded secret was inspected or recorded.

## Required fresh gate before another Stage 1 attempt

1. The human must explicitly name the current production source or restore a
   production deployment to the source named in the authorization.
2. MetaMask must be made available, unlocked, and connected in Arc to the
   approved issuer account on chain `0x128`; the human must approve any wallet
   signature personally.
3. Only after those conditions, verify exactly one total record for the
   issuer/chain tuple, with the literal approved fields, `enabled: false`, and
   no duplicate. A newly exact human decision must authorize re-enabling and
   revoking that same record, or deleting it before a new insertion; it must
   never allow a second authority record to be inserted.

The authority remains disabled. No Stage B action is authorized by this record.
