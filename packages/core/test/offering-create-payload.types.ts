import { parseOfferingCreatePayload } from "../src/index.ts";
import type {
  OfferingCreatePayload,
  OfferingDefinition,
  OfferingNarrative,
  Tinybar,
} from "../src/index.ts";

const payload: OfferingCreatePayload = parseOfferingCreatePayload({
  schemaVersion: 1,
  offeringPublicId: "riskscan_revenue_note_demo",
  offeringVersion: 1,
  subjectPublicId: "riskscan_revenue_note_demo",
  definition: {
    schemaVersion: 1,
    terms: {
      version: "riskscan-revenue-note-v1",
      fundingTargetTinybars: "1000",
      noteUnitPriceTinybars: "10",
      maximumNoteUnits: "100",
      minimumPurchaseUnits: "1",
      reserveShareBps: "2000",
      issuerShareBps: "8000",
      platformFeeBps: "0",
      payoutCapTinybars: "1500",
    },
    maturityAt: "2026-12-31T00:00:00.000Z",
    qualifyingResource: "riskscan.quick",
  },
  narrative: {
    title: "RiskScan Revenue Note",
    customerProblem: "Bounded contract-risk signals.",
    customerUseCases: ["Inspect a contract"],
    useOfFunds: ["Maintain the service"],
    risks: ["Testnet-only demonstration"],
  },
  advertisedQuickPriceTinybars: "10",
  advertisedStandardPriceTinybars: "25",
  idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
  expiresAt: "2026-09-15T00:00:00.000Z",
});

const definition: OfferingDefinition = payload.definition;
const narrative: OfferingNarrative = payload.narrative;
const quickPrice: Tinybar = payload.advertisedQuickPriceTinybars;

void definition;
void narrative;
void quickPrice;

// @ts-expect-error Parsed payload roots are readonly.
payload.offeringPublicId = "other";
// @ts-expect-error Parsed narrative arrays are readonly.
payload.narrative.customerUseCases.push("other");
// @ts-expect-error A branded tinybar is not a plain string.
const plainPrice: string = payload.advertisedQuickPriceTinybars;

void plainPrice;
