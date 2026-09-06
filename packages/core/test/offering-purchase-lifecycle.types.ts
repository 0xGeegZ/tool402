import {
  createOfferingPurchase,
  createOfferingRequirementsQuote,
  createOfferingTerms,
  parseNoteUnits,
  transitionOfferingPurchase,
} from "../src/index.ts";
import type {
  NoteUnits,
  OfferingPurchaseAwaitingPayment,
  OfferingPurchaseDraft,
  OfferingPurchaseEvent,
  OfferingPurchaseSnapshot,
  OfferingPurchaseState,
  RequirementsDigest,
  Tinybar,
} from "../src/index.ts";

const requestedUnits = parseNoteUnits("2");
const confirmedAllocatedUnits = parseNoteUnits("0");

if (requestedUnits === undefined || confirmedAllocatedUnits === undefined) {
  throw new Error("exact local fixture values must parse");
}

const quote = await createOfferingRequirementsQuote(
  createOfferingTerms({
    version: "offering-v1",
    fundingTargetTinybars: "100",
    noteUnitPriceTinybars: "10",
    maximumNoteUnits: "10",
    minimumPurchaseUnits: "2",
    reserveShareBps: "2000",
    issuerShareBps: "8000",
    platformFeeBps: "0",
    payoutCapTinybars: "150",
  }),
  {
    expectedTermsVersion: "offering-v1",
    requestedUnits,
    confirmedAllocatedUnits,
    requirements: { x402Version: 2 },
    expiresAt: "2026-09-06T18:00:00.000Z",
  },
);

const draft: OfferingPurchaseDraft = createOfferingPurchase(quote);
const draftSnapshot: OfferingPurchaseSnapshot = draft;
const state: OfferingPurchaseState = transitionOfferingPurchase(draft, {
  type: "open",
  observedAt: "2026-09-06T17:59:59.999Z",
});
const event: OfferingPurchaseEvent = {
  type: "payment_submitted",
  observedAt: "2026-09-06T17:59:59.999Z",
};
const next: OfferingPurchaseState = transitionOfferingPurchase(state, event);
const units: NoteUnits = draftSnapshot.requestedUnits;
const tinybars: Tinybar = draftSnapshot.paymentTinybars;
const digest: RequirementsDigest = draftSnapshot.requirementsDigest;

if (state.state === "awaiting_payment") {
  const awaitingPayment: OfferingPurchaseAwaitingPayment = state;
  void awaitingPayment;
}

// @ts-expect-error Note units and tinybars remain distinct public brands.
const unitsAsTinybars: Tinybar = draftSnapshot.requestedUnits;
// @ts-expect-error Tinybars and note units remain distinct public brands.
const tinybarsAsUnits: NoteUnits = draftSnapshot.paymentTinybars;
// @ts-expect-error A requirements digest is not a tinybar value.
const digestAsTinybars: Tinybar = draftSnapshot.requirementsDigest;
// @ts-expect-error Timestamped events require an explicit observation time.
const missingObservedAt: OfferingPurchaseEvent = { type: "open" };

void draft;
void state;
void event;
void next;
void units;
void tinybars;
void digest;
void unitsAsTinybars;
void tinybarsAsUnits;
void digestAsTinybars;
void missingObservedAt;
