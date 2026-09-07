# M28 closed Directory-record candidate schema contract

## Delivery boundary

This contract adds one pure Core parser for an untrusted, advertised Directory
record. It captures a closed version-one record into a detached immutable
candidate value so later components can distinguish syntactically valid
metadata from unvalidated input.

The parser does not make the record signed, issuer-authorized, published,
active, current, reachable, payable, settled, or externally verified. In
particular, `status: "active"` and `publishedAt` are advertiser-supplied
metadata only, and the parsed clearing account is not payment truth. A later
signed publication and x402-requirements boundary remains responsible for
those claims.

## Public API

`packages/core/src/agent-directory-record-candidate.ts` exports the following
public surface through `@tool402/core`:

```ts
export type DirectoryCapability = "evm-contract-risk-signals";
export type DirectoryTier = "quick" | "standard";

export type AdvertisedDirectoryTiers =
  | readonly ["quick"]
  | readonly ["standard"]
  | readonly ["quick", "standard"];

export interface AgentDirectoryRecordCandidate {
  readonly schemaVersion: 1;
  readonly serviceId: string;
  readonly serviceSlug: "riskscan";
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly capabilities: readonly [DirectoryCapability];
  readonly x402Endpoint: string;
  readonly webUrl?: string;
  readonly paymentProtocol: "x402";
  readonly paymentNetwork: "hedera-testnet";
  readonly asset: "HBAR";
  readonly advertisedTiers: AdvertisedDirectoryTiers;
  readonly issuerRevenueAccount: HederaAccountId;
  readonly clearingAccount: HederaAccountId;
  readonly status: "active";
  readonly publishedAt: string;
}

export function parseAgentDirectoryRecordCandidate(
  input: unknown,
): AgentDirectoryRecordCandidate;
```

`HederaAccountId` remains the accepted branded type from the M10 exact-value
boundary. The candidate parser adds no dependency, adapter, configuration, or
runtime service.

## Closed input shape

The input must be an ordinary object whose prototype is exactly
`Object.prototype`. It must contain exactly the fifteen required enumerable
data fields below, with an optional enumerable data `webUrl` field and no
other own string, symbol, enumerable, or nonenumerable property:

```text
schemaVersion
serviceId
serviceSlug
offeringPublicId
offeringVersion
capabilities
x402Endpoint
webUrl (optional)
paymentProtocol
paymentNetwork
asset
advertisedTiers
issuerRevenueAccount
clearingAccount
status
publishedAt
```

The parser obtains every input value from an own property descriptor under
`try`/`catch`. It must reject accessors without invoking them, inherited data,
symbols, nonenumerable fields, custom prototypes, reflection failures, and
unknown fields. It must never read a caller field through normal property
access, object spread, `Object.assign`, coercion, or `toJSON`.

All accepted records use these exact lexical rules:

| Field | Required rule |
|---|---|
| `schemaVersion` | Primitive number exactly equal to `1`. |
| `serviceId`, `offeringPublicId` | One through 96 ASCII letters, digits, underscores, or hyphens. |
| `serviceSlug` | Exact primitive string `"riskscan"`. |
| `offeringVersion` | Primitive safe integer from `1` through `Number.MAX_SAFE_INTEGER`. |
| `capabilities` | Exact ordinary array with one item, `"evm-contract-risk-signals"`. |
| `paymentProtocol` | Exact primitive string `"x402"`. |
| `paymentNetwork` | Exact primitive string `"hedera-testnet"`. |
| `asset` | Exact primitive string `"HBAR"`. |
| `advertisedTiers` | Exact ordinary array of one or two unique tiers: `["quick"]`, `["standard"]`, or `["quick", "standard"]` only. |
| `issuerRevenueAccount`, `clearingAccount` | Canonical M10 Hedera account identifiers. They may be equal; the parser makes no account-existence, ownership, or recipient assertion. |
| `status` | Exact primitive string `"active"`, retained as advertised metadata only. |
| `publishedAt` | A real canonical UTC-millisecond instant in `YYYY-MM-DDTHH:mm:ss.sssZ` form. It is not proof of publication time. |

`capabilities` and `advertisedTiers` must each have `Array.prototype` exactly,
only their expected indexed enumerable data properties plus the standard
`length` property, no holes, no extra property, and no accessor. Their values
are captured before validation. The parser freezes newly allocated output
arrays; it never retains either caller array.

## URL admission and canonical output

`x402Endpoint` is required and `webUrl` is optional. Each supplied URL must be
a primitive string one through 2,048 UTF-16 code units with no leading or
trailing whitespace. The parser constructs a URL only after descriptor
capture and requires all of the following:

- `protocol` is exactly `https:`;
- hostname is nonblank;
- username and password are blank;
- hash is blank.

The parser returns the platform `URL.href` canonical form. A URL is advertised
routing metadata only: it is never fetched, resolved against a base, used as a
payment recipient, or treated as a statement of service availability.

## Snapshot safety and explicit exclusions

The returned record has exactly the documented fields, a normal object
prototype, frozen root, and frozen array members. Repeated parsing of the same
valid input creates independent frozen values. Mutating a caller record or
array after parsing cannot change a result.

This contract does not parse a receipt candidate, generate an invariant suite,
or change M20's four-field offering-definition parser. It does not integrate
with the existing Agent Directory reader, query or fetch a URL, canonicalize
or sign a command, verify a wallet or issuer, authorize a principal or role,
claim publication, activate a directory record, create a World action, parse
x402 requirements, make a payment, create a replay/idempotency claim, persist
a record, create a generic attempt, call a provider, configure ATS, allocate,
clear, distribute, publish HCS, access a wallet/account/key, submit a
transaction, deploy, or make a live claim. It reads no clock, environment,
storage, or network.

## Acceptance evidence

- A test-only RED commit must precede every parser, public-barrel, or type
  fixture commit.
- Focused runtime tests must cover exact record and array shape, optional
  `webUrl`, all literal unions, ID bounds/grammar, safe offering-version
  boundaries, canonical accounts, canonical dates, URL canonicalization and
  rejection policy, detached frozen output, mutation isolation, no-invoked
  accessor behavior, and reflection failures.
- A compile-time fixture must prove the literal unions, branded accounts,
  readonly root/arrays, and separation between a candidate record and a
  payment/account string.
- The focused Core test, Core/root typecheck, test, lint, clean-install dry
  run, queue/reference/whitespace checks, enabled local guard, independent
  task review, and two fresh clean module-review generations must pass before
  acceptance.
