import {
  calculateAllocation,
  calculateClearingSplit,
  createOfferingTerms,
  parseBasisPoints,
  parseNoteUnits,
  parseTinybar,
  remainingPayoutCapacity,
} from "../src/index.ts";
import type {
  BasisPoints,
  NoteUnits,
  OfferingAllocation,
  ClearingSplit,
  OfferingTerms,
  Tinybar,
} from "../src/index.ts";

const tinybar = parseTinybar("100");
const noteUnits = parseNoteUnits("2");
const basisPoints = parseBasisPoints("2000");

if (tinybar === undefined || noteUnits === undefined || basisPoints === undefined) {
  throw new Error("canonical public parser values must exist");
}

const terms: OfferingTerms = createOfferingTerms({
  version: "offering-v1",
  fundingTargetTinybars: "100",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "10",
  minimumPurchaseUnits: "2",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "150",
});

const allocation: OfferingAllocation = calculateAllocation(terms, {
  expectedTermsVersion: "offering-v1",
  requestedUnits: noteUnits,
  confirmedAllocatedUnits: noteUnits,
});
const remainingCapacity: Tinybar = remainingPayoutCapacity(
  terms,
  "offering-v1",
  tinybar,
);
const clearingSplit: ClearingSplit = calculateClearingSplit(terms, {
  expectedTermsVersion: "offering-v1",
  verifiedGrossTinybars: tinybar,
  verifiedCumulativeReserveCreditsTinybars: tinybar,
  maturityReached: false,
});

const allocationPayment: Tinybar = allocation.paymentTinybars;
const allocationUnits: NoteUnits = allocation.remainingCapacityUnits;
const splitGross: Tinybar = clearingSplit.grossTinybars;
const splitReserve: Tinybar = clearingSplit.reserveTinybars;
const splitIssuer: Tinybar = clearingSplit.issuerTinybars;

// @ts-expect-error Tinybar and NoteUnits remain distinct at the public API boundary.
const tinybarAsNoteUnits: NoteUnits = tinybar;
// @ts-expect-error NoteUnits and BasisPoints remain distinct at the public API boundary.
const noteUnitsAsBasisPoints: BasisPoints = noteUnits;
// @ts-expect-error BasisPoints and Tinybar remain distinct at the public API boundary.
const basisPointsAsTinybar: Tinybar = basisPoints;

void remainingCapacity;
void allocationPayment;
void allocationUnits;
void splitGross;
void splitReserve;
void splitIssuer;
void tinybarAsNoteUnits;
void noteUnitsAsBasisPoints;
void basisPointsAsTinybar;
