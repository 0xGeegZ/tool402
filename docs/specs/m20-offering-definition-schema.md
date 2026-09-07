# M20 closed offering-definition schema contract

## Delivery boundary

This contract adds the smallest pure Core ingress boundary required to turn one
untrusted offering definition into immutable local data. It combines a closed
schema version, the accepted versioned economics terms, a declared maturity
instant, and an opaque qualifying-resource correlation.

It deliberately does not claim that an offering exists, is published,
funded, eligible, approved, configured, or available through any external
system. It is a parser and immutable snapshot only. A later durable generic
attempt model and separately specified configuration remain required before an
ATS boundary can become eligible.

## Public API

`packages/core/src/offering-definition.ts` exports this public surface through
`@tool402/core`:

```ts
export interface OfferingDefinition {
  readonly schemaVersion: 1;
  readonly terms: OfferingTerms;
  readonly maturityAt: string;
  readonly qualifyingResource: string;
}

export function parseOfferingDefinition(input: unknown): OfferingDefinition;
```

`OfferingTerms` and its exact-value brands remain the accepted public types
from the existing economics boundary. This module neither redefines their
arithmetic nor accepts a trusted typed input object from a caller.

## Closed ingress shape

`parseOfferingDefinition` accepts exactly one ordinary root record with these
four own enumerable data fields and no others:

| Field | Required value |
|---|---|
| `schemaVersion` | Primitive number exactly equal to `1`; no coercion or default. |
| `terms` | An ordinary closed record with exactly the nine fields below. |
| `maturityAt` | A real, canonical UTC instant in `YYYY-MM-DDTHH:mm:ss.sssZ` form. |
| `qualifyingResource` | A trimmed, nonblank opaque string of at most 256 code units. |

The nested `terms` record has exactly these own enumerable data fields and no
others:

```text
version
fundingTargetTinybars
noteUnitPriceTinybars
maximumNoteUnits
minimumPurchaseUnits
reserveShareBps
issuerShareBps
platformFeeBps
payoutCapTinybars
```

`version` must already be a trimmed, nonblank string of at most 96 code units.
Every other terms field must be a primitive string of at most 96 code units.
The parser captures those primitive values, constructs a fresh local
`OfferingTermsInput`, and delegates canonical exact-value, positivity,
capacity, share, and payout-cap validation to `createOfferingTerms`. It does
not duplicate or relax the accepted economics rules. A noncanonical value,
including whitespace or a fractional/unsafe numeric representation, therefore
fails through that existing boundary.

The 96/256 ingress limits are local parser-admission limits, not new economic
maximums or external configuration. All fields are required; optional,
unknown, missing, inherited, symbol, and nonenumerable fields fail closed.

## Snapshot safety and immutability

Both records must have exactly `Object.prototype` as their prototype. The
parser must obtain their own keys and property descriptors under `try`/`catch`,
and must capture only enumerable data-descriptor values. It must not read a
caller field through normal property access, object spread, `Object.assign`,
`toJSON`, or coercion. Accessors are rejected without invoking their getter or
setter. Throwing prototype/key/descriptor reflection fails closed.

Portable reflection cannot prove that every otherwise valid record was never a
transparent proxy. The guarantee is instead that the parser validates a
detached captured representation and never retains either caller record. A
successful result is a frozen root with exactly the four documented fields;
its `terms` value is the frozen value returned by `createOfferingTerms`. A
later mutation of either caller record cannot change the result.

`maturityAt` is first required to match the canonical UTC format and then must
round-trip through `Date` unchanged, so impossible calendar dates fail. It is
a caller-declared date only: this module reads no clock and makes no maturity,
eligibility, payout, or settlement assertion. `qualifyingResource` is an
opaque local correlation string; it does not prove a URL, route, endpoint,
active service, or payment requirement.

## Explicit exclusions

This module does not publish, register, configure, approve, fund, allocate,
clear, distribute, or retire an offering. It does not create an ATS SDK
boundary, account, asset, decimal policy, recipient, wallet, signer, key,
payment request, transfer instruction, transaction, settlement, receipt,
generic attempt, persistence record, HCS event, deployment, or live claim. It
does not read configuration, environment, storage, network, or a clock.

## Acceptance evidence

- A test-only RED commit must precede every production source or barrel-export
  commit for this card. It must observe the absent public parser and types;
  post-hoc chronology is not a substitute.
- Focused tests cover an exact valid definition, all root/nested shape
  violations, no-invoked-accessor behavior, reflection failures, unsupported
  version, missing defaults, string bounds, canonical term delegation,
  impossible/noncanonical dates, detached frozen output, and caller mutation
  after parsing.
- A compile-time fixture proves the public parser returns `OfferingDefinition`
  with its accepted `OfferingTerms` brands and rejects incompatible access.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
