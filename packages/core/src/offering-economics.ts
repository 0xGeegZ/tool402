import { parseBasisPoints, parseNoteUnits, parseTinybar } from "./value.ts";
import type { BasisPoints, NoteUnits, Tinybar } from "./value.ts";

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

export function createOfferingTerms(input: OfferingTermsInput): OfferingTerms {
  const version = input.version.trim();
  if (version.length === 0 || version.length > 96) {
    throw new RangeError("version must contain between 1 and 96 characters");
  }

  const fundingTargetTinybars = parseTinybar(input.fundingTargetTinybars);
  const noteUnitPriceTinybars = parseTinybar(input.noteUnitPriceTinybars);
  const maximumNoteUnits = parseNoteUnits(input.maximumNoteUnits);
  const minimumPurchaseUnits = parseNoteUnits(input.minimumPurchaseUnits);
  const reserveShareBps = parseBasisPoints(input.reserveShareBps);
  const issuerShareBps = parseBasisPoints(input.issuerShareBps);
  const platformFeeBps = parseBasisPoints(input.platformFeeBps);
  const payoutCapTinybars = parseTinybar(input.payoutCapTinybars);

  if (
    fundingTargetTinybars === undefined ||
    noteUnitPriceTinybars === undefined ||
    maximumNoteUnits === undefined ||
    minimumPurchaseUnits === undefined ||
    reserveShareBps === undefined ||
    issuerShareBps === undefined ||
    platformFeeBps === undefined ||
    payoutCapTinybars === undefined
  ) {
    throw new TypeError("offering values must use canonical exact-value strings");
  }
  if (
    fundingTargetTinybars === 0n ||
    noteUnitPriceTinybars === 0n ||
    maximumNoteUnits === 0n ||
    minimumPurchaseUnits === 0n ||
    payoutCapTinybars === 0n
  ) {
    throw new RangeError("offering amounts and units must be positive");
  }
  if (
    minimumPurchaseUnits > maximumNoteUnits ||
    maximumNoteUnits * noteUnitPriceTinybars > fundingTargetTinybars
  ) {
    throw new RangeError("offering units must fit the capacity and funding target");
  }
  if (
    reserveShareBps !== 2000n ||
    issuerShareBps !== 8000n ||
    platformFeeBps !== 0n
  ) {
    throw new RangeError("offering shares must be 2000/8000/0 basis points");
  }
  if (
    fundingTargetTinybars % 2n !== 0n ||
    payoutCapTinybars !== (fundingTargetTinybars * 3n) / 2n
  ) {
    throw new RangeError("payout cap must be exactly 3/2 of an even funding target");
  }

  return Object.freeze({
    version,
    fundingTargetTinybars,
    noteUnitPriceTinybars,
    maximumNoteUnits,
    minimumPurchaseUnits,
    reserveShareBps,
    issuerShareBps,
    platformFeeBps,
    payoutCapTinybars,
  });
}

function requireTermsVersion(
  terms: OfferingTerms,
  expectedTermsVersion: string,
): void {
  if (expectedTermsVersion !== terms.version) {
    throw new RangeError("expected terms version must match the offering terms");
  }
}

export function calculateAllocation(
  terms: OfferingTerms,
  input: OfferingAllocationInput,
): OfferingAllocation {
  requireTermsVersion(terms, input.expectedTermsVersion);
  if (
    input.requestedUnits <= 0n ||
    input.requestedUnits < terms.minimumPurchaseUnits
  ) {
    throw new RangeError("requested units must be positive and meet the minimum");
  }
  if (
    input.confirmedAllocatedUnits < 0n ||
    input.confirmedAllocatedUnits + input.requestedUnits > terms.maximumNoteUnits
  ) {
    throw new RangeError("requested and confirmed units must fit offering capacity");
  }

  return Object.freeze({
    termsVersion: terms.version,
    requestedUnits: input.requestedUnits,
    paymentTinybars: (input.requestedUnits * terms.noteUnitPriceTinybars) as Tinybar,
    remainingCapacityUnits: (
      terms.maximumNoteUnits - input.confirmedAllocatedUnits - input.requestedUnits
    ) as NoteUnits,
  });
}

export function remainingPayoutCapacity(
  terms: OfferingTerms,
  expectedTermsVersion: string,
  verifiedCumulativeReserveCreditsTinybars: Tinybar,
): Tinybar {
  requireTermsVersion(terms, expectedTermsVersion);
  if (verifiedCumulativeReserveCreditsTinybars < 0n) {
    throw new RangeError("verified cumulative reserve credits must not be negative");
  }

  return (
    verifiedCumulativeReserveCreditsTinybars >= terms.payoutCapTinybars
      ? 0n
      : terms.payoutCapTinybars - verifiedCumulativeReserveCreditsTinybars
  ) as Tinybar;
}

export function calculateClearingSplit(
  terms: OfferingTerms,
  input: ClearingSplitInput,
): ClearingSplit {
  const remainingCapacity = remainingPayoutCapacity(
    terms,
    input.expectedTermsVersion,
    input.verifiedCumulativeReserveCreditsTinybars,
  );
  if (input.verifiedGrossTinybars <= 0n) {
    throw new RangeError("verified gross amount must be positive");
  }
  if (typeof input.maturityReached !== "boolean") {
    throw new TypeError("maturityReached must be an explicit boolean");
  }

  const scheduledReserve =
    (input.verifiedGrossTinybars * terms.reserveShareBps) / 10000n;
  const reserveTinybars = (
    input.maturityReached
      ? 0n
      : scheduledReserve < remainingCapacity
        ? scheduledReserve
        : remainingCapacity
  ) as Tinybar;

  return Object.freeze({
    termsVersion: terms.version,
    grossTinybars: input.verifiedGrossTinybars,
    reserveTinybars,
    issuerTinybars: (input.verifiedGrossTinybars - reserveTinybars) as Tinybar,
  });
}
