# M39 authenticated wallet command normalizer

## Delivery boundary

This contract adds one internal backend boundary that authenticates a signed
wallet command of any type the campaign deploy path needs. It consumes one exact
M25 claimed-body capability, decodes one strict local JSON transport, dispatches
to exactly one closed payload parser, recomputes that payload's canonical
digest, verifies the same fixed EIP-712 command, recovers one canonical EOA,
applies the same injected authority read and clock rules, and returns one frozen
discriminated DTO.

M39 introduces no command vocabulary of its own. It admits `external.prepare`
because
[HA-COMMAND-AUTHORITY-001](../work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md)
already admits it, and it admits `offering.create`, `directory.publish`, and
`external.attachCandidate` only under the `HA-COMMAND-AUTHORITY-002` amendment
requested by the
[HI-002 intake card](../work-queue/queue/60-done/HI-002-campaign-deploy-reinstatement.md).
Without that accepted amendment the three additional types are not admissible
and this contract may not be implemented.

The accepted [M30 normalizer](m30-authenticated-external-prepare-normalizer.md)
stays byte-unchanged and keeps its one caller, the
[M31 handoff](m31-external-prepare-command-admission.md). The durable M32
admission independently revalidates the command context and payload digest in
its own internal mutation and does not call M30. M39 is an additional boundary
for a later HTTP command-ingress card and rewires no accepted caller.

## Internal API

`packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts`
remains internal and is not exported from `@tool402/backend`. The authority
types are imported from the accepted M30 module, `ExternalPreparePayload` and
`parseExternalPreparePayload` from accepted M26, and the three additional
payload types, parsers, and canonical byte builders from the M38 Core boundary
committed in the same batch.

```ts
export async function normalizeClaimedWalletCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: ResolveCommandAuthorities,
): Promise<NormalizedWalletCommand | null>;
```

`NormalizedWalletCommand` is the closed four-member union discriminated by
`type`. Every member carries the twelve shared own readonly fields `version`
(integer `1`), `type` (the member's command-type literal), `chainId` (integer
`296`), `role` (`CommandAuthorityRole`), and the strings
`canonicalSignerAddress`, `nonce`, `issuedAt`, `expiresAt`, `payloadHash`,
`replayIdentity`, `principalPublicId`, `authorityVersion`, plus exactly these
fields and no others:

```text
external.prepare          payload: ExternalPreparePayload
offering.create           payload: OfferingCreatePayload
directory.publish         payload: DirectoryPublishPayload
                          deferredSubjectOwnership: { kind: "OFFERING", offeringPublicId: string, offeringVersion: number }
external.attachCandidate  payload: AttachCandidatePayload
                          deferredSubjectOwnership: { kind: "ATTEMPT", attemptPublicId: string }
```

The module additionally exports one test-only predicate
`isWalletCommandTimeWindowValidForTest(issuedAt, expiresAt, serverNow): boolean`
under the restrictions M30 records for its own: no claimed body, payload,
signature, authority record, or external capability, no side effect, delegation
to the same private window predicate, and no production import. It never calls
`Date.now` or reads a clock, configuration, environment, database, or network;
the resolver is an injected read boundary.

## Strict claimed-body transport

The input must first pass `isClaimedProtectedBody` and be read only through
`readClaimedProtectedBody`; any other value returns `null` before a byte decode,
parser call, resolver access, or signature operation. The exact UTF-8 body is a
JSON object with exactly two keys, `command` and `payload`. The command keeps
the accepted nine own fields; only `type` widens, to one of the four literals
above. `payload` is never added to the EIP-712 message; only its recomputed
digest is signed.

M39 owns its own strict decoder because the three additional payloads are not
flat. It extends the accepted M30 decoder in exactly two ways and no other:
objects may nest to at most four levels counting the transport root, and an
array is admitted only as a property value whose members are all primitive
strings. A nested array, an array of objects, or a fifth object level is
rejected. One fixed bound of 16,384 decoded bytes applies: the largest payload
admissible under the M38 field limits is well inside it, and it is a local
admission limit that asserts no external maximum. Every other accepted M30
rejection is retained unchanged, including arrays elsewhere, booleans, `null`,
non-integer numbers, escapes, control characters, non-ASCII bytes, invalid
UTF-8, duplicate keys, and unknown, missing, inherited, accessor-backed,
custom-prototype, or extra fields. The decoder never normalizes a noncanonical
wire value.

## Validation sequence

```text
M25 exact claimed capability
→ private byte snapshot from M25
→ strict UTF-8 / duplicate-key-safe JSON decode
→ closed command parse and command-type dispatch
→ the one closed payload parser for that type
→ exact payload expiry equality
→ canonical JCS payload digest recomputation
→ fixed EIP-712 signature grammar and low-s validation
→ fixed-domain signature recovery and signer equality
→ injected authority resolution and per-type authorization predicate
→ nonce/clock-window validation
→ frozen normalized DTO
```

No parser other than the one selected by the signed command type may run, and no
resolver call can occur before the recovered signer equals the submitted
canonical signer. Every failure returns `null` without a partial result or
retry. The command grammar, the low-s signature grammar and its
recovery normalization, the fixed domain, and the `Tool402Command` field order
are exactly the accepted ones. Because `type` is a signed message field, a
signature made for one command type can never be replayed as another. The raw
signature is neither returned nor persisted.

### Payload dispatch and canonical digest

| Command type               | Payload parser                     | Canonical bytes                             |
| -------------------------- | ---------------------------------- | ------------------------------------------- |
| `external.prepare`         | M26 `parseExternalPreparePayload`  | the frozen template below                   |
| `offering.create`          | M38 `parseOfferingCreatePayload`   | M38 `canonicalOfferingCreatePayloadBytes`   |
| `directory.publish`        | M38 `parseDirectoryPublishPayload` | M38 `canonicalDirectoryPublishPayloadBytes` |
| `external.attachCandidate` | M38 `parseAttachCandidatePayload`  | M38 `canonicalAttachCandidatePayloadBytes`  |

M39 must not implement, wrap, or approximate canonicalization for the three
additional types; the M38 builders are their only source. For
`external.prepare` it restates the accepted frozen template, since the M30
emitter is private, and the shared vectors prove it byte-equal:

```text
{"canonicalParametersHash":"<value>","chainId":296,"expectedTarget":"<value>","expiresAt":"<value>","idempotencyKey":"<value>","network":"hedera:testnet","operationKind":"<value>","subjectPublicId":"<value>"}
```

The digest is always the Keccak-256 of those UTF-8 bytes, computed with the
pinned exact `viem` `2.56.1`, and must equal the signed `payloadHash` byte for
byte. The payload's `expiresAt` must exactly equal the command `expiresAt`.

### Authority, time, and output

The resolver may return only one enabled valid record for the recovered
signer/chain pair; zero, multiple, malformed, disabled, conflicting, or
mismatched records return `null`. The per-type predicate is exactly:

| Command type                              | Required authority                               |
| ----------------------------------------- | ------------------------------------------------ |
| `external.prepare`, kind `ATS_*`          | `ISSUER` owning the payload `subjectPublicId`    |
| `external.prepare`, kind `HEDERA_FUNDING` | `BACKER`                                         |
| `offering.create`                         | `ISSUER` owning the payload `subjectPublicId`    |
| `directory.publish`                       | `ISSUER`, plus the `OFFERING` deferred reference |
| `external.attachCandidate`                | `ISSUER`, plus the `ATTEMPT` deferred reference  |

Owning is exact membership in `ownedSubjectPublicIds`. A
`directory.publish` payload names an offering and an `external.attachCandidate`
payload names an attempt; neither carries a subject identifier, so this boundary
cannot prove subject ownership for them and does not pretend to. It enforces the
`ISSUER` role and returns the exact `deferredSubjectOwnership` reference, which
the durable boundary owning those records must resolve and bind to the same
`principalPublicId` before any write; a consumer that ignores it has not
satisfied `HA-COMMAND-AUTHORITY-002`.

The clock rules are unchanged, and the replay identity is exactly
`tool402:wallet-command:v1:296:<canonicalSignerAddress>:<nonce>` for every
command type; it is deliberately not type-scoped, so one nonce is spendable once
across the whole vocabulary. The DTO is frozen, carries only the declared own
fields, and excludes the raw body, raw signature, recovery byte, resolver
record, and every durable or external capability. For an `external.prepare`
input it has exactly the same own field names and values as the M30 DTO.

## Explicit exclusions

Do not modify M22 through M33 source or tests, the Convex schema, any Convex
query, mutation, action, or HTTP router, the backend public barrel, Core, the
lockfile, Web, Agent, or generated output. Do not add browser UI, wallet or
provider behavior, environment or configuration access, a cache, replay or
idempotency claim, durable attempt, `PREPARED` state, offering or directory
record, ATS SDK, funding, payment, transaction, settlement, payout, deployment,
or live evidence.

## Acceptance evidence

- `HA-COMMAND-AUTHORITY-002` is accepted before the test-only RED commit, which
  fails only because the declared module does not exist.
- Shared vectors drive both the accepted M30 normalizer and M39 over the same
  claimed bodies and prove every accepted and rejected `external.prepare` case
  agrees exactly, digest included. The diff shows the M30 source and its focused
  test file byte-unchanged.
- Focused tests prove M25-only byte access, the closed transport and command
  shapes, duplicate-key and escape rejection, the bounded depth and byte bound,
  string-only arrays, per-type dispatch with no other parser invoked,
  exact digest equality against the M38 builders, expiry equality, cross-type
  signature rejection, signer mismatch, resolver ordering, each row of the
  authority table, the deferred references, the frozen DTO, and every
  prohibited side effect's absence.
- Backend/root typecheck, test, lint, clean-install dry run, queue, reference,
  and whitespace checks, the enabled local guard, independent task review, and
  two fresh clean module-review generations pass before acceptance.
