# M41 HTTP command ingress and public projection

## Delivery boundary

This contract adds the first HTTP surface in front of the accepted internal
ingress chain: one Convex router with one protected write route and two
unauthenticated read routes. It owns transport only; the accepted
[M22](m22-ingress-envelope.md) through [M25](m25-claimed-protected-body.md)
chain, the in-batch M39 normalizer, and the accepted
[M32](m32-durable-external-prepare-admission.md) and M40 admissions keep every
cryptography, grammar, authority, replay, and durable-record rule. Until
`HA-CAMPAIGN-CONVEX-001` is recorded there is no deployment, key material, or
authority row, so every request fails closed and nothing here signs, funds,
submits, or advances an offering state.

## Convex modules and routes

Three new modules under `packages/backend/convex/`, their ASCII letter, digit,
and underscore filenames satisfying the accepted [B01 module-naming
contract](b01-convex-module-naming-compatibility.md). Cross-module calls use
`makeFunctionReference` from `convex/server`, adding no generated API module;
that reference is untyped against its target, so the sibling-export test rather
than the type checker proves the dispatch table.

`http.ts` is the router only. It default-exports the value returned by
`httpRouter()` from `convex/server` and registers each route with a handler
wrapped in `httpAction`; it declares no other export. Convex routes an exact
`path` or a `pathPrefix` ending in a slash, so it registers exactly `POST
/internal/commands` as an exact path and `GET /public/offerings/` and `GET
/public/directory/` as path prefixes, the method and path literals the M22
signing input pins. No other method, `OPTIONS`, wildcard, or catch-all route
exists, no response carries an `access-control-allow-*` header, and every
response is `content-type: application/json` with `cache-control: no-store`.

`command_dispatch.ts` holds all header, verification, dispatch, and projection
logic as plain helpers: no registered function, no `@tool402/backend` export. It
exports `handleCommandIngress`, `handleOfferingProjection`, and
`handleActiveDirectory`, each `(ctx, request) => Promise<Response>`, plus
`handleCommandIngressForTest(ctx, request, seams)` with the same result type.
`seams` has exactly `resolveIngressKey`, `tryClaimReplay`,
`resolveCommandAuthorities`, and `serverNowMilliseconds`: the accepted M23, M24,
and M30 dependency types, unchanged. `handleCommandIngressForTest` is
direct-test observability only, reads no environment, and is never referenced by
`http.ts`. `wallet_command_replay.ts` exposes exactly two registered functions:
the internal mutation `claimIngressReplayIdentity`, taking only
`replayIdentity: v.string()` and returning literal `"claimed"` or
`"already_claimed"`, and the internal query `readCommandAuthorities`, taking
only `chainId: v.literal(296)` and `canonicalSignerAddress: v.string()`, reading
`commandAuthorities` through the accepted
`by_chain_id_and_canonical_signer_address` index with `take(2)` and returning
the accepted M30 `CommandAuthorityRecord` field set with no document identifier.
Production `resolveCommandAuthorities` calls it through `ctx.runQuery` and only
reads; M32 and M40 still revalidate authority in their own transactions.

## Ingress verification sequence

`handleCommandIngress` fails closed at every step, returns no reason to the
caller, and performs exactly this order: read the five ingress headers, read raw
bytes under a fixed 65536-byte cap, take one server clock reading, call M25
`claimProtectedBody` over those exact bytes, normalize through M39, dispatch by
command type, and answer with the closed union. The headers map exactly:

```text
x-tool402-key-id          keyId
x-tool402-timestamp       timestampUnixSeconds
x-tool402-nonce           requestNonce
x-tool402-content-sha256  bodySha256
x-tool402-signature       signature
```

The envelope is built only when all five are present as nonempty strings, so a
missing, empty, or repeated header fails closed before any byte read, key
resolution, or database access. A body over the cap is rejected before hashing,
and the one clock reading serves both the M23 and M39 time checks.
`TOOL402_INGRESS_KEY_ID` and `TOOL402_INGRESS_SECRET` are the only environment
values read, and only `command_dispatch.ts` reads them. The resolver returns a
key only when the envelope `keyId` equals the configured identifier exactly and
the configured secret decodes to a 32-byte key in the encoding
`HA-CAMPAIGN-CONVEX-001` records, imported as a non-extractable HMAC SHA-256
`CryptoKey` with `["verify"]` usage; any absent, malformed, or mismatched
configuration resolves to `undefined`, which M23 treats as an unusable key. No
key, secret, signature, digest, or raw body enters a response, durable row, or
thrown value.

## Ingress replay claim

The injected `tryClaimReplay` calls `claimIngressReplayIdentity` through
`ctx.runMutation`, which claims in `ingressCommandReplayClaims`, requested by
this card's schema reservation and holding exactly `replayIdentity: v.string()`
and `claimedAt: v.int64()` with the index `by_replay_identity`. It is distinct
from the `walletCommandReplayClaims` table M40-T010 reserves for wallet-command
replay identities: the two tables answer two different replay questions, and
the HI-002 intake records both reservations as additive schema amendments the
root confirms before either card is ready. A different recorded name or column
set governs and amends this section before any RED test.

The mutation reads that table through `by_replay_identity` with `take(2)`. With
zero rows it inserts one row carrying the claimed identity and the claim time
and returns `"claimed"`; with any existing or malformed row it writes nothing
and returns `"already_claimed"`, which M24 treats as a closed failure. The
claimed identity is the M22 `<keyId>:<requestNonce>`: transport replay only,
distinct from the `tool402:wallet-command:v1:296:<signer>:<nonce>` identity M32
and M40 claim. Claim and admission are two transactions: a failure between them
consumes one transport nonce without admitting a command, and the caller retries
with a fresh transport nonce while the signed replay identity stays untouched.

## Dispatch and the closed response union

A normalized command is dispatched through one module-private frozen table:

```text
external.prepare  external_prepare_command_admission:admitExternalPrepareCommand
offering.create   offerings:admitOfferingCreate
directory.publish directory_versions:admitDirectoryPublish
external.attachCandidate  declared entry, disabled until M43-T010 enables it
```

The `external.prepare` argument is exactly the accepted M32 serialized record
with its payload; M41 adds no field or clock and M32 rechecks everything. When
`admitExternalPrepareCommand` returns status `NEW` for an `ATS_CREATE`
`operationKind` whose `subjectPublicId` matches a `DRAFT` offering with the same
subject, the dispatch boundary then invokes the M40-owned
`markAssetPending(offeringId, attemptId)` transition for that offering; any
other status or `operationKind` leaves every offering untouched. M41 owns no
offering column of its own, and the paired `markAssetReady` transition stays
with the M43 verification action.

The `external.attachCandidate` entry is declared here and disabled. M43-T010
enables it through an amendment of `packages/backend/convex/command_dispatch.ts`
under a root integration reservation; no other card touches this table.

The write-route body is exactly one of `{ outcome: "ACCEPTED", publicId? }`,
`{ outcome: "REPLAYED", publicId? }`, `{ outcome: "CONFLICT", publicId? }`,
`{ outcome: "REJECTED" }`, or `{ outcome: "UNSUPPORTED_TYPE" }`, each with
exactly one producing step. `ACCEPTED` is the M32 `NEW` status or an M40 first
admission, `REPLAYED` the M32 `COMMAND_REPLAYED` or `IDEMPOTENCY_REPLAYED`
status or an M40 idempotent repeat, `CONFLICT` the M32 `IDEMPOTENCY_CONFLICT`
status or an M40 drift result, and `UNSUPPORTED_TYPE` only a normalized command
whose type has no enabled dispatch entry, exactly `external.attachCandidate`
until M43 lands. `REJECTED` is every other outcome: a missing header, oversized
body, unusable key, digest or MAC mismatch, skew failure, claimed transport
identity, failed normalization, or thrown admission. M23 through M25 and M39 are
reason-free, so authority failures there and in the M32 and M33 gates report as
`REJECTED` too.

`publicId` is only ever an echo of a caller-supplied value, never an internal
document identifier: `offeringPublicId` for `offering.create` and
`directory.publish`, the payload `idempotencyKey` for `external.prepare`, absent
from `REJECTED` and `UNSUPPORTED_TYPE`. Every write-route response uses HTTP
`200` and triggers no retry, provider call, wallet call, or external
submission.

## Public projection reads

Both read routes are unauthenticated, take no envelope, key, or body, and parse
the routed prefix remainder before any database access.
`/public/offerings/<offeringPublicId>` requires exactly 1 through 96 ASCII
letters, digits, underscores, or hyphens, and
`/public/directory/<serviceSlug>/active` that grammar plus the literal `/active`
suffix. A valid remainder is read through the in-batch M40 projection query, and
M41 serializes only the closed field lists below. Each route answers its own
closed union: `/public/offerings/<offeringPublicId>` answers
`{ outcome: "FOUND", record }` and `/public/directory/<serviceSlug>/active`
answers `{ outcome: "FOUND", record, directoryVersion }`, both with HTTP `200`;
both routes share `{ outcome: "NOT_FOUND" }` with `404` and
`{ outcome: "UNAVAILABLE" }` with `503`, each with one producing step: a
remainder failing the prefix grammar and a query returning `null` both produce
`NOT_FOUND`; a thrown query or a returned record failing the field-set check
produces `UNAVAILABLE`; only a well-formed record produces `FOUND`.

On the offering route `record` is the M40 sanitized snapshot: exactly
`offeringPublicId`, `version`, `subjectPublicId`, `state`, `definition`,
`narrative`, the two advertised prices, the stored lowercase
`canonicalSignerAddress`, `atsAssetEvmAddress` when set, `acceptedAt`, and
`updatedAt`. On the directory route it is exactly the
accepted M28 candidate set (`schemaVersion`, `serviceId`, `serviceSlug`,
`offeringPublicId`, `offeringVersion`, `capabilities`, `x402Endpoint`, optional
`webUrl`, `paymentProtocol`, `paymentNetwork`, `asset`, `advertisedTiers`,
`issuerRevenueAccount`, `clearingAccount`, `status`, `publishedAt`) and nothing
else, one extra own field failing `parseAgentDirectoryRecordCandidate` closed;
the stored `directoryVersion` is always present beside `record` on that route,
never merged into it. No projection includes a nonce, replay identity,
idempotency key, payload hash, signature, authority version, principal, or
document identifier, and a served record asserts no on-chain fact.

## Explicit exclusions

Beyond the single reserved `ingressCommandReplayClaims` amendment to
`packages/backend/convex/schema.ts`, change no accepted file, package, lockfile,
generated output, or Web or Agent path. Add no Convex component, generated API
module, authority writer, offering column write of its own beyond the one
declared `markAssetPending` invocation, cron, scheduler, retry, cache, rate
limiter, CORS policy, session, cookie, second environment reader, wallet,
provider, ATS SDK, Mirror Node, or funding, payment, settlement, payout, or
deployment behavior. Declare the `external.attachCandidate` seam, disabled;
M43-T010 enables it under its own reservation.

## Acceptance evidence

- A durable test-only RED commit precedes every M41 production source change and
  fails only because the declared M41 modules and replay table do not exist.
  Focused tests use a controlled fake context like the accepted M32 tests, a
  real `Request`, and the established valid M23 envelope and key vector to prove
  the route table, header mapping, byte cap, one clock reading, one exact
  transport replay claim, the M32 status mapping, `UNSUPPORTED_TYPE` only for a
  disabled entry, exactly one `markAssetPending` call on an `ATS_CREATE` `NEW`
  result and none on any other status or kind, echo-only `publicId`, both
  read-route grammars and `record` field sets, that no response or row exposes
  key, secret, signature, digest, body, or identifier material, and `http.ts`
  routing only.
- One focused test imports each dispatched sibling module,
  `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/convex/offerings.ts`, and
  `packages/backend/convex/directory_versions.ts`, and asserts the exact
  exported name each frozen dispatch-table literal names is present, so a rename
  breaks the table at test time, not at a live request.
- Backend and root typecheck, test, lint, clean-install dry run, queue,
  reference, and whitespace checks, the enabled local guard, independent task
  review, and two fresh module-review generations pass before acceptance.
