# M47 ATS Stage-B runtime binding

## Delivery boundary

M47 closes the local mismatch between the accepted M42 real-issuer
`ATS_CREATE` configuration and the existing S21 browser command bridge. It
adds a fixed server-side binding before the zero-enabled M33 admission gate and
a separate public browser command projection for stage 2. It changes no M42
or M33 canonical preimage field, digest, issuer, target, descriptor,
parameter, economics value, or manifest entry.

This is a local source-only correction. The Stage-B human action remains
pending for any provider, signature, transaction, candidate, or testnet
operation.

## Canonical reconciliation

The accepted real Stage-B M42 preimage remains exactly the ordered eleven-field
object:

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

Its accepted digest remains exactly:

```text
1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

The real projection's `parameters.diamondOwnerAccount` and planned command
signer remain the same canonical issuer. M42's SDK identity/integrity fields
remain immutable historical provenance within that accepted preimage; M44's
selection of the Factory artifact plus viem is a separate pure consumer seam
and does not enter the preimage. Therefore no new human configuration or hash
decision is required.

The S16 display literal retains its synthetic digest and remains a
presentation-only projection. It is not complete configuration, it is not a
server authority, and it must never provide input to an M47 stage-2
`external.prepare` request.

## Server-side binding

`packages/backend/convex/stage-b-ats-create-runtime-binding.ts` is a private
Convex helper. It may import only the private M42 real-issuer projection and
accepted Core types/utilities needed to compare a command already normalized by
M32. It may not read a caller-selected configuration, environment, database,
clock, wallet, provider, network, or SDK.

For one `ATS_CREATE` command, after M32 has rebound the serialized command and
revalidated its durable signer authority, the helper requires all of the
following before M33 or a replay/idempotency lookup:

```text
canonicalSignerAddress == M42 planned canonical signer
principalPublicId      == M42 planned principal public id
role                   == ISSUER
authorityVersion       == M42 planned authority version
payload.network        == M42 network
payload.chainId        == M42 chain id
payload.subjectPublicId == M42 subject public id
payload.operationKind  == ATS_CREATE
payload.expectedTarget == M42 expected target
payload.canonicalParametersHash == M42 real-issuer digest
M42 planned signer == M42 parameters.diamondOwnerAccount
```

Every mismatch rejects before M33, replay, idempotency, attempt creation, or
offering state change. The helper does not enable M33; the existing empty
manifest remains the next fail-closed gate.

This narrowly supersedes only M32/M42's former blanket no-runtime-import
exclusion for the named private helper and its single call from
`admitAtsCreateAndMarkAssetPending`. It does not expose the M42 module through
the Backend barrel or add an M33 manifest record.

## Browser command projection

`apps/web/src/lib/ats/stage-b-ats-create-command-projection.ts` exports one
frozen public M26 projection containing only:

```text
network
chainId
subjectPublicId
operationKind
expectedTarget
canonicalParametersHash
```

It contains the accepted real M42 values. It contains neither
`diamondOwnerAccount`, principal, role, authority version, SDK provenance,
descriptor, parameter object, RPC/Mirror value, secret, or provider state.

The S21 command bridge uses this projection only when building stage 2. Stage
2 accepts no caller-provided ATS configuration/projection. The existing S16
display literal continues to drive display rows and stage presentation, but
must not be imported by the command bridge or used to form a stage-2 payload.

The browser projection is never a server authority. The server-side binding
and M33 independently fail closed before any durable state.

## Explicit exclusions

Do not change M42's preimage, digest, target, issuer, descriptor, parameters,
or economics; M33's empty manifest; M44's Factory helper; M43's receipt
boundary; M40's offering state model; the S16 display literal; package
manifests; lockfiles; final submission documentation; generated output; or any
public Backend export.

Do not provision `commandAuthorities`, enable M33, publish Convex, access an
environment value, connect or prompt a wallet/provider, call an SDK, encode or
submit calldata, create an asset/attempt/candidate, make a network/RPC/Mirror
call, fund an account, deploy, or claim a live result.

## Acceptance evidence

- RED tests precede all M47 source changes and prove the absent binding and
  public projection are the only intended failures.
- Backend tests prove exact real-issuer matching and rejection of every
  synthetic or context/payload drift before M33 or durable state.
- Web tests prove the exact real public projection, no caller-selected stage-2
  projection, and no S16 display-literal import in the bridge.
- M33 remains zero-enabled and ATS commands remain rejected after M47's local
  binding until a separate Stage-B human decision is accepted and executed.
- Focused and workspace verification, typechecks, lint, queue/reference/
  whitespace checks, local-reference guard, independent task review, and fresh
  module review pass.
