import { readBackingOffering, type BackingProjection } from "../components/backing/backing-state.ts";
import { readProviderProjections, type ProviderProjectionFetcher } from "./offering-projection.ts";

const offeringPattern = /^offering_([0-9a-f]{32})$/u;

export async function loadProviderBackingProjection(
  environment: NodeJS.ProcessEnv,
  fetcher: ProviderProjectionFetcher,
  offeringPublicId: string,
): Promise<BackingProjection | null> {
  const match = offeringPattern.exec(offeringPublicId);
  if (match === null) return null;
  const projections = await readProviderProjections(environment, fetcher, offeringPublicId, `tool-${match[1]}`);
  if (projections.offering.outcome !== "loaded") return null;
  const offering = projections.offering.record;
  if (
    offering.offeringPublicId !== offeringPublicId || offering.subjectPublicId !== `tool_${match[1]}`
    || (offering.state !== "OPEN" && offering.state !== "CLOSED") || offering.fundingRecipient === undefined
  ) return null;
  const candidate = Object.freeze({ ...offering, fundingTreasuryAddress: offering.fundingRecipient });
  return readBackingOffering(candidate) === null ? null : candidate;
}
