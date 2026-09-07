# M26 closed external-prepare payload contract

## Delivery boundary

This contract adds the smallest pure Core schema needed before a later
authenticated command boundary can carry one external-prepare payload into a
durable attempt boundary. It accepts one untrusted normalized payload record,
captures its exact fields through descriptors, validates only the closed
lexical vocabulary below, and returns a detached frozen value.

This is a payload parser, not a signed command parser. It does not accept raw
HTTP bytes or JSON, and it does not parse a wallet envelope, signature,
signer, role, principal, nonce, issued-at time, or command version/type. A
later dedicated boundary owns authenticated envelope validation and may pass
this payload only after it has independently established that authority.

## Public API

packages/core/src/external-prepare-payload.ts exports this public surface
through @tool402/core:

~~~ts
export type ExternalOperationKind =
  | "ATS_CREATE"
  | "ATS_CONTROL_LIST"
  | "ATS_ISSUE"
  | "ATS_TRANSFER"
  | "ATS_COUPON"
  | "HEDERA_FUNDING";

export type EvmAddress = string & {
  readonly __brand: "EvmAddress";
};

export type ExternalPrepareTarget = HederaAccountId | EvmAddress;

export type CanonicalParametersHash = string & {
  readonly __brand: "CanonicalParametersHash";
};

export interface ExternalPreparePayload {
  readonly operationKind: ExternalOperationKind;
  readonly subjectPublicId: string;
  readonly network: "hedera:testnet";
  readonly chainId: 296;
  readonly expectedTarget: ExternalPrepareTarget;
  readonly canonicalParametersHash: CanonicalParametersHash;
  readonly idempotencyKey: string;
  readonly expiresAt: string;
}

export function parseExternalPreparePayload(
  input: unknown,
): ExternalPreparePayload;
~~~

The input must be one ordinary Object.prototype record with exactly the eight
own enumerable data fields below and no others:

~~~text
operationKind
subjectPublicId
network
chainId
expectedTarget
canonicalParametersHash
idempotencyKey
expiresAt
~~~

Every field is required. operationKind, subjectPublicId, network,
expectedTarget, canonicalParametersHash, idempotencyKey, and expiresAt are
primitive strings. chainId is the primitive number 296.

## Closed lexical vocabulary

operationKind is exactly one member of ExternalOperationKind. No other
operation family is admitted.

subjectPublicId is an opaque local public identifier of 1 through 96 ASCII
characters. Its first character is an ASCII letter or digit; every remaining
character is an ASCII letter, digit, period, underscore, colon, or hyphen.
It is correlation vocabulary only and neither resolves a subject nor proves
ownership.

network is exactly hedera:testnet and chainId is exactly 296. This fixed pair
is local protocol vocabulary only; it does not read configuration, discover
a network, or assert that an ATS or provider is available.

expectedTarget is exactly one of:

- a canonical Hedera account identifier accepted by the existing M10 parser;
  or
- a lower-case EVM address matching 0x followed by exactly 40 lower-case
  hexadecimal characters.

The returned ExternalPrepareTarget retains that lexical distinction in its
type, but does not assign a target kind, resolve an account or contract,
establish existence, compare it with an operation kind, or assert any
configuration or authorization.

canonicalParametersHash is exactly 64 lower-case hexadecimal characters and
is returned as CanonicalParametersHash. This boundary neither canonicalizes
parameters nor computes, verifies, or assigns an algorithm to the hash. A
later canonicalization and signing authority chooses and proves that
algorithm.

idempotencyKey is exactly 22 canonical unpadded base64url characters encoding
16 bytes: its first 21 characters use A-Z, a-z, 0-9, underscore, or hyphen;
its final character is one of A, Q, g, or w. The parser makes no claim,
cache, replay decision, or relationship to ingress replay identity. Repeated
parses of an identical payload remain permitted.

expiresAt is a real canonical UTC instant in
YYYY-MM-DDTHH:mm:ss.sssZ form. It must round-trip through Date unchanged so
impossible calendar dates fail. This is a declared expiry only: the parser
does not read a clock, enforce freshness, or apply a maximum duration.

## Snapshot safety and output

The parser must require exactly Object.prototype, obtain own keys and property
descriptors under try/catch, and capture only enumerable data-descriptor
values. It must not read a caller field through normal property access,
object spread, Object.assign, toJSON, coercion, or an accessor. Missing,
extra, inherited, symbol-keyed, nonenumerable, accessor-backed,
custom-prototype, malformed, and reflection-throwing input fails closed
without invoking a caller accessor.

Portable reflection cannot prove that an otherwise valid record was never a
transparent proxy. The parser therefore validates a detached captured
representation and never retains the caller record. A successful result is
an ordinary frozen object with exactly the eight documented fields. Later
caller mutation cannot alter it.

## Explicit exclusions

Do not add a raw-byte or JSON decoder; signed-command envelope; signature,
signer, principal, role, nonce, issued-at, key, or wallet handling; replay or
idempotency storage; canonical-parameter generation or hash computation;
clock; configuration or environment access; HTTP; Convex; database client;
ATS SDK; provider adapter; generic durable attempt; operation-to-target
mapping; amount, asset, recipient, account resolution, payment, funding,
allocation, transfer, transaction, candidate, receipt, settlement, clearing,
HCS, payout, deployment, or live behavior.

This parser alone does not make a wallet or provider call eligible. A future
dedicated authenticated-command and durable-attempt authority must establish
the required ordering before any external action.

## Acceptance evidence

- A test-only RED commit precedes every production source or barrel-export
  commit for this card and observes the absent public parser/types.
- Focused tests prove one exact valid frozen detached payload; every approved
  operation kind; the exact network/chain pair; both lexical target forms;
  exact subject, hash, idempotency-key, and expiry rules; all closed-shape and
  hostile-reflection failures; no-invoked-accessor behavior; and that repeated
  parses make no claim or cache.
- Focused static checks prove the parser has no JSON decoder, environment,
  HTTP, Convex, storage, clock, or ATS/provider dependency.
- A compile-time fixture proves readonly output, fixed literals, the closed
  operation union, CanonicalParametersHash separation, and the distinct
  target union.
- Core/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before
  acceptance.
