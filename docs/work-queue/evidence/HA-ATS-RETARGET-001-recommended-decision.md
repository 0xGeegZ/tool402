# HA-ATS-RETARGET-001 — Recommended decision packet

## Status and scope

**RECOMMENDED — awaiting explicit human acceptance.** This packet proposes
one secret-free, local, unsigned `ATS_CREATE` configuration for the SDK
8.0.0 testnet deployment. On acceptance it supersedes the target, resolver,
and registry-revision values of
[HA-ATS-CONFIGURATION-001](HA-ATS-CONFIGURATION-001-decision.md) and the
digest of [HA-ATS-LIVE-AUTHORITY-001](HA-ATS-LIVE-AUTHORITY-001-decision.md)
for the retargeted revision only. Both earlier records stay in force as
historical authority for the accepted M35 and M37 projections, which remain
byte-unchanged. It becomes authority only when the human operator accepts it
and the root records that acceptance as a decision row.

- Prepared: `2026-09-08T19:14:19Z` by the human operator's delegated session
  under the [HI-002 intake card](../queue/60-done/HI-002-campaign-deploy-reinstatement.md).
- Decision owner on acceptance: human operator (repository owner).

The decision, once accepted, creates no executable issuer,
`commandAuthorities` row, M32 durable-admission path, enabled M33 entry, SDK
import, SDK initialization, wallet or provider interaction, transaction,
asset, account action, funding, payment, deployment, or live claim. A later
Stage B gate must separately authorize every executable step.

## Basis

Observed against primary sources on 2026-09-08: the accepted factory proxy
`0.0.7708432` runs the contracts v4.0.0 implementation of 2026-01-22, whose
runtime bytecode dispatches `deployBond` selector `0x5133f0e0` only, while
SDK 8.0.0 ABI-encodes `deployBond` as selector `0x29002951`; an `eth_call`
with that selector against the accepted proxy reverts with empty data. The
SDK 8.0.0 testnet deployment of 2026-06-12 is factory proxy `0.0.9213391`
(`0xd1f118a40f3b02883d35909ef2517e7edd78379d`, implementation `0.0.9212655`)
and business-logic resolver proxy `0.0.9212226`
(`0xba2d5fc2083a0b8f164c50e65d782087fba18e0a`). Mirror Node confirms both
contracts exist with runtime bytecode. The bond configuration id
`0x…02` and version `1` are unchanged in that deployment.

## Replaced values

Exactly these values change; every other descriptor, parameter, network,
SDK identity, and integrity value is byte-equal to HA-ATS-CONFIGURATION-001
after RFC 8785 JCS canonicalization.

```text
registryRevision                                 = ats_sdk_8_0_0_testnet_v2
expectedTarget                                   = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
operationDescriptor.factoryHederaId              = 0.0.9213391
operationDescriptor.resolverHederaId             = 0.0.9212226
resolverHederaId (root)                          = 0.0.9212226
resolverEvmAddress (root, not a preimage member) = 0xba2d5fc2083a0b8f164c50e65d782087fba18e0a
```

## Recomputed canonical digests

Both digests are the Keccak-256 of the UTF-8 RFC 8785 JCS bytes of the
eleven-field M33 preimage (`protocol`, `network`, `chainId`,
`subjectPublicId`, `offeringVersion`, `registryRevision`, `operationKind`,
`targetKind`, `expectedTarget`, `operationDescriptor`, `parameters`), with
`0x` removed. They were computed with the repository's accepted Core
canonicalizer and the Backend's pinned `viem`, after first reproducing the
accepted M35 digest
`eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f` and the
accepted M37 digest
`d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250` exactly
from their recorded preimages. The root must recompute both before M42-T010
enters RED.

```text
synthetic issuer  (parameters.diamondOwnerAccount = 0x0000000000000000000000000000000000000402)
  39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a

real issuer       (parameters.diamondOwnerAccount = 0xc89f87052c3e080b4a9b021d4930055031ef378e)
  1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

The real-issuer preimage keeps the Stage A rule of HA-ATS-LIVE-AUTHORITY-001:
`canonicalSignerAddress === parameters.diamondOwnerAccount`, and the planned
authority tuple (`tool402_ats_issuer_testnet_v1`, `ISSUER`,
`[riskscan_revenue_note_demo]`, `ats_issuer_testnet_v1`) is unchanged.

## Explicit non-authorizations

Acceptance authorizes none of the following: MetaMask, wallet, provider,
key, account, or signature interaction; SDK dependency, import,
initialization, request construction, or call; Convex publication,
deployment, environment access, or authority-row provisioning; durable
admission, external attempt, funding, payment, transaction, ATS asset
creation, holder or compliance action, clearing, HCS, payout, or live
evidence; or any Stage B action. `ATS_CONTROL_LIST`, `ATS_ISSUE`,
`ATS_TRANSFER`, and `ATS_COUPON` remain fail-closed.

## Acceptance

The human operator accepts by confirming the replaced values and both
digests in their own words to the root or the delegated session. The root
then records the acceptance as a decision row naming this file, recomputes
both digests independently, and only then may M42-T010 enter RED. Every
executable step remains separately human-gated.
