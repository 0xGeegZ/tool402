# HA-COMMAND-AUTHORITY-002 — Recommended decision packet

## Status and scope

**RECOMMENDED — awaiting explicit human acceptance.** This packet amends
[HA-COMMAND-AUTHORITY-001](HA-COMMAND-AUTHORITY-001-decision.md) only as
stated below; every rule of the accepted decision not restated here is
unchanged. It becomes authority only when the human operator accepts it and
the root records that acceptance as a decision row. Nothing is inferred from
the packet's presence.

- Prepared: `2026-09-08T19:14:19Z` by the human operator's delegated session
  under the [HI-002 intake card](../queue/60-done/HI-002-campaign-deploy-reinstatement.md).
- Decision owner on acceptance: human operator (repository owner).

The decision, once accepted, authorizes only a local authenticated
normalization and signature-verification boundary over an extended command
vocabulary. It authorizes no wallet call, account setup, funding, payment,
provider invocation, transaction, deployment, publication, or other external
action. Every unspecified value fails closed.

## Command vocabulary

The command `type` field admits exactly four literals:

```text
external.prepare
offering.create
directory.publish
external.attachCandidate
```

The EIP-712 domain `{ name: "Tool402", version: "1", chainId: 296 }`, the
primary type `Tool402Command`, its field order (`version:uint8`,
`type:string`, `signer:address`, `nonce:string`, `issuedAt:string`,
`expiresAt:string`, `payloadHash:bytes32`), the nine-field wire command, the
signature grammar, the nonce grammar, the timestamp grammar, the clock window,
and the replay identity
`tool402:wallet-command:v1:296:<canonicalSigner>:<nonce>` are exactly those of
HA-COMMAND-AUTHORITY-001. The replay identity is deliberately not type-scoped:
one nonce is spendable once across the whole vocabulary.

## Detached payload binding per type

Each type binds exactly one closed payload; `payloadHash` is the lower-case
`0x`-prefixed Keccak-256 digest of the UTF-8 RFC 8785 JCS representation of
that payload. The normalizer must independently parse the payload through the
type's parser, recompute the digest, and require exact equality.

| Type                       | Payload                                               | Parser owner |
| -------------------------- | ----------------------------------------------------- | ------------ |
| `external.prepare`         | the accepted eight-field M26 `ExternalPreparePayload` | accepted M26 |
| `offering.create`          | `OfferingCreatePayload`                               | M38-T010     |
| `directory.publish`        | `DirectoryPublishPayload`                             | M38-T010     |
| `external.attachCandidate` | `AttachCandidatePayload`                              | M38-T010     |

For `external.attachCandidate`, `attemptPublicId` is the canonical M26
idempotency key of the prepared `external.prepare` attempt the candidate
belongs to and is never equal to the payload's own `idempotencyKey`;
`candidateEvmAddress` is required for `ATS_CREATE` and absent for every
other kind. Command `expiresAt` and payload `expiresAt` remain byte-for-byte
identical.

## Signer authority per type

Authority is resolved from the same server-side `commandAuthorities` record
keyed by `(chainId = 296, canonicalSignerAddress)`; exactly one enabled
matching record is acceptable.

| Command                                   | Required authority                                               |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `external.prepare`, kind `ATS_*`          | `ISSUER` owning the payload `subjectPublicId`                    |
| `external.prepare`, kind `HEDERA_FUNDING` | `BACKER`                                                         |
| `offering.create`                         | `ISSUER` owning the payload `subjectPublicId`                    |
| `directory.publish`                       | `ISSUER`, plus a deferred `OFFERING` subject-ownership reference |
| `external.attachCandidate`                | `ISSUER`, plus a deferred `ATTEMPT` subject-ownership reference  |

Owning is exact membership in `ownedSubjectPublicIds`. A `directory.publish`
payload names an offering and an `external.attachCandidate` payload names an
attempt; neither carries a subject identifier, so the normalizer enforces the
`ISSUER` role and returns the deferred reference. The durable boundary that
owns the referenced offering or attempt must resolve that reference and bind
the stored subject to the same `principalPublicId` before any write. A
consumer that ignores the reference has not satisfied this decision.

## Explicit deferral

This packet creates no `commandAuthorities` row, offering, directory version,
attempt transition, ATS target or parameter mapping, provider invocation, or
durable record. Those remain with the separately carded boundaries and their
own human gates.

## Acceptance

The human operator accepts by confirming this packet in their own words to
the root or the delegated session. The root then records the acceptance as a
decision row naming this file and may execute the dependency-correct local
successor cards without another general approval. Acceptance authorizes no
credential, key, signing, wallet, account, funding, transaction, deployment,
or mainnet behavior.
