# HA-ATS-LIVE-AUTHORITY-001 — Recorded Stage A human decision

## Status and boundary

**RECEIVED — pending independent authority review.**

- Decision owner: `0xGeegZ`
- Root receipt timestamp: `2026-09-08T12:26:05Z`
- Authorized stage: `A` only

The human explicitly authorized one secret-free, source-only authority and
integrity record for the dedicated Tool402 Hedera-testnet issuer below. This
record is not a provisioned runtime authority and does not authorize Stage B
or any external action.

## Exact issuer and future authority tuple

```text
chainId                   = 296
canonicalSignerAddress    = 0xc89f87052c3e080b4a9b021d4930055031ef378e
principalPublicId         = tool402_ats_issuer_testnet_v1
role                      = ISSUER
ownedSubjectPublicIds     = [riskscan_revenue_note_demo]
authorityVersion          = ats_issuer_testnet_v1
enabled                   = true (future planned record only; unprovisioned)
```

The human attests that `canonicalSignerAddress` is a dedicated disposable
Tool402 Hedera-testnet issuer controlled by Human Ops. The exact same
canonical lower-case address is required as
`parameters.diamondOwnerAccount`:

```text
canonicalSignerAddress === parameters.diamondOwnerAccount
```

This equality is a Stage A source-integrity requirement. It is not currently
a runtime M32/M33 enforcement path and must not be represented as one.

## Immutable ATS_CREATE configuration

The human re-adopts the complete immutable configuration in
[HA-ATS-CONFIGURATION-001](HA-ATS-CONFIGURATION-001-decision.md), including
the exact SDK identity/integrity, network, target, operation descriptor,
parameters, compatible `REG_S / NONE` pair, and explicit M20 non-binding
declaration.

For this Stage A decision, the closed exact-copy rule is:

1. Copy the eleven-field M33 preimage defined by that accepted decision
   without reordering, omission, defaulting, or normalization.
2. Replace only
   `parameters.diamondOwnerAccount` with
   `0xc89f87052c3e080b4a9b021d4930055031ef378e`.
3. Leave every other descriptor and parameter field byte-for-byte equivalent
   after RFC8785-JCS canonicalization.

The resulting preimage is exactly:

```text
protocol          = tool402:ats-parameters:v1
network           = hedera:testnet
chainId           = 296
subjectPublicId   = riskscan_revenue_note_demo
offeringVersion   = ats_demo_v1
registryRevision  = ats_sdk_8_0_0_testnet_v1
operationKind     = ATS_CREATE
targetKind        = EVM_ADDRESS
expectedTarget    = 0x5fa65ca30d1984701f10476664327f97c864a9d3
operationDescriptor and parameters = the closed exact-copy values above
```

The independently recomputed RFC8785-JCS UTF-8 Keccak-256 digest, without
`0x`, is:

```text
d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250
```

The prior synthetic M35 digest
`eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f`
must never be used as this real-issuer mapping's digest.

## Stage A implementation boundary

Stage A may create only a local source projection that freezes the exact
tuple, independently recomputes the digest, and proves the signer/owner
equality as data. M33's current production manifest remains zero-enabled.
M32 remains unchanged and no `commandAuthorities` row may be created.

In particular, current M33 receives only an external-prepare payload, while
the current M32 authority read does not independently compare the recovered
signer to `diamondOwnerAccount`. Therefore this decision does not authorize an
enabled M33 record under the current implementation. A later separately
reviewed authority amendment must establish that runtime comparison before any
enabled mapping, provisioning, publication, or execution is considered.

## Explicit non-authorizations

This decision authorizes none of the following:

- MetaMask, wallet, provider, key, account, or signature interaction;
- SDK dependency/import/initialization/request construction/call;
- Convex publication, deployment, environment access, or authority-row
  provisioning;
- durable admission, external attempt, funding, payment, transaction, ATS
  asset creation, holder/compliance action, clearing, HCS, payout, or live
  evidence; or
- any Stage B action.

`ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and `ATS_COUPON` remain
fail-closed.

## Human declaration recorded by the root

The human explicitly approved the real issuer above, required it to be the
same `diamondOwnerAccount`, re-adopted every other immutable M35/M36
configuration value, attested Human Ops control of the dedicated testnet
identity, and authorized only the Stage A source-only authority mapping and
integrity recomputation. The human explicitly rejected MetaMask, SDK,
provider, transaction, ATS asset, deployment, publication, and Stage B
actions.
