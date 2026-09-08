# M37 Stage A real-issuer ATS_CREATE authority integrity projection

## Delivery boundary

M37 adds one private Backend projection of the exact Stage A authority accepted
in [HA-ATS-LIVE-AUTHORITY-001](../work-queue/evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md)
and independently reviewed in
[M36-T010 authority review](../work-queue/evidence/M36-T010-authority-review.md).
It returns fresh, detached, frozen data only. It has no input and therefore
accepts no browser, signer, environment, network, configuration, database, or
caller-selected value.

This projection is not a Convex `commandAuthorities` record, does not enable
M33, and does not make a command admissible, durable, prepared, executable,
paid, settled, or live. It is not an ATS SDK adapter and must never initialize
an SDK, construct a request, connect a provider, prompt a wallet, or submit an
operation.

## Private API

The planned private Backend module exports only this runtime function and its
TypeScript-only result types. It is not exported by `@tool402/backend`.

```ts
export function createStageARealIssuerAtsCreateAuthority():
  StageARealIssuerAtsCreateAuthority;
```

Every call returns a newly allocated, deeply frozen root. Its planned authority
is descriptive only and must be named to show that it is unprovisioned; it is
never written to Convex. Its exact tuple is:

```text
chainId                = 296
canonicalSignerAddress = 0xc89f87052c3e080b4a9b021d4930055031ef378e
principalPublicId      = tool402_ats_issuer_testnet_v1
role                   = ISSUER
ownedSubjectPublicIds  = [riskscan_revenue_note_demo]
authorityVersion       = ats_issuer_testnet_v1
enabled                = true
```

The returned `atsCreateConfiguration` is a direct literal closed copy of the
accepted M35 configuration described in
[M35 local unsigned ATS_CREATE configuration](m35-local-unsigned-ats-create-configuration.md),
with exactly one changed M33-preimage value:

```text
parameters.diamondOwnerAccount =
0xc89f87052c3e080b4a9b021d4930055031ef378e
```

It must use direct literals rather than import M35 at runtime. M35's synthetic
issuer and configuration remain separately non-authoritative. The projection's
signer and `diamondOwnerAccount` must be exactly equal before it returns.

## Canonical binding invariant

On every call, M37 creates the exact eleven-field M33 preimage from fresh
literal configuration data, serializes it with Core's accepted RFC8785-JCS
canonicalizer, Keccak-256 hashes the UTF-8 bytes with the already direct
Backend `viem` dependency, removes `0x`, and requires this exact result:

```text
d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250
```

The preimage field order is exactly:

```text
protocol
network
chainId
subjectPublicId
offeringVersion
registryRevision
operationKind
targetKind
expectedTarget
operationDescriptor
parameters
```

Source drift, hash mismatch, or signer/owner mismatch must throw before a
projection is returned. The M35 synthetic hash
`eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f`
and synthetic owner must never be returned by M37.

## Explicit exclusions

Do not alter M35, M33's compiled zero-enabled manifest, M32 durable admission,
Convex schema/functions, existing ingress source, RiskScan persistence,
Backend public barrel, packages, lockfile, Web/UI, Agent, configuration,
environment, generated output, or any existing test.

Do not import the ATS SDK or any wallet/provider package. Do not access Convex,
an environment variable, clock, storage, network, HTTP, key, wallet, browser
provider, account, transaction, payment, funding, allocation, clearing, HCS,
payout, deployment, or live evidence. Do not call `Network.init`,
`Network.connect`, `new CreateBondRequest(...)`, or `Bond.create(...)`.

M33 remains zero-enabled, and M32 does not receive this projection. This source
projection does not establish runtime signer-to-owner enforcement. A later
separately reviewed M32/M33 amendment and a distinct Stage B Human Ops GO are
required before authority provisioning or executable ATS behavior.

## Acceptance evidence

- A test-only RED commit precedes the projection source.
- Focused tests prove the exact planned authority and configuration, independent
  canonical hash, signer/owner equality, M35 one-field preimage difference,
  full immutability, independent-call detachment, private-module surface, no
  public Backend export, retained M33 zero-enabled state, and no prohibited
  import/call/configuration capability.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
