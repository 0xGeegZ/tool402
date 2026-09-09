# M40 offering and directory-version durable admission

## Delivery boundary

This contract extends the accepted M32 internal durable data plane with two
durable subjects and one generic wallet-command replay-claim record. It
declares those tables, admits one exact serialized `offering.create` and one
`directory.publish` record per transaction, declares an asset-pending seam,
and exposes two read-only projections.

It is not an HTTP or BFF integration and reads no environment value. Its input
is untrusted, so M40 repeats the rebinding discipline of
[M32](m32-durable-external-prepare-admission.md), whose mutation, recovery
query, [M33 gate](m33-ats-prepare-authority-gate.md), and tests stay byte
unchanged. `externalPrepareCommandReplayClaims` keeps `external.prepare`.

No M40 function resolves, authorizes, or executes an ATS target, parameter
set, asset, or transaction: a stored state records an admitted signed command,
never an observed on-chain fact. Scope and human gates belong to the
[approved design](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).

## Durable record shapes

Timestamps use `v.int64()` and every canonical decimal, identifier, hash, and
address field uses `v.string()`, per the
[M04 convention](m04-riskscan-durable-schema.md). Validators never replace
the handler rules below.

`offerings` has exactly these validators, the
`by_offering_public_id_and_version` index on `offeringPublicId`, `version`,
and the `by_ats_attempt_id` index on `atsAttemptId`:

```text
offeringPublicId, subjectPublicId, canonicalSignerAddress, principalPublicId,
authorityVersion, payloadHash, idempotencyKey, advertisedQuickPriceTinybars,
advertisedStandardPriceTinybars: v.string()
version: v.number(); acceptedAt, updatedAt: v.int64()
definition: v.object(schemaVersion v.literal(1); terms v.object(version,
  fundingTargetTinybars, noteUnitPriceTinybars, maximumNoteUnits,
  minimumPurchaseUnits, reserveShareBps, issuerShareBps, platformFeeBps,
  payoutCapTinybars each v.string()); maturityAt, qualifyingResource: v.string())
narrative: v.object(title, customerProblem v.string(); customerUseCases,
  useOfFunds, risks v.array(v.string()))
state: v.union(v.literal("DRAFT"), v.literal("ASSET_PENDING"),
  v.literal("READY"), v.literal("OPEN"), v.literal("CLOSED"))
atsAttemptId: v.optional(v.id("externalPrepareCommandAttempts"))
atsAssetEvmAddress: v.optional(v.string())
activeDirectoryVersionId: v.optional(v.id("directoryVersions"))
```

Each nested `definition.terms` member, `terms.version` included, is a
canonical M20 decimal string; the row's own `version` is a safe integer.

`directoryVersions` has exactly these validators, `by_service_slug_and_state`
on `serviceSlug`, `state`, and `by_offering_public_id_and_directory_version`
on `offeringPublicId`, `directoryVersion`:

```text
offeringPublicId, payloadHash, canonicalSignerAddress, idempotencyKey: v.string()
offeringVersion, directoryVersion: v.number()
serviceSlug: v.literal("riskscan")
record: v.object(the exact accepted M28 candidate fields, webUrl optional)
state: v.union(v.literal("DRAFT"), v.literal("PUBLISH_PREPARED"),
  v.literal("ACTIVE"), v.literal("SUPERSEDED"))
acceptedAt: v.int64()
```

`serviceSlug` is a declared top-level column, not a projection of `record`,
because the slug index needs it; the handler requires the two to be equal. The
brief's `signer` column is declared `canonicalSignerAddress`, matching the
accepted `commandAuthorities` and `externalPrepareCommandAttempts` field name,
so the root records the deviation. M40 admits a publish directly as `ACTIVE`;
`DRAFT` and `PUBLISH_PREPARED` hold the approved lifecycle but no M40 function
writes either, and a later card claims them under its own reservation.

`walletCommandReplayClaims` is the generic wallet-command claim record, with
exactly these validators and `by_replay_identity` on `replayIdentity`:

```text
replayIdentity: v.string()
commandType: v.union(v.literal("offering.create"),
  v.literal("directory.publish"), v.literal("external.attachCandidate"))
outcome: v.union(v.literal("NEW"), v.literal("IDEMPOTENCY_REPLAYED"),
  v.literal("IDEMPOTENCY_CONFLICT"))
targetId: v.optional(v.string())
claimedAt: v.int64()
```

`targetId` is a correlation string only, never a document-ID union and never
proof that a subject exists; it is present only for `NEW` and
`IDEMPOTENCY_REPLAYED`. No record carries a signature, raw body, key, or
capability. M40 keeps `walletCommandReplayClaims` for wallet-command claims
over the three `commandType` literals above but writes only the first two, the
third belonging to the attach-candidate boundary; the ingress-layer claim in
the M41-T010 assignment is a different concern under the distinct name
`ingressCommandReplayClaims` owned by M41, which the root confirms before
either card is ready.

All three tables are additive. The accepted M04 test enumerates the
`riskScan*` subset and the accepted M32 test the `commandAuthorit*` and
`externalPrepareCommand*` subsets, so neither needs amending; M40 owns an
exact assertion and changes no accepted field, target, or index.

## Serialized-input rebinding

Each mutation receives untrusted serialized data, not a live normalizer DTO
and not an EIP-712 signature. Before any authority lookup, other read, or
write, `packages/backend/src/offering-command-admission.ts` must:

1. require the exact fixed command version and type, chain `296`, a canonical
   lowercase signer, canonical nonce and timestamps, canonical lowercase
   payload hash, nonempty principal and authority version, and `ISSUER`;
2. parse the detached payload through the accepted M38 parser for that type;
3. rebuild the RFC 8785 JCS bytes with the accepted M38
   `canonical*PayloadBytes` builder, Keccak-256 those UTF-8 bytes with the
   backend's `viem`, and require exact equality with `payloadHash`;
4. require `command.expiresAt === payload.expiresAt` after each value has
   independently passed canonical timestamp validation;
5. derive `tool402:wallet-command:v1:296:<canonicalSignerAddress>:<nonce>` and
   require exact equality with the transmitted replay identity; and
6. use the durable server wall clock to require `expiresAt > issuedAt`, a
   300-second maximum lifetime, `issuedAt <= durableNow + 60 seconds`, and
   `durableNow <= expiresAt`.

Failure of any check fails closed with zero reads and zero writes. Core emits
canonical bytes and the consumer holding `viem` hashes them. The module is
pure: it receives the internal mutation's one server-derived `durableNow`
value as an explicit input and has no context, clock, environment, storage,
network, or `@tool402/backend` export. The mutation, never a caller, obtains
that durable clock value; the module cannot re-prove the upstream signature.

## Internal mutations

`packages/backend/convex/offerings.ts` exposes `admitOfferingCreate` and
`packages/backend/convex/directory_versions.ts` exposes
`admitDirectoryPublish`. Both are internal mutations, take no caller clock or
capability, recheck every rule, and run this order in one transaction:

```text
serialized rebinding and durable time validation
→ current commandAuthorities read and revalidation → replay-identity lookup
→ subject identity lookup, exact context and deferred-ownership comparison
→ atomically claim the fresh identity, writing a record only for NEW
```

Every indexed read uses `take(2)`; a duplicate or malformed row fails closed.
The authority read finds exactly one row for the fixed signer and chain and
requires `enabled === true`, the exact principal and authority version, and
`ISSUER`; for `offering.create` it also requires the payload `subjectPublicId`
in `ownedSubjectPublicIds`. A `directory.publish` payload carries no subject,
so its authority read requires the `ISSUER` role only and the same ownership
predicate is re-applied in the third step, against the referenced offering's
stored `subjectPublicId` and the `ownedSubjectPublicIds` held from the
authority read, before any write.

`admitOfferingCreate` requires `payload.offeringVersion === 1`, failing closed
with `PRECONDITION_UNMET` for any other value, and identifies an offering by
`(offeringPublicId, version)` from that validated version. With no existing
row it inserts one `DRAFT` offering storing that same version, never a
literal, with a linked `NEW` claim. An existing row whose `idempotencyKey`,
`payloadHash`, and context tuple match exactly yields a linked
`IDEMPOTENCY_REPLAYED` claim and the stored offering; drift or an unsafe row
yields an unlinked `IDEMPOTENCY_CONFLICT`. A reused identity returns
`COMMAND_REPLAYED`.

`admitDirectoryPublish` resolves the stored directory version before deciding
whether it is a `NEW` admission or an idempotent replay. A `NEW` admission
requires the referenced offering to be `READY`, to carry its canonical asset
link, and to have its `version` equal to the payload's `offeringVersion`; any
other state refuses before a write. It then inserts the directory version as
`ACTIVE`, marks the single prior `ACTIVE` row for that `serviceSlug`
`SUPERSEDED`, sets `activeDirectoryVersionId`, and moves the offering to
`OPEN`. Both offering fields are written from `directory_versions.ts` in that
same transaction.

For a fresh nonce paired with the exact existing directory command context,
the idempotent replay is valid only when that stored directory row is the sole
`ACTIVE` row for its service slug and the referenced offering is `OPEN` with
`activeDirectoryVersionId` exactly equal to the stored directory row's ID. It
returns `IDEMPOTENCY_REPLAYED` and writes only its linked replay claim. A
`READY` offering is not required for that replay; requiring it would make a
successful publish non-recoverable after its own `OPEN` transition. Any drift,
duplicate active row, malformed row, mismatched active pointer, or other
unsafe state yields `IDEMPOTENCY_CONFLICT` with no directory or offering patch.
Two `ACTIVE` rows fail closed; replay and conflict transition nothing.

Each mutation returns exactly one closed union arm and no extra field:
`{ status: "NEW", targetId, state }`,
`{ status: "IDEMPOTENCY_REPLAYED", targetId, state }`,
`{ status: "COMMAND_REPLAYED" }`, `{ status: "IDEMPOTENCY_CONFLICT" }`, or
`{ status: "PRECONDITION_UNMET" }`. The returned `targetId` is the `offerings`
document ID for `admitOfferingCreate` and the `directoryVersions` document ID
for `admitDirectoryPublish`, while the stored claim column of the same name
holds its string form. No status retries, calls out, or submits.

`offerings.ts` also declares two internal transitions with closed Convex
argument and return validators. `markAssetPending(offeringId, attemptId)`
accepts exactly an `offerings` document ID and an
`externalPrepareCommandAttempts` document ID, and returns exactly
`{ offeringId, state: "ASSET_PENDING" }`. It obtains both stored rows itself,
requires one safe `DRAFT` offering with neither asset-link field, and one safe
`PREPARED` `ATS_CREATE` attempt whose `subjectPublicId` equals the offering's.
Before the patch, it reads `by_ats_attempt_id` with `take(2)` and requires no
existing link for that attempt. It then patches only `state`, `atsAttemptId`,
and its server-derived `updatedAt` value.

`markAssetReady(attemptId, atsAssetEvmAddress)` deliberately accepts no
caller-supplied offering ID. It accepts exactly an
`externalPrepareCommandAttempts` document ID and a canonical lowercase EVM
address (`0x` plus 40 lowercase hexadecimal characters), returning exactly
`{ offeringId, state: "READY" }`. It validates that address before accessing
storage, resolves the offering itself through `by_ats_attempt_id` with
`take(2)`, and requires exactly one safe `ASSET_PENDING` offering whose stored
attempt ID is exactly `attemptId` and whose asset address is absent. It then
patches only `state`, `atsAssetEvmAddress`, and its server-derived
`updatedAt` value. Zero, duplicate, unsafe, mismatched, or ineligible rows
fail closed with no patch.

The state/link invariant is exact: `DRAFT` has neither asset-link field;
`ASSET_PENDING` has `atsAttemptId` and no asset address; and `READY` or `OPEN`
has both that attempt ID and a canonical asset address. A `directory.publish`
mutation treats any stored row outside that invariant as unsafe and performs no
directory or offering write. `CLOSED` does not weaken an existing link's
canonicality.

Both seams write `offerings` columns only and are named seams for the accepted
`ATS_CREATE` path. `markAssetReady` is invoked only by the
[M43](m43-ats-receipt-verification.md) verification action after it has
persisted `CONFIRMED`. M43 may pass only the stored candidate address after its
pure verifier has proved that the created address exactly equals it; it may not
pass a browser, action-argument, or raw Mirror response address. M40 declares
the seams and writes no caller: every `externalPrepareCommandAttempts` change
and both wirings belong to those cards' own reservations.

### M41 atomic ATS_CREATE handoff amendment

`markAssetPending(offeringId, attemptId)` remains a closed M40 seam, but M41
does not call it. The initial cross-mutation proposal could commit a generic
`PREPARED` attempt before failing to link its offering. Instead, M40 exports a
non-registered helper used only by M32's
`admitAtsCreateAndMarkAssetPending` transaction. The helper resolves exactly
one safe unlinked `DRAFT` offering through a new additive
`by_ats_create_draft_binding` index over:

```text
subjectPublicId, canonicalSignerAddress, principalPublicId, authorityVersion,
state
```

It requires equality with the freshly revalidated `ATS_CREATE` attempt and
patches only that record to `ASSET_PENDING` with the exact attempt ID. Zero,
multiple, malformed, linked, or cross-context rows reject the encompassing M32
transaction. The existing `by_ats_attempt_id` index proves the exact linked
`ASSET_PENDING` offering before an M32 idempotency replay can be returned. No
document ID enters M41 or the browser, and no provider, SDK, target, authority,
or live behavior changes.

## Public read-only projections

`offerings:getPublicProjection(offeringPublicId)` returns the highest stored
version's sanitized snapshot or `null`, and
`directoryVersions:getActive(serviceSlug)` the single `ACTIVE` record or `null`,
failing closed on duplicates. The snapshot exposes only
`offeringPublicId`, `version`, `subjectPublicId`, `state`, `definition`,
`narrative`, the two advertised prices, `canonicalSignerAddress` in its stored
lowercase form, `atsAssetEvmAddress` when set, `acceptedAt`, and `updatedAt`.
It excludes `principalPublicId`, `authorityVersion`, `payloadHash`,
`idempotencyKey`, document IDs, replay claims, and reasons. Both are read-only
and assert nothing about existence, funding, payment, or verification.

## Explicit exclusions

Do not add authority provisioning, seed data, configuration or environment
access, Convex publication, a public mutation or action, HTTP routing, browser
or provider code, signing, wallet or account work, ATS SDK, target or
parameter resolution, receipt attachment, Mirror Node access, funding,
payment, transaction, settlement, clearing, HCS, payout, deployment, live
evidence, M24 through M33 source or tests, a barrel, or the lockfile.

## Acceptance evidence

- A test-only RED commit precedes every schema and function production change.
- Focused tests prove the exact additive three-table contract, including the
  `by_ats_attempt_id` index; unchanged accepted schema subsets; full rebinding
  through the M38 parser before hash comparison, including malformed raw
  payloads paired with independently recomputed JCS hashes; exact command and
  payload expiry equality; inclusive expiry, 300-second, and future-skew
  boundaries; and exact replay-identity equality before any database access.
  They also prove safe bounded handling of duplicate or malformed authority,
  replay-claim, offering, and directory rows; the exact closed Convex args and
  returns for both admissions and both asset seams; the
  `DRAFT` → `ASSET_PENDING` and `ASSET_PENDING` → `READY` guards, attempt
  binding, canonical asset-address provenance, and zero-write rejection paths.
  The authority recheck and both ISSUER-owns-subject predicates; replay before
  identity lookup; conflict on drift; one atomic `NEW` write;
  `directory.publish` refused unless the offering is `READY` for `NEW`, while
  an exact fresh-nonce replay of the persisted `ACTIVE` directory returns its
  prior result only with the linked `OPEN` offering; one `ACTIVE` row per slug
  with the prior superseded and the offering `OPEN`; and no
  external behavior.
- Backend and root typecheck, test, lint, clean-install dry run, queue,
  reference and whitespace checks, the enabled local guard, independent review,
  and two fresh clean module-review generations pass before acceptance.
