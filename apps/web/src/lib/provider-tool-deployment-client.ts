import { createProviderToolAtsStageProjection, type ProviderToolAtsStageProjection } from "./ats/provider-tool-ats-projection.ts";

const toolIdPattern = /^tool_[0-9a-f]{32}$/u;

export type ProviderToolDeployment = Readonly<{
  ats: ProviderToolAtsStageProjection | null;
  state: "ALLOCATED" | "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
  title: string;
  atsAttemptPublicId: string | null;
  atsCandidate: Readonly<{ transactionId: string; evmAddress: string }> | null;
  durableValues: ProviderToolDurableValues | null;
}>;

export type ProviderToolDurableValues = Readonly<{
  toolName: string;
  customerProblem: string;
  qualifyingResource: string;
  quickPrice: string;
  standardPrice: string;
  targetAgentCustomers: string;
  useOfFunds: string;
  risks: string;
}>;

export function parseProviderToolDeployment(input: unknown, expectedToolPublicId: string): ProviderToolDeployment | null {
  if (!toolIdPattern.test(expectedToolPublicId) || input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== 5 || !Object.hasOwn(record, "tool") || !Object.hasOwn(record, "atsCreateConfigurationJson") || !Object.hasOwn(record, "atsAttemptPublicId") || !Object.hasOwn(record, "atsCandidate") || !Object.hasOwn(record, "durableValues")) return null;
  if (record.tool === null || typeof record.tool !== "object" || Object.getPrototypeOf(record.tool) !== Object.prototype) return null;
  const tool = record.tool as Record<string, unknown>;
  const suffix = expectedToolPublicId.slice("tool_".length);
  if (tool.toolPublicId !== expectedToolPublicId || tool.subjectPublicId !== expectedToolPublicId || tool.offeringPublicId !== `offering_${suffix}`
    || !["ALLOCATED", "DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(tool.state as string)) return null;
  const state = tool.state as ProviderToolDeployment["state"];
  if (typeof tool.title !== "string" || tool.title.trim().length === 0) return null;
  const title = tool.title;
  const attempt = record.atsAttemptPublicId;
  if ((state === "ASSET_PENDING" && (typeof attempt !== "string" || !/^[A-Za-z0-9_-]{21}[AQgw]$/u.test(attempt)))
    || (state !== "ASSET_PENDING" && attempt !== null)) return null;
  const atsAttemptPublicId = typeof attempt === "string" ? attempt : null;
  const atsCandidate = parseAtsCandidate(record.atsCandidate);
  if (atsCandidate === undefined || (state !== "ASSET_PENDING" && atsCandidate !== null)) return null;
  const durableValues = parseDurableValues(record.durableValues);
  if (record.atsCreateConfigurationJson === null) return state === "ALLOCATED" && durableValues === null
    ? Object.freeze({ ats: null, state, title, atsAttemptPublicId: null, atsCandidate: null, durableValues: null })
    : null;
  if (durableValues === null) return null;
  if (typeof record.atsCreateConfigurationJson !== "string" || record.atsCreateConfigurationJson.length > 16_384) return null;
  try {
    return Object.freeze({
      ats: createProviderToolAtsStageProjection({
        toolPublicId: expectedToolPublicId,
        offeringPublicId: `offering_${suffix}`,
        configuration: JSON.parse(record.atsCreateConfigurationJson),
      }), state, title, atsAttemptPublicId, atsCandidate, durableValues,
    });
  } catch {
    return null;
  }
}

function parseAtsCandidate(value: unknown): Readonly<{ transactionId: string; evmAddress: string }> | null | undefined {
  if (value === null) return null;
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return undefined;
  const record = value as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== 2 || !Object.hasOwn(record, "transactionId") || !Object.hasOwn(record, "evmAddress")
    || typeof record.transactionId !== "string" || !/^0\.0\.[0-9]+(?:@[0-9]+\.[0-9]+|-[0-9]+-[0-9]+)$/u.test(record.transactionId)
    || typeof record.evmAddress !== "string" || !/^0x[0-9a-f]{40}$/u.test(record.evmAddress)) return undefined;
  return Object.freeze({ transactionId: record.transactionId, evmAddress: record.evmAddress });
}

function parseDurableValues(value: unknown): ProviderToolDurableValues | null {
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const record = value as Record<string, unknown>;
  const keys = ["toolName", "customerProblem", "qualifyingResource", "quickPriceTinybars", "standardPriceTinybars", "targetAgentCustomers", "useOfFunds", "risks"] as const;
  if (Reflect.ownKeys(record).length !== keys.length || !keys.every((key) => Object.hasOwn(record, key))) return null;
  if (typeof record.toolName !== "string" || typeof record.customerProblem !== "string" || typeof record.qualifyingResource !== "string"
    || !Array.isArray(record.targetAgentCustomers) || !Array.isArray(record.useOfFunds) || !Array.isArray(record.risks)
    || !record.targetAgentCustomers.every((item) => typeof item === "string") || !record.useOfFunds.every((item) => typeof item === "string") || !record.risks.every((item) => typeof item === "string")) return null;
  const quickPrice = hbarFromTinybars(record.quickPriceTinybars);
  const standardPrice = hbarFromTinybars(record.standardPriceTinybars);
  if (quickPrice === null || standardPrice === null) return null;
  return Object.freeze({
    toolName: record.toolName,
    customerProblem: record.customerProblem,
    qualifyingResource: record.qualifyingResource,
    quickPrice,
    standardPrice,
    targetAgentCustomers: record.targetAgentCustomers.join("\n"),
    useOfFunds: record.useOfFunds.join("\n"),
    risks: record.risks.join("\n"),
  });
}

function hbarFromTinybars(value: unknown): string | null {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)$/u.test(value)) return null;
  try {
    const tinybars = BigInt(value);
    const whole = tinybars / 100_000_000n;
    const fraction = (tinybars % 100_000_000n).toString().padStart(8, "0").replace(/0+$/u, "");
    return fraction.length === 0 ? whole.toString() : `${whole}.${fraction}`;
  } catch {
    return null;
  }
}

export async function loadProviderToolDeployment(toolPublicId: string): Promise<ProviderToolDeployment | null> {
  if (!toolIdPattern.test(toolPublicId)) return null;
  try {
    const response = await globalThis.fetch(`/api/provider/tools/${toolPublicId}/deployment`, {
      method: "GET", headers: { accept: "application/json" }, credentials: "same-origin", cache: "no-store",
    });
    if (response.status !== 200) return null;
    return parseProviderToolDeployment(await response.json(), toolPublicId);
  } catch {
    return null;
  }
}
