# M16 offering terms and revenue math contract

## Delivery boundary

This contract adds the smallest pure Core economics boundary required before
later funding, ATS, clearing, and holder-distribution work can be specified
truthfully. It constructs one immutable versioned offering-terms value and
derives exact purchase quotes, remaining payout capacity, and the approved
80/20 reserve/operator split with integer arithmetic.

It is not an offering publication, an ATS asset configuration, a purchase or
allocation attempt, a settlement verifier, a clearing instruction, a ledger,
or a payment proof. It performs no I/O and creates no external authority.

## Public API

`packages/core/src/offering-economics.ts` exports these public values and
functions through `@tool402/core`:

```ts
export interface OfferingTermsInput {
  readonly version: string;
  readonly fundingTargetTinybars: string;
  readonly noteUnitPriceTinybars: string;
  readonly maximumNoteUnits: string;
  readonly minimumPurchaseUnits: string;
  readonly reserveShareBps: string;
  readonly issuerShareBps: string;
  readonly platformFeeBps: string;
  readonly payoutCapTinybars: string;
}

export interface OfferingTerms {
  readonly version: string;
  readonly fundingTargetTinybars: Tinybar;
  readonly noteUnitPriceTinybars: Tinybar;
  readonly maximumNoteUnits: NoteUnits;
  readonly minimumPurchaseUnits: NoteUnits;
  readonly reserveShareBps: BasisPoints;
  readonly issuerShareBps: BasisPoints;
  readonly platformFeeBps: BasisPoints;
  readonly payoutCapTinybars: Tinybar;
}

export interface OfferingAllocationInput {
  readonly expectedTermsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly confirmedAllocatedUnits: NoteUnits;
}

export interface OfferingAllocation {
  readonly termsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly paymentTinybars: Tinybar;
  readonly remainingCapacityUnits: NoteUnits;
}

export interface ClearingSplitInput {
  readonly expectedTermsVersion: string;
  readonly verifiedGrossTinybars: Tinybar;
  readonly verifiedCumulativeReserveCreditsTinybars: Tinybar;
  readonly maturityReached: boolean;
}

export interface ClearingSplit {
  readonly termsVersion: string;
  readonly grossTinybars: Tinybar;
  readonly reserveTinybars: Tinybar;
  readonly issuerTinybars: Tinybar;
}

export function createOfferingTerms(input: OfferingTermsInput): OfferingTerms;
export function calculateAllocation(
  terms: OfferingTerms,
  input: OfferingAllocationInput,
): OfferingAllocation;
export function remainingPayoutCapacity(
  terms: OfferingTerms,
  expectedTermsVersion: string,
  verifiedCumulativeReserveCreditsTinybars: Tinybar,
): Tinybar;
export function calculateClearingSplit(
  terms: OfferingTerms,
  input: ClearingSplitInput,
): ClearingSplit;
```

`createOfferingTerms` is a typed local construction boundary, not an
untrusted ingress-schema parser. A later dependency-correct schema task owns
full record-shape, unknown-key, and external-payload validation. All malformed
or contradictory local business inputs throw a `TypeError` or `RangeError`;
the function never supplies a default value.

## Terms invariants

- `version` is a trimmed, nonblank string of at most 96 characters.
- Every monetary/unit/BPS text input passes the accepted canonical value
  parser. Zero, negative, fractional, unsafe, whitespace, and noncanonical
  forms cannot satisfy a required positive economic field.
- `fundingTargetTinybars`, `noteUnitPriceTinybars`, `maximumNoteUnits`,
  `minimumPurchaseUnits`, and `payoutCapTinybars` are all positive.
- `minimumPurchaseUnits <= maximumNoteUnits` and
  `maximumNoteUnits * noteUnitPriceTinybars <= fundingTargetTinybars`.
- Terms encode only the approved D-Day shares: reserve `2000` BPS, issuer
  `8000` BPS, platform fee `0` BPS. Their sum is exactly `10000` BPS.
- The payout cap is exactly `fundingTargetTinybars * 3 / 2`; the funding
  target must therefore be even. No caller can substitute an arbitrary cap.
- Returned terms and derived values are immutable local data. They do not
  prove an offering exists, was published, funded, or accepted by any ATS.

## Exact calculations and lifecycle boundary

For an allocation request, the expected version must equal the terms version,
the requested units must meet the minimum, and confirmed allocated units plus
requested units must fit within capacity. The payment quote is the exact
`requestedUnits * noteUnitPriceTinybars` product. The function neither claims
capacity nor treats the quote as a payment or allocation. Its returned
`remainingCapacityUnits` is the post-request calculation:
`maximumNoteUnits - confirmedAllocatedUnits - requestedUnits`.

`remainingPayoutCapacity` compares the expected terms version and returns
`max(payoutCapTinybars - verifiedCumulativeReserveCreditsTinybars, 0)`.
It derives no reserve credit and does not verify the supplied cumulative fact.
The result is capacity before a proposed split: a calculated reserve leg never
appears as a newly verified credit or changes this result.

For a positive verified gross amount, `calculateClearingSplit` uses only the
immutable terms, the explicit version match, the supplied verified cumulative
reserve credits, and the explicit `maturityReached` fact:

```text
scheduledReserve = floor(verifiedGrossTinybars * 2000 / 10000)
reserveTinybars = min(scheduledReserve, remainingPayoutCapacityTinybars)
issuerTinybars = verifiedGrossTinybars - reserveTinybars
```

When maturity is reached or remaining capacity is zero, the reserve leg is
zero and the issuer leg is the full verified gross amount. Cap exhaustion is
therefore a deterministic no-reserve outcome, not a fabricated error or a
new reserve credit. Every result preserves the exact identity
`grossTinybars = reserveTinybars + issuerTinybars`.

The `verified` names are caller assertions only at this pure boundary. A
future receipt/lifecycle adapter must establish verification before it uses a
split result; no split submission, HCS event, reserve credit, operator
allocation, or holder distribution may be constructed here.

## Explicit exclusions

This module does not contain an ATS SDK, network configuration, account or
asset identifier, recipient, wallet, signer, private key, payment header,
request, transfer intent, transaction, settlement, receipt, persistence,
configuration/environment read, date/clock lookup, HCS event, deployment, or
live claim. It makes no funding, allocation, clearing, payout, yield, APY,
or return promise.

## Acceptance evidence

- Focused RED/GREEN tests exercise valid terms, exact quote/capacity math,
  floor rounding, cap remainder, maturity, version mismatch, oversubscription,
  wrong BPS, inconsistent target/cap, and no-default invalid inputs.
- A cap `150`, verified cumulative credits `100`, and gross `100` vector
  returns pre-split remaining capacity `50`, reserve `20`, and issuer `80`;
  only an independently verified later credit may change the capacity input.
- A compile-time consumer fixture proves the public Core exports and keeps
  `Tinybar`, `NoteUnits`, and `BasisPoints` distinct at the API boundary.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
