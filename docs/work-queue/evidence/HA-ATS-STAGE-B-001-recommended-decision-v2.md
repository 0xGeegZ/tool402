# HA-ATS-M33-ENABLEMENT-001 — Recommended local-enablement decision packet

## Status

**DRAFT — no authority is active until the human declaration below is accepted
and recorded on canonical main.** This is deliberately a Phase-A local
enablement decision, not a Stage-B live GO. The earlier draft must not be used
as a GO because it mixed an `ATS_CREATE` mapping with unsupported
`ATS_CONTROL_LIST` and `ATS_ISSUE` actions and assumed execution paths that do
not yet exist. Acceptance creates a distinct
`HA-ATS-M33-ENABLEMENT-001` decision/intake record and leaves the existing
`HA-ATS-STAGE-B-001` human-action row **PENDING and untouched** until a later
live GO.

## Fixed ATS_CREATE authority

The only configured operation is one `ATS_CREATE` on Hedera Testnet:

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
```

The one future M33 record must additionally set exactly:

```text
schemaVersion = 1
enabled       = true
```

Its `operationDescriptor` and `parameters` must be byte-identical to the
complete frozen M42 real-issuer projection, and the M33 preimage must contain
exactly the eleven M42 fields in their accepted order. Nothing in this packet
changes, defaults, normalizes, or recomputes a configuration field. Any
mismatch is a stop condition requiring a new human decision.

## Authorized Phase A — local enablement work only

After this packet is accepted, the root may create `M48-T010`, the smallest
local successor for the exact M33 `ATS_CREATE` mapping above, then follow the
normal specification, RED, GREEN, independent-review, acceptance, commit, and
push process.

M48-T010 may only add the one schema-versioned, enabled, fixed M33 record
described above and the focused tests necessary to prove that it is the only
admissible ATS mapping. It must preserve rejection of every other ATS kind and
all mismatched values.

Phase A must not:

- publish Convex or deploy any code;
- provision a `commandAuthorities` row;
- read an environment value, key, signer, wallet, provider, RPC, or Mirror
  Node in automated validation;
- send a request, prompt a wallet, construct or submit calldata, create an
  asset, attach a live candidate, or make a transaction; or
- enable `ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, or `ATS_COUPON`.

An accepted local source change alone is not a live GO.

## Explicitly deferred work

This decision does not authorize a positive ATS receipt verifier, a candidate
attachment, a `deployBond` execution boundary, a provider/wallet connection,
Convex publication, a `commandAuthorities` row, a host, a transaction, or
receipt/finality observation.

Before a separate live Stage-B decision can be requested, three independently
reviewed successors must first define and accept:

1. the exact ATS_CREATE receipt observation, documented created-address field,
   candidate binding, and M40 state transition;
2. the exact browser/provider transaction-execution boundary; and
3. the exact rehearsal commit and named host/runtime proof.

That later packet must state the bounded fee cap, stop conditions, no-retry
rule, and a single permitted `ATS_CREATE` transaction. It must not authorize
`ATS_CONTROL_LIST`, `ATS_ISSUE`, allocation, funding, transfer, coupon, or
any other lifecycle operation unless a later distinct authority names their
complete mappings and verification rules.

## Explicit human declaration

> I approve HA-ATS-M33-ENABLEMENT-001 exactly as recorded in
> `docs/work-queue/evidence/HA-ATS-STAGE-B-001-recommended-decision-v2.md`.
> I approve only the Phase-A local source-only M33 ATS_CREATE enablement work
> described here. I reject every live, provider, wallet, authority-row,
> deployment, host, transaction, candidate, receipt, finality, funding, and
> lifecycle action. HA-ATS-STAGE-B-001 remains PENDING and untouched. I reject
> all implicit defaults and all operations not expressly listed.

Decision owner: `0xGeegZ`

Decision timestamp: `<fill at acceptance>`
