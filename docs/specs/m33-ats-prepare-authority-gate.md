# M33 ATS prepare-authority gate

## Delivery boundary

M33 narrows the accepted M32 internal durable-admission mutation. After M32
has rebound M26 data, time, and payload hash and has revalidated the current
signer/subject authority, M33 independently resolves a server-owned ATS
authority record before replay or idempotency access.

The initial compiled manifest has no enabled ATS record. Consequently every
current `ATS_*` command fails closed after the command-authority read and
before any replay/idempotency read or write. `HEDERA_FUNDING` remains outside
M33 and follows M32's existing BACKER path unchanged.

M33 is a local admission predicate only. It does not make an ATS operation
configured, prepared for execution, signed, submitted, or recoverable as an
external operation.

## Internal API

`packages/backend/convex/ats_prepare_authority.ts` is an internal-only Convex
source. It is not exported from `@tool402/backend` and exposes exactly these
functions:

```ts
export function assertCurrentAtsPrepareAuthority(
  payload: ExternalPreparePayload,
): void;

export function assertAtsPrepareAuthorityForTest(
  payload: ExternalPreparePayload,
  manifest: unknown,
): void;
```

`assertCurrentAtsPrepareAuthority` is the only M33 function imported by the
M32 mutation. `assertAtsPrepareAuthorityForTest` is direct-test observability
only: it accepts no command, authority record, database context, environment,
provider, or external capability, and it must not be imported by production
code.

The compiled production manifest is immutable and has no enabled record. A
future reviewed source revision may provide an enabled record only under the
human decision rules in
[HA-ATS-AUTHORITY-001](../work-queue/evidence/HA-ATS-AUTHORITY-001-decision.md).

## Matching and comparison

The resolver first parses only the already accepted M26 payload. For an
`ATS_*` operation it finds candidates by exactly:

```text
(network, chainId, subjectPublicId, operationKind)
```

It does not use a submitted target/hash as a key. Exactly one enabled,
descriptor-safe, normal-object record is required. A missing, duplicate,
disabled, malformed, unsupported, or mismatched record throws before M32 reads
replay or idempotency state. A non-ATS `HEDERA_FUNDING` payload returns without
an M33 manifest lookup.

An enabled record has the closed fields defined by the human decision:

```text
schemaVersion, network, chainId, subjectPublicId, offeringVersion,
registryRevision, operationKind, targetKind, expectedTarget,
operationDescriptor, parameters, enabled
```

`operationDescriptor` and `parameters` are nonempty safe JSON objects. M33
uses the accepted Core RFC8785-JCS emitter to serialize the exact human
decision preimage, Keccak-256 hashes its UTF-8 bytes, and strips `0x`. It
requires exact equality with the parsed M26 target and lowercase
`canonicalParametersHash`. No string case normalization, target-form
conversion, fallback, implicit default, or dynamic parameter selection is
allowed.

## M32 ordering amendment

M33 supersedes only the M32 statement that ATS target/hash are opaque for
admission. The M32 mutation order becomes:

```text
serialized M26/JCS/time rebinding
→ current command-authority revalidation
→ M33 ATS gate for ATS_* only
→ replay lookup
→ idempotency lookup
→ durable claim and NEW attempt only
```

An M33 failure has exactly one prior database read: the current
`commandAuthorities` lookup. It has zero replay/attempt reads and zero writes.
M32 recovery remains a persisted-snapshot read and does not re-evaluate M33.

## Explicit exclusions

Do not modify the Convex schema, recovery query, M24 through M31 source,
RiskScan source, backend public barrel, packages, lockfile, Web/UI, Agent,
configuration, environment, generated output, or public API. Do not add an
ATS SDK/provider, BFF/HTTP adapter, wallet/provider behavior, account action,
funding, payment, transaction, settlement, clearing, HCS, payout, deployment,
or live evidence.

## Acceptance evidence

- A test-only RED commit precedes the new internal authority source and its
  M32 mutation integration.
- Focused tests prove the internal-only source, exact manifest/preimage
  validation, correct Keccak/JCS vector, exact target/hash equality, no target
  aliasing, missing/duplicate/disabled/malformed source rejection, and no
  provider/configuration/external behavior.
- Controlled M32 contexts prove every current `ATS_*` payload stops after
  current command authority and before replay/idempotency lookup or any write;
  `HEDERA_FUNDING` retains its existing durable admission path.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
