# HA-ATS-M33-ENABLEMENT-001 — Accepted local enablement decision

## Acceptance

Decision owner: `0xGeegZ`

Recorded at: `2026-09-10T19:25:33Z`

The human accepted the exact Phase-A local-only decision recorded in
[HA-ATS-STAGE-B-001-recommended-decision-v2.md](HA-ATS-STAGE-B-001-recommended-decision-v2.md).
The accepted decision authorizes the normal local delivery cycle for one
fixed M33 `ATS_CREATE` mapping only.

## Fixed mapping

```text
network                 = hedera:testnet
chainId                 = 296
canonicalSignerAddress  = 0xc89f87052c3e080b4a9b021d4930055031ef378e
principalPublicId       = tool402_ats_issuer_testnet_v1
role                    = ISSUER
ownedSubjectPublicIds   = [riskscan_revenue_note_demo]
authorityVersion        = ats_issuer_testnet_v1
subjectPublicId         = riskscan_revenue_note_demo
offeringVersion         = ats_demo_v1
registryRevision        = ats_sdk_8_0_0_testnet_v2
operationKind           = ATS_CREATE
targetKind              = EVM_ADDRESS
expectedTarget          = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
factoryHederaId         = 0.0.9213391
resolverHederaId        = 0.0.9212226
canonicalParametersHash = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
schemaVersion            = 1
enabled                  = true
```

The record's `operationDescriptor` and `parameters` must be byte-identical to
the accepted M42 real-issuer projection. Any field or hash drift stops work
for a new human decision.

## Exact authority and exclusions

This decision supersedes only the earlier allocation that reserved this one
reviewed static M33 mapping to `HA-ATS-STAGE-B-001`. It permits the smallest
local card to add that fixed source-only mapping and its tests through the
ordinary specification, RED, GREEN, review, acceptance, commit, and push
cycle.

It does not provision `commandAuthorities`, publish Convex, read an
environment value, use an SDK, connect a wallet or provider, call RPC or
Mirror, construct calldata, send a request, create an asset or candidate, or
make a transaction. `HA-ATS-STAGE-B-001` remains pending and is the only live
execution gate.
