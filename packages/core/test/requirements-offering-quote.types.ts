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

type ExpectedCanonicalRequirements = string & {
  readonly __brand: "CanonicalRequirements";
};
type ExpectedRequirementsDigest = string & {
  readonly __brand: "RequirementsDigest";
};

const canonical: CanonicalRequirements = canonicalizeRequirements({ x402Version: 2 });
const digest: RequirementsDigest = await sha256Requirements({ x402Version: 2 });
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
const quote: OfferingRequirementsQuote = await createOfferingRequirementsQuote(
  terms,
  input,
);
const payment: Tinybar = quote.paymentTinybars;
const remainingUnits: NoteUnits = quote.remainingCapacityUnits;
const allocatedUnits: NoteUnits = quote.requestedUnits;
const quoteDigest: RequirementsDigest = quote.requirementsDigest;
const brandedCanonical: ExpectedCanonicalRequirements = canonical;
const brandedDigest: ExpectedRequirementsDigest = digest;

// @ts-expect-error A requirements digest is not an exact HBAR value.
const digestAsTinybar: Tinybar = brandedDigest;
// @ts-expect-error Canonical requirements are not note units.
const canonicalAsUnits: NoteUnits = brandedCanonical;

void canonical;
void digest;
void payment;
void remainingUnits;
void allocatedUnits;
void quoteDigest;
void brandedCanonical;
void brandedDigest;
void digestAsTinybar;
void canonicalAsUnits;
