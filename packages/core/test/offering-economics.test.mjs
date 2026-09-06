import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAllocation,
  calculateClearingSplit,
  createOfferingTerms,
  parseNoteUnits,
  parseTinybar,
  remainingPayoutCapacity,
} from "@tool402/core";

function noteUnits(value) {
  const parsed = parseNoteUnits(value);
  assert.notEqual(parsed, undefined);
  return parsed;
}

function tinybars(value) {
  const parsed = parseTinybar(value);
  assert.notEqual(parsed, undefined);
  return parsed;
}

function assertEconomicInputError(action) {
  assert.throws(action, (error) => error instanceof RangeError || error instanceof TypeError);
}

const validTermsInput = {
  version: "offering-v1",
  fundingTargetTinybars: "100",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "10",
  minimumPurchaseUnits: "2",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "150",
};

function validTerms() {
  return createOfferingTerms(validTermsInput);
}

test("quotes a valid unit request and reports the exact post-request capacity", () => {
  assert.deepEqual(
    calculateAllocation(validTerms(), {
      expectedTermsVersion: "offering-v1",
      requestedUnits: noteUnits("2"),
      confirmedAllocatedUnits: noteUnits("3"),
    }),
    {
      termsVersion: "offering-v1",
      requestedUnits: 2n,
      paymentTinybars: 20n,
      remainingCapacityUnits: 5n,
    },
  );
});

test("keeps a pre-split verified-credit capacity separate from a proposed reserve leg", () => {
  const terms = validTerms();

  assert.equal(
    remainingPayoutCapacity(terms, "offering-v1", tinybars("100")),
    50n,
  );
  assert.deepEqual(
    calculateClearingSplit(terms, {
      expectedTermsVersion: "offering-v1",
      verifiedGrossTinybars: tinybars("100"),
      verifiedCumulativeReserveCreditsTinybars: tinybars("100"),
      maturityReached: false,
    }),
    {
      termsVersion: "offering-v1",
      grossTinybars: 100n,
      reserveTinybars: 20n,
      issuerTinybars: 80n,
    },
  );
  assert.equal(
    remainingPayoutCapacity(terms, "offering-v1", tinybars("100")),
    50n,
  );
});

test("limits the floor-rounded reserve split to the remaining payout-cap remainder", () => {
  assert.deepEqual(
    calculateClearingSplit(validTerms(), {
      expectedTermsVersion: "offering-v1",
      verifiedGrossTinybars: tinybars("300"),
      verifiedCumulativeReserveCreditsTinybars: tinybars("130"),
      maturityReached: false,
    }),
    {
      termsVersion: "offering-v1",
      grossTinybars: 300n,
      reserveTinybars: 20n,
      issuerTinybars: 280n,
    },
  );
});

test("routes all gross to the issuer at maturity or after cap exhaustion", () => {
  const terms = validTerms();

  for (const verifiedCumulativeReserveCreditsTinybars of ["100", "150"]) {
    assert.deepEqual(
      calculateClearingSplit(terms, {
        expectedTermsVersion: "offering-v1",
        verifiedGrossTinybars: tinybars("100"),
        verifiedCumulativeReserveCreditsTinybars: tinybars(
          verifiedCumulativeReserveCreditsTinybars,
        ),
        maturityReached: verifiedCumulativeReserveCreditsTinybars === "100",
      }),
      {
        termsVersion: "offering-v1",
        grossTinybars: 100n,
        reserveTinybars: 0n,
        issuerTinybars: 100n,
      },
    );
  }
});

test("rejects contradictory terms and invalid allocation or clearing inputs", () => {
  assertEconomicInputError(() =>
    createOfferingTerms({ ...validTermsInput, reserveShareBps: "2001" }),
  );
  assertEconomicInputError(() =>
    createOfferingTerms({
      ...validTermsInput,
      fundingTargetTinybars: "101",
      payoutCapTinybars: "151",
    }),
  );
  assertEconomicInputError(() =>
    createOfferingTerms({ ...validTermsInput, payoutCapTinybars: "149" }),
  );
  assertEconomicInputError(() =>
    createOfferingTerms({ ...validTermsInput, version: "   " }),
  );
  assertEconomicInputError(() =>
    createOfferingTerms({ ...validTermsInput, fundingTargetTinybars: "010" }),
  );

  const terms = validTerms();
  assertEconomicInputError(() =>
    calculateAllocation(terms, {
      expectedTermsVersion: "offering-v1",
      requestedUnits: noteUnits("1"),
      confirmedAllocatedUnits: noteUnits("0"),
    }),
  );
  assertEconomicInputError(() =>
    calculateAllocation(terms, {
      expectedTermsVersion: "offering-v1",
      requestedUnits: noteUnits("2"),
      confirmedAllocatedUnits: noteUnits("9"),
    }),
  );
  assertEconomicInputError(() =>
    calculateAllocation(terms, {
      expectedTermsVersion: "offering-v0",
      requestedUnits: noteUnits("2"),
      confirmedAllocatedUnits: noteUnits("0"),
    }),
  );
  assertEconomicInputError(() =>
    calculateClearingSplit(terms, {
      expectedTermsVersion: "offering-v1",
      verifiedGrossTinybars: tinybars("0"),
      verifiedCumulativeReserveCreditsTinybars: tinybars("0"),
      maturityReached: false,
    }),
  );
});
