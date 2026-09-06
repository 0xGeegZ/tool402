# M10 exact value boundary contract

## Delivery boundary

This contract adds one pure local core module for exact monetary units and
canonical network-shaped identifiers. It accepts only canonical decimal text
and preserves monetary values as `bigint`; JavaScript `number` values never
cross this boundary. It performs no I/O, network lookup, account lookup,
configuration read, payment, signer, wallet, transaction, settlement, or
deployment action.

## Public API

`packages/core/src/value.ts` exports these opaque types and parsers:

```ts
export type Tinybar = bigint & { readonly __brand: "Tinybar" };
export type BasisPoints = bigint & { readonly __brand: "BasisPoints" };
export type NoteUnits = bigint & { readonly __brand: "NoteUnits" };
export type HederaAccountId = string & { readonly __brand: "HederaAccountId" };
export type HederaTransactionId = string & { readonly __brand: "HederaTransactionId" };

export function parseTinybar(input: string): Tinybar | undefined;
export function parseBasisPoints(input: string): BasisPoints | undefined;
export function parseNoteUnits(input: string): NoteUnits | undefined;
export function parseHederaAccountId(input: string): HederaAccountId | undefined;
export function parseHederaTransactionId(input: string): HederaTransactionId | undefined;
```

`packages/core/src/index.ts` re-exports this exact public surface. No parser
throws for an untrusted input; it returns `undefined` instead.

## Canonical forms and invariants

`Tinybar` and `NoteUnits` accept only non-negative canonical base-10 integer
strings: `0` or a nonzero digit followed by decimal digits. They reject
whitespace, signs, leading zeroes, fractions, exponents, non-ASCII digits,
and non-string input. Their parsed value is exactly `BigInt(input)`, including
values larger than `Number.MAX_SAFE_INTEGER`.

`BasisPoints` follows the same text rule and additionally lies from `0` through
`10000`, inclusive. This range describes a percentage denominator only; it
does not calculate a split or authorize a transfer.

`HederaAccountId` is exactly three canonical non-negative decimal segments
joined by dots (`shard.realm.number`). `HederaTransactionId` is one canonical
account identifier, then `@`, then canonical non-negative seconds, a dot, and
one through nine canonical decimal nanosecond digits. Neither parser confirms
that the identifier exists or that a transaction occurred.

## Explicit exclusions

The module does not define offering terms, revenue allocation, quotes,
payment requests, signatures, account configuration, external validation,
ledger lookup, status, receipt, evidence, or live state. Later modules must
choose their own positivity and business constraints rather than inferring
them from this generic exact-value boundary.

## Acceptance evidence

- Focused RED/GREEN tests prove canonical parsing, branding through the public
  entry point, rejection of noncanonical/fractional/negative/unsafe input,
  basis-point range enforcement, and exact values beyond JavaScript's safe
  integer range.
- Core typecheck, test, lint, root quality commands, queue validation,
  whitespace/reference checks, enabled local guard, and independent task
  review pass.
