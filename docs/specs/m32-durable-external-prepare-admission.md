# M32 durable external-prepare admission

## Delivery boundary

This contract adds a generic internal Convex durable data plane after accepted
M26, M30, and M31 records. It declares server-side signer-authority, replay,
and generic-attempt records; admits one exact serialized M31-shaped record in
one internal transaction; and provides a strict internal recovery read.

It is not an HTTP/BFF integration. M25 and M31 capability membership is local
to one JavaScript process and cannot be serialized into Convex. A future BFF
adapter must independently run the accepted authentication boundary, submit the
result, use a separately reviewed branded async completion protocol, and on a
timeout recover by idempotency context without automatic re-submission.

No M32 function resolves, validates, authorizes, or executes an ATS expected
target, canonical parameters hash, or operation-to-target mapping. The M26
target/hash fields stored below are opaque signed context only.

## Durable record shapes

`commandAuthorities` is a server-side non-secret authority record with exactly
the human-approved authority fields:

```text
principalPublicId
canonicalSignerAddress
chainId
role
ownedSubjectPublicIds
authorityVersion
enabled
```

It has the `by_chain_id_and_canonical_signer_address` index. M32 adds no
provisioning writer: a missing, duplicate, disabled, malformed, or mismatched
row fails closed.

`externalPrepareCommandReplayClaims` contains `replayIdentity`, `attemptId`,
and `claimedAt`, with `by_replay_identity`. It correlates a committed new
command with its one generic attempt; it carries no signature, raw body, key,
or provider capability.

`externalPrepareCommandAttempts` contains the exact durable command context:

```text
version
type
chainId
canonicalSignerAddress
principalPublicId
role
authorityVersion
payloadHash
operationKind
subjectPublicId
network
expectedTarget
canonicalParametersHash
idempotencyKey
expiresAt
state
acceptedAt
```

It has `by_idempotency_key`. Its only initial state is literal `PREPARED`,
meaning durably admitted generic data only. It does not mean a target is
authorized, a provider has been called, an operation is executable, or any
financial action has begun.

## Internal mutation

`packages/backend/convex/external_prepare_command_admission.ts` exposes one
internal mutation accepting a serialized M31-shaped record. Its runtime
validators and handler must require the exact fixed version/type/chain,
canonical signer/nonce/timestamps/payload hash/replay identity, closed M26
payload vocabulary, and one ISSUER/BACKER role. The handler uses the durable
server wall clock to reject expired commands before writes.

Inside one Convex transaction it performs this order:

```text
exact input and durable-expiry validation
→ current authority read/revalidation
→ replay-identity lookup
→ idempotency-key lookup and exact context comparison
→ only NEW inserts attempt and replay claim
```

The authority read must find exactly one row for the fixed signer/chain and
require `enabled === true`, exact principal, role, authority version, and the
M30 ownership predicate: every `ATS_*` payload requires `ISSUER` plus the
payload subject in `ownedSubjectPublicIds`; `HEDERA_FUNDING` requires `BACKER`.
It must not infer a target or parameter authorization from that predicate.

The replay identity must equal exactly:

```text
tool402:wallet-command:v1:296:<canonicalSignerAddress>:<nonce>
```

If that identity already has a claim, return only `COMMAND_REPLAYED` and make
no write. For a fresh identity, compare an existing attempt by its idempotency
key with this exact context tuple:

```text
(version, type, chainId, canonicalSignerAddress, principalPublicId, role,
 authorityVersion, payloadHash)
```

An exact match returns `IDEMPOTENCY_REPLAYED` and the stored `PREPARED` attempt
without a write. A different payload hash or any different context member
returns `IDEMPOTENCY_CONFLICT` with no write. This follows M31's accepted
future-boundary rule: only `NEW` records the replay identity and creates the
one generic attempt.

With neither claim nor attempt, `NEW` inserts exactly one `PREPARED` attempt
and its replay claim atomically, then returns their closed result. No status
causes an automatic retry, provider call, wallet call, or external submission.

## Internal recovery query

`packages/backend/convex/external_prepare_command_recovery.ts` exposes one
internal query. It accepts an idempotency key and the same exact context tuple,
uses `by_idempotency_key`, and returns an existing `PREPARED` attempt only for
one exact matching row. Zero rows return `null`; duplicates, malformed rows,
or any mismatch fail closed. It does not expose raw body/signature material,
create state, retry a mutation, or invoke an external dependency.

## M04 shared-schema compatibility amendment

The existing M04 RiskScan schema test continues to prove the exact six
RiskScan table contracts, but does so as a named subset of the global schema.
M32 owns a separate exact assertion for its three additive generic tables.
This narrow test/spec amendment preserves all M04 RiskScan fields, optionality,
document-ID targets, and indexes unchanged. It neither adds nor changes any
RiskScan function, writer, reader, record, or reconciliation behavior.

## Explicit exclusions

Do not add authority provisioning, seed data, configuration/environment access,
Convex publication, generated API output, public query/mutation/action, HTTP,
BFF integration, browser/wagmi/provider code, signing, wallet or account work,
ATS SDK/configuration/target/parameter resolution, funding, payment,
transaction, settlement, clearing, HCS, payout, deployment, or live evidence.
Do not modify M24 through M31 source or reopen M04 RiskScan behavior.

## Acceptance evidence

- A test-only RED commit precedes every M32 schema/function production change.
- Focused tests prove exact additive schema, M04 subset preservation, internal
  validators, durable current-authority recheck, expiry rejection before writes,
  replay-before-idempotency precedence, exact context matching, one atomic NEW
  attempt/claim, no-write replay/conflict/idempotency outcomes, opaque
  target/hash storage, and strict recovery reads.
- Static checks prove only internal Convex functions and no provider, wallet,
  ATS, HTTP, configuration, publication, or external-action behavior.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before acceptance.
