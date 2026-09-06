# M17 canonical requirements quote contract

## Purpose

This local contract creates the smallest pure Core boundary that binds an
accepted offering allocation quote to the exact canonical bytes of caller-
supplied payment requirements. It makes requirements drift and explicit quote
expiry observable before any future adapter considers a payment attempt.

It is not a payment request, payment validation, signer, wallet, account,
funding, allocation, ATS action, settlement, receipt, persistence, HCS,
deployment, or live proof. It does not decide whether any requirements are
supported, payable, or externally verified.

## Public surface

`packages/core/src/requirements-offering-quote.ts` exports:

```ts
export type CanonicalRequirements = string & {
  readonly __brand: "CanonicalRequirements";
};

export type RequirementsDigest = string & {
  readonly __brand: "RequirementsDigest";
};

export interface OfferingRequirementsQuoteInput {
  readonly expectedTermsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly confirmedAllocatedUnits: NoteUnits;
  readonly requirements: unknown;
  readonly expiresAt: string;
}

export interface OfferingRequirementsQuote {
  readonly termsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly paymentTinybars: Tinybar;
  readonly remainingCapacityUnits: NoteUnits;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export function canonicalizeRequirements(
  input: unknown,
): CanonicalRequirements;
export function sha256Requirements(
  input: unknown,
): Promise<RequirementsDigest>;
export function createOfferingRequirementsQuote(
  terms: OfferingTerms,
  input: OfferingRequirementsQuoteInput,
): Promise<OfferingRequirementsQuote>;
export function matchesQuotedRequirements(
  quote: OfferingRequirementsQuote,
  requirements: unknown,
): Promise<boolean>;
export function isOfferingRequirementsQuoteActive(
  quote: OfferingRequirementsQuote,
  observedAt: string,
): boolean;
```

`NoteUnits`, `Tinybar`, and `OfferingTerms` are the accepted public Core
types. The module and its public exports are added to
`packages/core/src/index.ts`.

## Canonical requirements input

`canonicalizeRequirements` accepts only a non-empty, ordinary JSON object.
Every traversed plain object must have `Object.prototype`, own enumerable
string data properties only, and no accessor, symbol, inherited input property,
or duplicate captured key. Nested values may be `null`, booleans, strings,
finite numbers other than negative zero, arrays, or ordinary objects under the
same rules. `undefined`, `bigint`, functions, symbols, non-finite numbers,
negative zero, sparse arrays, cycles, hostile getters, and non-ordinary objects
reject.

The result serializes each value recursively with JSON string escaping and
lexicographically sorted object keys. Arrays retain index order. The root and
all nested values are captured before serialization so later mutation of the
input cannot affect a completed result. A traversal is bounded to 16 nested
containers including the root, 256 captured JSON values including the root
container, 128 object properties per object, 128 array items per array, and
32 KiB of UTF-8 canonical output. Exactly-at-limit values are accepted;
exceeding any one bound rejects rather than truncating or silently dropping
data.

This is an exact-byte binding boundary, not a protocol-semantic parser. A later
dependency-correct schema task owns closed payment-field validation such as
network, asset, recipient, resource, and extension semantics. Because the
digest covers the whole accepted canonical object, an added extension field or
any field-value drift yields a different digest.

## Hashing and expiry

`sha256Requirements` first invokes `canonicalizeRequirements` on untrusted
input, then hashes the resulting UTF-8 canonical text with the platform Web
Crypto SHA-256 primitive and returns lower-case hexadecimal. The internal helper
that accepts `CanonicalRequirements` is not public, so no JavaScript caller
can present an arbitrary string as already canonical. The module imports no
runtime adapter.

`expiresAt` and `observedAt` use exactly the canonical UTC form
`YYYY-MM-DDTHH:mm:ss.sssZ`. Each must round-trip through `Date.parse` and
`toISOString`; no clock is read. `isOfferingRequirementsQuoteActive` returns
true only when the explicit `observedAt` is strictly earlier than the quote
expiry. Equality is expired.

## Quote construction and matching

`createOfferingRequirementsQuote` delegates offering version, minimum-unit,
capacity, and exact-payment validation to `calculateAllocation`. It hashes the
full accepted canonical requirements object and returns a frozen value with the
allocation facts, digest, and canonical expiry. It retains neither the raw
object nor canonical requirements text.

`matchesQuotedRequirements` canonicalizes and hashes a supplied candidate and
returns true only on exact digest equality. It does not read a clock or make a
payment decision; callers must separately require
`isOfferingRequirementsQuoteActive` before any later state-machine work.

## Invariants and exclusions

- The offering version and allocation arithmetic are exactly those accepted by
  M16; no alternate money, unit, or capacity calculation is introduced.
- Reordered object keys produce the same canonical requirements and digest.
- Any value change, added field, removed field, malformed JSON-like value, or
  expiry-format failure rejects or fails matching without a fallback.
- A valid canonical representation does not prove an endpoint, network,
  recipient, asset, price, resource, payment, allocation, or settlement fact.
- The module reads no environment, clock, storage, network, process, wallet,
  signer, account, ATS, transaction, receipt, persistence, or deployment API.

## Acceptance evidence

Focused runtime tests prove nested key-order stability, the published SHA-256
vector, raw-string hash rejection, full-object drift including an added
extension, allocation binding, strict expiry comparison, malformed input
rejection, hostile accessor/proxy rejection, exact-limit acceptance, each
one-past-limit rejection, and output immutability. A compile-time fixture proves
canonical/digest brands remain distinct from exact monetary and unit brands.
Core/root typecheck, test, lint, clean-install, queue/reference/whitespace
checks, enabled local guard, independent task review, and two fresh
module-review generations are required before acceptance.
