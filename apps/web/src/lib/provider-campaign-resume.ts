export type ProviderCampaignResume = Readonly<{
  attemptPublicId: string;
}>;

type ResumeRecord = Readonly<{
  offeringPublicId?: unknown;
  subjectPublicId?: unknown;
  state?: unknown;
  canonicalSignerAddress?: unknown;
  atsAttemptPublicId?: unknown;
}>;

const canonicalAddressPattern = /^0x[0-9a-f]{40}$/u;
const canonicalAttemptPublicIdPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const riskScanSubjectPublicId = "riskscan_revenue_note_demo";

function plainRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && Object.getPrototypeOf(input) === Object.prototype;
}

function canonicalAddress(input: unknown): input is string {
  return typeof input === "string" && canonicalAddressPattern.test(input);
}

export function readProviderCampaignResume(
  input: ResumeRecord | unknown,
  connectedIssuerAddress: string,
): ProviderCampaignResume | null {
  if (!plainRecord(input) || !canonicalAddress(connectedIssuerAddress)) return null;
  if (
    input.offeringPublicId !== riskScanSubjectPublicId
    || input.subjectPublicId !== riskScanSubjectPublicId
    || input.state !== "ASSET_PENDING"
    || input.canonicalSignerAddress !== connectedIssuerAddress
    || typeof input.atsAttemptPublicId !== "string"
    || !canonicalAttemptPublicIdPattern.test(input.atsAttemptPublicId)
  ) {
    return null;
  }
  return Object.freeze({ attemptPublicId: input.atsAttemptPublicId });
}

export async function loadProviderCampaignResume(
  connectedIssuerAddress: string,
): Promise<ProviderCampaignResume | null> {
  if (!canonicalAddress(connectedIssuerAddress)) return null;
  try {
    const response = await globalThis.fetch(
      "/api/offerings?offeringPublicId=riskscan_revenue_note_demo",
      {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
      },
    );
    if (response.status !== 200) return null;
    const body: unknown = await response.json();
    if (!plainRecord(body) || !plainRecord(body.offering) || body.offering.outcome !== "loaded") return null;
    return readProviderCampaignResume(body.offering.record, connectedIssuerAddress);
  } catch {
    return null;
  }
}
