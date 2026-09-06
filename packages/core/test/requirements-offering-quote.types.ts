import {
  canonicalizeRequirements,
  createOfferingRequirementsQuote,
  createOfferingTerms,
  parseNoteUnits,
  sha256Requirements,
} from "../src/index.ts";
import type {
  CanonicalRequirements,
  NoteUnits,
  OfferingRequirementsQuote,
  OfferingRequirementsQuoteInput,
  OfferingTerms,
  RequirementsDigest,
  Tinybar,
} from "../src/index.ts";

const canonical = canonicalizeRequirements({ x402Version: 2 });
const digest = await sha256Requirements({ x402Version: 2 });
const requestedUnits = parseNoteUnits("2");
const confirmedAllocatedUnits = parseNoteUnits("0");

if (requestedUnits === undefined || confirmedAllocatedUnits === undefined) {
  throw new Error("exact local fixture values must parse");
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
const input: OfferingRequirementsQuoteInput = {
  expectedTermsVersion: "offering-v1",
  requestedUnits,
  confirmedAllocatedUnits,
  requirements: { x402Version: 2 },
  expiresAt: "2026-09-06T18:00:00.000Z",
};
const quote = await createOfferingRequirementsQuote(
  terms,
  input,
);
const canonicalValue: CanonicalRequirements = canonical;
const digestValue: RequirementsDigest = digest;
const quoteValue: OfferingRequirementsQuote = quote;
const payment: Tinybar = quote.paymentTinybars;
const remainingUnits: NoteUnits = quote.remainingCapacityUnits;
const allocatedUnits: NoteUnits = quote.requestedUnits;
const quoteDigest: RequirementsDigest = quote.requirementsDigest;

// @ts-expect-error A requirements digest is not an exact HBAR value.
const digestAsTinybar: Tinybar = (digest satisfies import("../src/index.ts").RequirementsDigest);
// @ts-expect-error Canonical requirements are not note units.
const canonicalAsUnits: NoteUnits = (canonical satisfies import("../src/index.ts").CanonicalRequirements);
// @ts-expect-error A requirements digest is not canonical requirements text.
const digestAsCanonical: CanonicalRequirements = (digest satisfies import("../src/index.ts").RequirementsDigest);
// @ts-expect-error Canonical requirements are not a requirements digest.
const canonicalAsDigest: RequirementsDigest = (canonical satisfies import("../src/index.ts").CanonicalRequirements);
// @ts-expect-error A quoted exact HBAR value is not a requirements digest.
const quotedPaymentAsDigest: RequirementsDigest = ((quote.paymentTinybars satisfies import("../src/index.ts").Tinybar) satisfies import("../src/index.ts").RequirementsDigest);

void canonical;
void digest;
void canonicalValue;
void digestValue;
void quoteValue;
void payment;
void remainingUnits;
void allocatedUnits;
void quoteDigest;
void digestAsTinybar;
void canonicalAsUnits;
void digestAsCanonical;
void canonicalAsDigest;
void quotedPaymentAsDigest;
