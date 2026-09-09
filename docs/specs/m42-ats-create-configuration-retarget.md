# M42 ATS_CREATE configuration retarget for the SDK 8.0.0 deployment

## Delivery boundary

M42 adds two private Backend projections of the `ATS_CREATE` configuration to
be re-supplied by HA-ATS-RETARGET-001 for the SDK 8.0.0 testnet deployment.
Each returns fresh, detached, frozen data. Neither takes input, so neither
accepts a browser, signer, environment, network, configuration, database, or
caller-selected value.

The first projection retargets the synthetic configuration accepted in
[HA-ATS-CONFIGURATION-001](../work-queue/evidence/HA-ATS-CONFIGURATION-001-decision.md)
and specified in
[M35 local unsigned ATS_CREATE configuration](m35-local-unsigned-ats-create-configuration.md).
The second retargets the real-issuer authority accepted in
[HA-ATS-LIVE-AUTHORITY-001](../work-queue/evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md)
and specified in
[M37 Stage A real-issuer ATS_CREATE authority](m37-stage-a-real-issuer-ats-create-authority.md).
The reason for the retarget is recorded in the
[campaign deploy flow design](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md):
the accepted v4.0.0 factory does not dispatch the `deployBond` selector that
SDK 8.0.0 encodes.

Neither projection is a Convex `commandAuthorities` record, and neither enables
M33. Neither makes a command admissible, durable, prepared, executable, paid,
settled, or live. Neither is an ATS SDK adapter, and neither may initialize an
SDK, construct a request, connect a provider, prompt a wallet, or submit an
operation. M35 and M37 remain accepted, unmodified, and non-authoritative for
the SDK 8.0.0 target.

## Private API

`packages/backend/src/ats/ats-create-configuration-v2.ts` and
`packages/backend/src/ats/stage-b-issuer-ats-create-authority.ts` are private
Backend sources. Neither is exported from `@tool402/backend`. They export only
these runtime functions and their TypeScript-only result types:

```ts
export function createAtsCreateConfigurationV2():
  AtsCreateConfigurationV2;

export function createStageBIssuerAtsCreateAuthority():
  StageBIssuerAtsCreateAuthority;
```

`AtsCreateConfigurationV2` has the same closed field set as the accepted M35
result, including its synthetic `canonicalIssuerEvmAddress`,
`principalPublicId`, `role`, and `authorityVersion`, plus one added root field
`canonicalParametersHash`, which has no counterpart in the accepted M35 and
M37 records. `StageBIssuerAtsCreateAuthority` has a four-field root:
`plannedCommandAuthority`, `atsCreateConfiguration`, `canonicalPreimage`,
which is defined below, and its own `canonicalParametersHash`. The first two
have the same shape as the accepted M37 result. Its planned authority tuple is
byte-equal to the accepted Stage A tuple and remains descriptive and
unprovisioned.

Every returned root, descriptor, parameter object, preimage, and nested array
is newly allocated and frozen. A second call returns equal data but shares no
mutable object or array with the first call.

## Retargeted values

Exactly these five values differ from the accepted M35 and M37 records. They
apply identically to both new projections:

```text
registryRevision    = ats_sdk_8_0_0_testnet_v2
expectedTarget      = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
resolverEvmAddress  = 0xba2d5fc2083a0b8f164c50e65d782087fba18e0a
resolverHederaId    = 0.0.9212226
factoryHederaId     = 0.0.9213391 (in operationDescriptor)
```

`operationDescriptor.resolverHederaId` carries the same `0.0.9212226` value as
the root field, exactly as the accepted records carry `0.0.7707874` in both
places.

Every other value is byte-equal to the accepted records after RFC 8785 JCS
canonicalization: the protocol, `hedera:testnet`, chain `296`, the subject
`riskscan_revenue_note_demo`, the offering version `ats_demo_v1`,
`ATS_CREATE`, `EVM_ADDRESS`, the SDK identity and integrity, the Mirror Node
and RPC base URLs, the config id and version, the two omitted optional fields,
the whole `parameters` object including the `REG_S / NONE` pair, and
`m20EconomicsBinding = NONE`.

If HA-ATS-RETARGET-001 records any further changed value, that decision
governs and this specification is amended before the RED.

The single difference between the two new projections is the one the accepted
records already draw:

```text
ats-create-configuration-v2.ts
  parameters.diamondOwnerAccount = 0x0000000000000000000000000000000000000402

stage-b-issuer-ats-create-authority.ts
  parameters.diamondOwnerAccount = 0xc89f87052c3e080b4a9b021d4930055031ef378e
```

The Stage B projection must require
`plannedCommandAuthority.canonicalSignerAddress ===
parameters.diamondOwnerAccount` before it returns. That equality is a
source-integrity requirement only; it is not a runtime M32 or M33 enforcement
path and must not be represented as one.

## Canonical binding invariant

On every call, each projection builds its own preimage as the closed object
with exactly these eleven fields in exactly this order:

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

It serializes that object with Core's accepted RFC8785-JCS canonicalizer,
Keccak-256 hashes the UTF-8 bytes with the already direct Backend `viem`
dependency, removes `0x`, and requires exact equality with its own expected
digest constant. Any drift throws before a projection is returned.

Each projection returns that verified digest as its root
`canonicalParametersHash`: a 64-character lowercase hexadecimal string with no
`0x` prefix, transcribed from HA-ATS-RETARGET-001 and never an independent
literal. The field is not a preimage member and does not enter the digest.

The two expected digests are the recomputed synthetic digest and the
recomputed real-issuer digest recorded by HA-ATS-RETARGET-001. This
specification carries no digest literal: the constants are transcribed from
that accepted decision when it exists, and an invented, guessed, or
implementation-derived digest is prohibited. If a runtime recomputation
disagrees with the transcribed constant, the work stops and the mismatch is
returned to the human; the constant is never reconciled to the computed value.

The accepted digests
`eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f` (M35) and
`d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250` (M37) are
bound to the v4.0.0 target and must never be returned by either M42
projection.

## Shared preimage projection

`StageBIssuerAtsCreateAuthority.canonicalPreimage` is the exact frozen
eleven-field object described above, in the same order, freshly allocated on
each call. It exists so that a later M33 enablement and a later web request
builder read one source rather than restating the tuple. M42 adds no import
to M33, M32, Convex, the Backend barrel, or the web workspace. The web
workspace obtains the web-facing routing subset of these values (`network`,
`chainId`, `subjectPublicId`, `offeringVersion`, `registryRevision`,
`operationKind`, `targetKind`, `expectedTarget`, `canonicalParametersHash`,
`factoryHederaId`, and `resolverHederaId`) plus the display-only revenue-note
subset of `parameters` (`name`, `symbol`, `isin`, `numberOfUnits`,
`nominalValue`, `currency`, `decimals`, `isWhiteList`, and `isControllable`) as
a frozen literal committed by
[S16-T010](../work-queue/queue/60-done/S16-T010-provider-deploy-wizard.md) at
`apps/web/src/components/provider/deploy/ats-create-configuration.ts`. S16's
focused test asserts that twenty-field display projection field-for-field
against this specification. The literal excludes `diamondOwnerAccount`, every
authority field, the SDK identity and integrity, RPC and Mirror Node URLs, and
the rest of the parameter object. That transcription creates no code dependency
in either direction, and how any other consumer outside the Backend workspace
obtains this data is a separate, separately reviewed seam.

## Explicit exclusions

Do not modify the accepted
`packages/backend/src/ats/local-unsigned-ats-create-configuration.ts` or
`packages/backend/src/ats/stage-a-real-issuer-ats-create-authority.ts`, their
focused tests, M33's compiled zero-enabled manifest, M32 durable admission,
the Convex schema or functions, existing ingress source, RiskScan persistence,
the Backend public barrel, packages, lockfile, Web/UI, Agent, configuration,
environment, generated output, or any existing test.

Do not import the ATS SDK or any wallet or provider package. Do not call
`Network.init`, `Network.connect`, `new CreateBondRequest(...)`, or
`Bond.create(...)`. Do not access Convex, an environment variable, clock,
storage, network, HTTP, key, wallet, browser provider, account, transaction,
payment, funding, allocation, clearing, HCS, payout, deployment, or live
evidence. Do not use `eval`, `Function`, or equivalent runtime source
indirection.

`ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and `ATS_COUPON` remain
outside M42 and fail closed. Authority provisioning, an enabled M33 mapping,
the funded issuer account, and every executable step remain separate
human-owned gates.

## Acceptance evidence

- A test-only RED commit precedes both projection sources, and its static
  boundary checks reject evaluator indirection including `eval` and
  `Function`.
- Focused tests prove the exact retargeted literals, the five changed values,
  byte-equality of every other value with the accepted records, the
  transcribed digest on every call, the eleven-field preimage order and
  content, the root `canonicalParametersHash` on each projection in
  64-character lowercase hexadecimal form and equal to that projection's own
  recomputed digest,
  signer-to-owner equality for the Stage B projection, full immutability,
  independent-call detachment, the private module surface, and no public
  Backend export.
- Focused tests prove the accepted M35 and M37 projections still return their
  accepted targets and digests, and that M33 remains zero-enabled.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
