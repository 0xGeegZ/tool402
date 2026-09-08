# M38 closed offering command payload contracts

## Delivery boundary

This contract adds the three pure Core payload shapes the campaign deploy path
needs beside the accepted
[M26 external-prepare payload](m26-external-prepare-payload.md):
`offering.create`, `directory.publish`, and `external.attachCandidate`. Each
gets one closed descriptor-safe parser and one canonical-bytes builder.

These are payload parsers, not signed-command parsers: no raw bytes or JSON,
and no envelope, signature, signer, role, nonce, or command type. Defining a
payload shape admits no command type: the vocabulary accepted in
[HA-COMMAND-AUTHORITY-001](../work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md)
still carries only `external.prepare`, and admitting these three is the human
amendment `HA-COMMAND-AUTHORITY-002`, consumed by a later normalizer. They
serve the approved
[campaign deploy flow design](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).

## Public API

`packages/core/src/offering-create-payload.ts`,
`packages/core/src/directory-publish-payload.ts`, and
`packages/core/src/attach-candidate-payload.ts` export this surface through
`@tool402/core`:

```ts
export interface OfferingNarrative {
  readonly title: string;
  readonly customerProblem: string;
  readonly customerUseCases: readonly string[];
  readonly useOfFunds: readonly string[];
  readonly risks: readonly string[];
}
export interface OfferingCreatePayload {
  readonly schemaVersion: 1;
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly subjectPublicId: string;
  readonly definition: OfferingDefinition;
  readonly narrative: OfferingNarrative;
  readonly advertisedQuickPriceTinybars: Tinybar;
  readonly advertisedStandardPriceTinybars: Tinybar;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}
export interface DirectoryPublishPayload {
  readonly schemaVersion: 1;
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly directoryVersion: number;
  readonly record: AgentDirectoryRecordCandidate;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}
export type MirrorTransactionId = string & {
  readonly __brand: "MirrorTransactionId";
};
export type CandidateTransactionId = HederaTransactionId | MirrorTransactionId;
export interface AttachCandidatePayload {
  readonly schemaVersion: 1;
  readonly attemptPublicId: string;
  readonly operationKind: ExternalOperationKind;
  readonly candidateTransactionId: CandidateTransactionId;
  readonly candidateEvmAddress?: EvmAddress;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}
```

Each module exports its own `parse<Type>Payload(input: unknown)` returning the
frozen value above, and one bytes builder over that parsed payload:
`canonicalOfferingCreatePayloadBytes`, `canonicalDirectoryPublishPayloadBytes`,
and `canonicalAttachCandidatePayloadBytes`, each returning `Uint8Array`. The
referenced `OfferingDefinition`, `AgentDirectoryRecordCandidate`,
`ExternalOperationKind`, `EvmAddress`, `Tinybar`, and `HederaTransactionId` are
accepted M10, M20, M26, and M28 types, reused and never redefined.

## Closed input shapes

Each parser accepts exactly one ordinary record whose prototype is exactly
`Object.prototype`, carrying exactly the own enumerable data fields of its
interface above and no others. Every field is required except
`candidateEvmAddress`, whose presence is fixed by `operationKind` below, and
`schemaVersion` is the primitive number exactly `1`. `offeringPublicId` and
`subjectPublicId` use the accepted local public-ID grammar of 1 through 96
ASCII letters, digits, underscores, or hyphens; they are correlation
vocabulary only and resolve, own, or prove nothing. `offeringVersion` and
`directoryVersion` are primitive safe integers from `1` through
`Number.MAX_SAFE_INTEGER`, matching the accepted M28 rule; the durable
admission boundary, not this parser, fixes which versions it accepts.
`idempotencyKey` and `expiresAt` follow the accepted M26 rules exactly: 22
canonical unpadded base64url characters ending in `A`, `Q`, `g`, or `w`, and a
real canonical UTC instant in `YYYY-MM-DDTHH:mm:ss.sssZ` form round-tripping
through `Date`. Both are declared values only: no parser reads a clock or makes
a replay or idempotency claim. `attemptPublicId` is the canonical M26
idempotency key of the prepared `external.prepare` attempt the candidate
belongs to: 21 base64url characters followed by `A`, `Q`, `g`, or `w`, the same
grammar as `idempotencyKey`, and never equal to this payload's own
`idempotencyKey`. That inequality is a lexical check only; resolving the
attempt through its durable record belongs to a later boundary.

`definition` is passed to the accepted `parseOfferingDefinition` and `record`
to the accepted `parseAgentDirectoryRecordCandidate`; both do their own closed
parse, and neither rule set is restated or relaxed here, only narrowed. In
`directory.publish` the parsed record's `offeringPublicId` and
`offeringVersion` must equal the payload's or the parse fails closed. The
record's URL fields are the one place a delegated parser does not return the
caller's own string, because the accepted M28 `parseUrl` returns the
WHATWG-normalized `href`, so `directory.publish` also fails closed unless the
caller's own `x402Endpoint` string, and its `webUrl` string when present,
already equal what M28 returns for them, that is unless each caller string
satisfies `new URL(value).href === value`. A caller variant differing only in
a trailing slash, in case, or in percent encoding is rejected, never silently
re-rendered.

## Narrative, price, and candidate admission

Each narrative list is an ordinary array of 1 through 6 items under the array
shape rules the accepted M28 parser applies to its own lists. Every narrative
value is a primitive string that is already trimmed and nonblank, contains no
`U+0000`-`U+001F` or `U+007F`-`U+009F` control character and no unpaired
surrogate, and is at most 100 UTF-8 bytes for `title`, 1,000 for
`customerProblem`, and 400 for each list item. These are local parser-admission
bounds, not product maximums, and the control-character and surrogate
exclusions are load-bearing: they cap canonical escaping at twice the input,
keeping the largest admissible narrative below the accepted canonicalizer's
32 KiB emission limit.

`advertisedQuickPriceTinybars` and `advertisedStandardPriceTinybars` are
primitive strings of at most 8 code units accepted by the accepted M10
`parseTinybar` parser, with a value from 1 through 10,000,000 tinybars
inclusive. They are display amounts only: no relation between the two is
asserted and the x402 challenge remains payment authority. `operationKind` is
exactly one member of the accepted M26 `ExternalOperationKind` union.
`candidateTransactionId` is exactly one of two retained lexical forms: the
canonical `0.0.N@seconds.nanos` form accepted by the M10
`parseHederaTransactionId` parser, returned as `HederaTransactionId`; or the
mirror `0.0.N-seconds-nanos` form whose nanosecond group is exactly nine
digits, returned as `MirrorTransactionId`. This contract does not convert
between the forms, assert that they are equivalent, or claim that either
transaction exists; a later boundary holding the Mirror Node record owns every
such comparison. `candidateEvmAddress` is `0x` and exactly 40 lower-case
hexadecimal characters, required when `operationKind` is `ATS_CREATE` and
absent for every other kind; a present address under any other kind fails the
parse closed, as does an absent one under `ATS_CREATE`.

## Canonical payload bytes

Each bytes builder makes one plain JSON-safe projection of its parsed payload
and returns the UTF-8 bytes emitted by the accepted Core RFC 8785 JCS
canonicalizer, which sorts object keys itself. The projection carries exactly
the payload's own fields, with three conversions: every branded `Tinybar`,
`NoteUnits`, and `BasisPoints` value, that is the eight numeric `terms` values
and both advertised prices, becomes its canonical decimal string because the
canonicalizer accepts no `bigint`; `terms.version` stays the JSON string it
already is and every `schemaVersion` and version field stays a JSON number; and
an absent `webUrl` or `candidateEvmAddress` is omitted, never `null`. The
parsers require canonical decimal input, the accepted M20 terms boundary
requires an already trimmed `version`, and the URL rule above requires each
caller-supplied record URL to be already normalized, so this projection
reproduces the signer's own canonical bytes exactly rather than a re-rendered
variant. Core stops at the bytes: Keccak-256 is computed by the
consumer that already depends on `viem`, and this contract adds no hash
function, no `viem` dependency, and no `payloadHash` field, and neither
produces nor compares a command digest.

## Snapshot safety and output

Each parser obtains own keys and property descriptors under `try`/`catch`,
captures only enumerable data-descriptor values, and never reads a caller field
through property access, spread, `Object.assign`, `toJSON`, coercion, or an
accessor, exactly as the accepted M20, M26, and M28 parsers do. Missing, extra,
inherited, symbol-keyed, nonenumerable, accessor-backed, custom-prototype,
malformed, and reflection-throwing input fails closed without invoking a caller
accessor. Portable reflection cannot prove that an otherwise valid record was
never a transparent proxy, so each parser instead validates a detached captured
representation and never retains a caller record or array. A result is a frozen
root with the documented fields and frozen narrative lists; later caller
mutation cannot alter it, and each bytes call returns a fresh `Uint8Array`.

## Explicit exclusions

Do not add a raw-byte or JSON decoder; a signed-command envelope; signature,
signer, role, nonce, key, or wallet handling; a keccak or `viem` dependency;
replay, idempotency, or uniqueness storage; a clock; configuration or
environment access; HTTP; Convex; a database client; an ATS SDK or provider
adapter; a durable attempt, offering, or directory-version record; account,
target, or attempt resolution; directory publication or activation; payment,
funding, allocation, transfer, transaction, candidate verification, receipt,
settlement, clearing, HCS, payout, deployment, or live behavior. Parsing one of
these payloads makes no command admissible: the later normalizer, the human
authority amendment, and the durable admission boundary all remain required
first.

## Acceptance evidence

- A test-only RED commit precedes every production source or barrel-export
  commit for this card and observes the three absent modules.
- Focused tests prove one exact valid frozen detached payload per type;
  no-invoked-accessor and reflection failures; the delegated M20 and M28
  failures; the `directory.publish` cross-field equality; the
  `attemptPublicId` idempotency-key grammar and its rejection when it equals
  the payload's own `idempotencyKey`; the `ATS_CREATE` address rule in both
  directions; both transaction-id forms with no conversion; narrative and
  price bounds at the limit and one past it; and control-character and
  surrogate rejection.
- Focused tests prove that `canonical*PayloadBytes(parse*(fixture))` equals
  `new TextEncoder().encode(canonicalizeRequirements(fixture))` for a valid
  untrusted fixture, that repeated calls return equal but distinct `Uint8Array`
  values, and that an omitted optional field is absent. A further test proves
  that a record URL which is not already its own normalized `href` fails the
  `directory.publish` parse closed rather than being re-rendered.
- Compile-time fixtures prove the readonly roots, fixed literals, branded
  prices, the two-member transaction-id union, the optional address, and the
  reused accepted types.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
