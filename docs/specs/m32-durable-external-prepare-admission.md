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
these Convex validators:

```text
principalPublicId: v.string()
canonicalSignerAddress: v.string()
chainId: v.literal(296)
role: v.union(v.literal("ISSUER"), v.literal("BACKER"))
ownedSubjectPublicIds: v.array(v.string())
authorityVersion: v.string()
enabled: v.boolean()
```

It has the `by_chain_id_and_canonical_signer_address` index. M32 adds no
provisioning writer: a missing, duplicate, disabled, malformed, or mismatched
row fails closed.

`externalPrepareCommandReplayClaims` has these exact validators and the
`by_replay_identity` index on `replayIdentity`:

```text
replayIdentity: v.string()
outcome: v.union(
  v.literal("NEW"),
  v.literal("IDEMPOTENCY_REPLAYED"),
  v.literal("IDEMPOTENCY_CONFLICT"),
)
attemptId: v.optional(v.id("externalPrepareCommandAttempts"))
claimedAt: v.int64()
```

`attemptId` is present only for `NEW` and `IDEMPOTENCY_REPLAYED`. The record
consumes one accepted fresh replay identity even when that identity resolves an
existing attempt or a conflict; it carries no signature, raw body, key, or
provider capability.

`externalPrepareCommandAttempts` has these exact validators and the
`by_idempotency_key` index on `idempotencyKey`:

```text
version: v.literal(1)
type: v.literal("external.prepare")
chainId: v.literal(296)
canonicalSignerAddress: v.string()
principalPublicId: v.string()
role: v.union(v.literal("ISSUER"), v.literal("BACKER"))
authorityVersion: v.string()
payloadHash: v.string()
operationKind: v.union(
  v.literal("ATS_CREATE"),
  v.literal("ATS_CONTROL_LIST"),
  v.literal("ATS_ISSUE"),
  v.literal("ATS_TRANSFER"),
  v.literal("ATS_COUPON"),
  v.literal("HEDERA_FUNDING"),
)
subjectPublicId: v.string()
network: v.literal("hedera:testnet")
expectedTarget: v.string()
canonicalParametersHash: v.string()
idempotencyKey: v.string()
expiresAt: v.string()
state: v.literal("PREPARED")
acceptedAt: v.int64()
```

Its only initial state is literal `PREPARED`, meaning durably admitted generic
data only. These storage validators never replace the handler's canonical M26,
payload-hash, replay-identity, timestamp, and authority revalidation. A stored
attempt does not mean a target is authorized, a provider has been called, an
operation is executable, or any financial action has begun.

## Serialized-input rebinding

M32 receives untrusted serialized data, not an M25/M31 capability and not an
EIP-712 signature. Before any authority lookup, other database read, or write,
the mutation must independently:

1. require the exact fixed command version, type, and chain; canonical
   lowercase signer, canonical nonce, canonical timestamps, canonical lower-
   case payload hash, nonempty principal and authority version, and one closed
   role;
2. parse the detached payload through the accepted M26
   `parseExternalPreparePayload` boundary;
3. reconstruct M30's exact frozen eight-field payload, serialize it with
   RFC8785 JCS, Keccak-256 its UTF-8 bytes, and require byte-for-byte equality
   with `payloadHash`;
4. require `command.expiresAt === payload.expiresAt` after each value has
   independently passed canonical timestamp validation;
5. derive the replay identity from the canonical signer and nonce and require
   exact equality with the transmitted identity; and
6. use the durable server wall clock to require `expiresAt > issuedAt`, a
   maximum 300-second lifetime, `issuedAt <= durableNow + 60 seconds`, and
   `durableNow <= expiresAt`.

Failure of any rebinding check must fail closed with zero database reads and
writes. M32 cannot re-prove the upstream signature because the accepted M30
DTO intentionally contains no raw signature; a future trusted adapter owns
that upstream provenance.

## Internal mutation

`packages/backend/convex/external_prepare_command_admission.ts` exposes one
internal mutation accepting a serialized M31-shaped record. Its runtime
validators and handler must require the exact fixed version/type/chain,
canonical signer/nonce/timestamps/payload hash/replay identity, closed M26
payload vocabulary, and one ISSUER/BACKER role. Validators do not replace the
serialized-input rebinding rules above.

Its arguments have exactly these fields and no caller-supplied clock or
capability:

```text
version, type, chainId, canonicalSignerAddress, nonce, issuedAt, expiresAt,
payloadHash, replayIdentity, principalPublicId, role, authorityVersion, payload
```

`payload` is the complete M26 object. The fixed command fields use literal
validators, `role` is the exact two-literal union, and the handler repeats all
semantic canonical checks for direct controlled handler invocation.

Inside one Convex transaction it performs this order:

```text
complete serialized-input rebinding and durable time validation
→ current authority read/revalidation
→ replay-identity lookup
→ idempotency-key lookup and exact context comparison
→ atomically claim every fresh valid identity and create an attempt only for NEW
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

If exactly one claim already exists for that identity, return only
`COMMAND_REPLAYED` and make no write. Duplicate or malformed claim rows fail
closed. For a fresh identity, compare an existing attempt by its idempotency
key with this exact context tuple:

```text
(version, type, chainId, canonicalSignerAddress, principalPublicId, role,
 authorityVersion, payloadHash)
```

The M31 post-acceptance durable-replay clarification applies here: every fresh
fully validated, authority-approved identity is consumed in the same mutation.
With neither claim nor attempt, `NEW` inserts exactly one `PREPARED` attempt
and a linked `NEW` replay claim. An exact match inserts only a linked
`IDEMPOTENCY_REPLAYED` replay claim and returns the stored `PREPARED` attempt.
A different payload hash or context member, duplicate/malformed attempt row,
or an otherwise unsafe idempotency record inserts only an unlinked
`IDEMPOTENCY_CONFLICT` replay claim. A later reuse of any such newly claimed
identity returns `COMMAND_REPLAYED` before idempotency handling. Only `NEW`
creates an attempt.

The mutation returns exactly one of:

```text
{ status: "NEW", attemptId, state: "PREPARED" }
{ status: "IDEMPOTENCY_REPLAYED", attemptId, state: "PREPARED" }
{ status: "COMMAND_REPLAYED" }
{ status: "IDEMPOTENCY_CONFLICT" }
```

`attemptId` is exactly an
`externalPrepareCommandAttempts` document ID, `state` is literal `PREPARED`,
and no result arm has extra fields.

No status causes an automatic retry, provider call, wallet call, or external
submission.

## M41 atomic ATS_CREATE handoff amendment

The generic `admitExternalPrepareCommand` remains the exact durable admission
for every non-`ATS_CREATE` operation kind. It rejects `ATS_CREATE` after the
same closed command rebinding and authority checks, so an internal caller cannot
create an orphaned creation attempt.

`admitAtsCreateAndMarkAssetPending` is a second internal mutation with exactly
the same arguments and result union. It accepts only an `ATS_CREATE` command
and shares the generic admission's complete rebind, authority, replay,
idempotency, and durable-clock checks. On a fresh valid command, it performs
in one Convex transaction:

```text
insert PREPARED attempt
→ resolve one eligible M40 DRAFT offering by the exact five-field binding
→ patch only that offering to ASSET_PENDING with the new attempt ID
→ insert the linked NEW replay claim
```

The M40 helper resolves through the additive
`by_ats_create_draft_binding` index over `subjectPublicId`,
`canonicalSignerAddress`, `principalPublicId`, `authorityVersion`, and `state`.
It requires exactly one safe unlinked `DRAFT` record. Any missing, duplicate,
malformed, cross-principal, cross-authority, or already-linked offering throws,
which rolls back the attempted insert and replay claim. An exact idempotency
replay returns `IDEMPOTENCY_REPLAYED` only when the stored attempt links through
`by_ats_attempt_id` to exactly one matching `ASSET_PENDING` offering; it never
retroactively links an orphaned row. No new target, parameters, authority,
provider, wallet, SDK, transaction, or live action is introduced.

## Internal recovery query

`packages/backend/convex/external_prepare_command_recovery.ts` exposes one
internal query. It accepts the same exact context tuple plus the M26 payload;
it does not accept a nonce, replay identity, issued time, or caller clock. It
re-parses the supplied M26 payload, re-computes its JCS/Keccak payload hash,
and uses its idempotency key through `by_idempotency_key` with `take(2)`.

Its arguments are exactly `version`, `type`, `chainId`,
`canonicalSignerAddress`, `principalPublicId`, `role`, `authorityVersion`,
`payloadHash`, and the complete M26 `payload` object.

For one candidate row, recovery reconstructs the stored eight-field M26
payload, parses it through M26, recomputes its JCS/Keccak payload hash, and
requires the stored payload, stored hash, context tuple, and literal
`PREPARED` state to match exactly. It returns only the persisted snapshot:

```text
{
  attemptId, state: "PREPARED", acceptedAt,
  version, type, chainId, canonicalSignerAddress, principalPublicId,
  role, authorityVersion, payloadHash, payload
}
```

`attemptId` is an `externalPrepareCommandAttempts` document ID and `acceptedAt`
is an int64; this exact snapshot has no raw signature/body or extra result
fields.

Zero rows return `null`; duplicate, malformed, or mismatched rows fail closed.
Recovery neither writes nor re-reads current authority nor re-applies command
expiry: it may only reference an already durably accepted attempt. It does not
expose raw body/signature material, create state, retry a mutation, or invoke
an external dependency.

## M04 shared-schema compatibility amendment

The existing M04 RiskScan schema test continues to prove the exact six
RiskScan table contracts and must enumerate every exported `riskScan*` table
before comparing it with that exact six-table set. It therefore rejects an
extra RiskScan table while allowing separately owned non-RiskScan tables. M32
owns a separate exact assertion for its three additive generic tables,
including literal/union, optionality, document-ID-target, and int64 validator
shapes. This narrow test/spec amendment preserves all M04 RiskScan fields,
optionality, document-ID targets, and indexes unchanged. It neither adds nor
changes any RiskScan function, writer, reader, record, or reconciliation
behavior.

## Explicit exclusions

Do not add authority provisioning, seed data, configuration/environment access,
Convex publication, generated API output, public query/mutation/action, HTTP,
BFF integration, browser/wagmi/provider code, signing, wallet or account work,
ATS SDK/configuration/target/parameter resolution, funding, payment,
transaction, settlement, clearing, HCS, payout, deployment, or live evidence.
Do not modify M24 through M31 source or reopen M04 RiskScan behavior.

## Acceptance evidence

- A test-only RED commit precedes every M32 schema/function production change.
- Focused tests prove exact additive schema, rejection of an unlisted
  `riskScan*` table, internal validators, full serialized payload/hash/replay/
  time rebinding before any database access, durable current-authority recheck,
  replay-before-idempotency precedence, exact context matching, one atomic NEW
  attempt/claim, linked fresh-nonce idempotency claims, unlinked conflict
  claims, subsequent replay rejection, opaque target/hash storage, and strict
  recovery of only a fully revalidated stored payload.
- Static checks prove only internal Convex functions and no provider, wallet,
  ATS, HTTP, configuration, publication, or external-action behavior.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before acceptance.
