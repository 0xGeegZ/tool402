# M48 ATS M33 local enablement

## Purpose

M48 adds one closed, compiled M33 `ATS_CREATE` authority record after the
accepted local enablement decision. It makes only the already accepted M42
real-issuer configuration eligible for the existing M33 predicate; it creates
no human authority row and invokes no external boundary.

## Fixed authority record

The production manifest may contain exactly one enabled record with these
fields:

```text
schemaVersion            = 1
network                  = hedera:testnet
chainId                  = 296
subjectPublicId          = riskscan_revenue_note_demo
offeringVersion          = ats_demo_v1
registryRevision         = ats_sdk_8_0_0_testnet_v2
operationKind            = ATS_CREATE
targetKind               = EVM_ADDRESS
expectedTarget           = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
canonicalParametersHash  = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
enabled                  = true
```

Its descriptor and parameters are the byte-identical M42 real-issuer values.
M33 must still derive the canonical eleven-field preimage with the accepted
RFC8785-JCS/Keccak boundary and require that exact hash.

## Required behavior

After M32 revalidates the current durable `commandAuthorities` record and M47
binds the command context to the real issuer, M33 admits only the exact record
above. Every other ATS kind, payload tuple drift, target drift, canonical-hash
drift, duplicate candidate, malformed record, or disabled candidate rejects
before replay/idempotency lookup or durable write. `HEDERA_FUNDING` keeps its
existing M33 bypass unchanged.

The change is limited to the compiled M33 manifest, its two focused Backend
test files, and the GREEN-only retirement of M37/M42/M43 historical assertions
that the downstream M33 manifest is empty. Those narrow test amendments
preserve every M37/M42 source, M42 preimage/digest, privacy, no-SDK-dependency,
and no-import invariant, plus M43's existing `NOT_CONFIGURED`-before-Mirror
behavior. It does not change M37, M42, M43, M47, M32 ordering, schema, public
exports, package files, configuration, or UI.

## Boundary

This is source-only local authority data. It does not provision a
`commandAuthorities` row, publish Convex, read runtime configuration, create
an attempt, call an SDK, connect a wallet/provider, build or submit calldata,
make a network call, create an asset/candidate, or claim testnet evidence.
`HA-ATS-STAGE-B-001` remains the separate human live-execution gate.

## Acceptance evidence

- Durable test-only RED precedes the manifest source change.
- Focused M33/M32 tests prove exactly one accepted M42/M47-aligned mapping and
  preserve every rejection and ordering invariant.
- Backend typecheck, relevant full Backend tests, root lint, queue/reference/
  whitespace checks, the enabled local-reference guard, and independent task
  plus module reviews are clear before acceptance.
