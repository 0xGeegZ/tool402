export type DashboardCampaign = Readonly<{
  title: string;
  state: "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
  href: "/provider/deploy";
}>;

const canonicalAddressPattern = /^0x[0-9a-f]{40}$/u;
const offeringStates = new Set<DashboardCampaign["state"]>([
  "DRAFT",
  "ASSET_PENDING",
  "READY",
  "OPEN",
  "CLOSED",
]);
const riskScanOfferingPublicId = "riskscan_revenue_note_demo";

function plainRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && Object.getPrototypeOf(input) === Object.prototype;
}

function canonicalAddress(input: unknown): input is string {
  return typeof input === "string" && canonicalAddressPattern.test(input);
}

export function readDashboardCampaign(input: unknown, sessionSignerAddress: string): DashboardCampaign | null {
  if (!plainRecord(input) || !canonicalAddress(sessionSignerAddress)) return null;
  if (
    input.offeringPublicId !== riskScanOfferingPublicId
    || input.canonicalSignerAddress !== sessionSignerAddress
    || !offeringStates.has(input.state as DashboardCampaign["state"])
    || !plainRecord(input.narrative)
    || typeof input.narrative.title !== "string"
    || input.narrative.title.trim().length === 0
  ) {
    return null;
  }

  return Object.freeze({
    title: input.narrative.title,
    state: input.state as DashboardCampaign["state"],
    href: "/provider/deploy",
  });
}
