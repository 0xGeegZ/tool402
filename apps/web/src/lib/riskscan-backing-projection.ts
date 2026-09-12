import { riskScanOfferingPublicId } from "./dashboard-campaign.ts";
import {
  readProviderProjections,
  type OfferingRecord,
  type ProviderProjectionFetcher,
  type ProviderProjections,
} from "./offering-projection.ts";
import { readBackingOffering, type BackingProjection } from "../components/backing/backing-state.ts";

const fundingTreasuryEnvironmentName = "TOOL402_FUNDING_EVM_ADDRESS";
const canonicalEvmAddressPattern = /^0x[0-9a-f]{40}$/u;

function configurationValue(environment: unknown, name: string): string | null {
  if (environment === null || typeof environment !== "object") return null;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(environment, name);
    if (
      descriptor === undefined || !Object.hasOwn(descriptor, "value")
      || Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")
      || typeof descriptor.value !== "string"
    ) return null;
    return descriptor.value;
  } catch {
    return null;
  }
}

function fundingTreasury(environment: unknown): string | null {
  const value = configurationValue(environment, fundingTreasuryEnvironmentName);
  return value !== null && canonicalEvmAddressPattern.test(value) ? value : null;
}

function isCanonicalRiskScanOffering(record: OfferingRecord): boolean {
  return record.offeringPublicId === riskScanOfferingPublicId
    && record.subjectPublicId === riskScanOfferingPublicId
    && record.state === "OPEN"
    && canonicalEvmAddressPattern.test(record.canonicalSignerAddress);
}

export function selectRiskScanBackingProjection(
  projections: ProviderProjections | unknown,
  environment: unknown,
): BackingProjection | null {
  if (
    projections === null || typeof projections !== "object"
    || !("offering" in projections)
  ) return null;
  const offering = (projections as ProviderProjections).offering;
  const treasury = fundingTreasury(environment);
  if (offering.outcome !== "loaded" || treasury === null || !isCanonicalRiskScanOffering(offering.record)) return null;
  const candidate = Object.freeze({ ...offering.record, fundingTreasuryAddress: treasury });
  return readBackingOffering(candidate) === null ? null : candidate;
}

export async function loadRiskScanBackingProjection(
  environment: NodeJS.ProcessEnv,
  fetcher: ProviderProjectionFetcher,
): Promise<BackingProjection | null> {
  const projections = await readProviderProjections(environment, fetcher, riskScanOfferingPublicId);
  return selectRiskScanBackingProjection(projections, environment);
}
