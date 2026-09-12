import { createProviderToolAtsStageProjection, type ProviderToolAtsStageProjection } from "./ats/provider-tool-ats-projection.ts";

const toolIdPattern = /^tool_[0-9a-f]{32}$/u;

export type ProviderToolDeployment = Readonly<{
  ats: ProviderToolAtsStageProjection | null;
  state: "ALLOCATED" | "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
  atsAttemptPublicId: string | null;
}>;

export function parseProviderToolDeployment(input: unknown, expectedToolPublicId: string): ProviderToolDeployment | null {
  if (!toolIdPattern.test(expectedToolPublicId) || input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== 3 || !Object.hasOwn(record, "tool") || !Object.hasOwn(record, "atsCreateConfigurationJson") || !Object.hasOwn(record, "atsAttemptPublicId")) return null;
  if (record.tool === null || typeof record.tool !== "object" || Object.getPrototypeOf(record.tool) !== Object.prototype) return null;
  const tool = record.tool as Record<string, unknown>;
  const suffix = expectedToolPublicId.slice("tool_".length);
  if (tool.toolPublicId !== expectedToolPublicId || tool.subjectPublicId !== expectedToolPublicId || tool.offeringPublicId !== `offering_${suffix}`
    || !["ALLOCATED", "DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(tool.state as string)) return null;
  const state = tool.state as ProviderToolDeployment["state"];
  const attempt = record.atsAttemptPublicId;
  if ((state === "ASSET_PENDING" && (typeof attempt !== "string" || !/^[A-Za-z0-9_-]{21}[AQgw]$/u.test(attempt)))
    || (state !== "ASSET_PENDING" && attempt !== null)) return null;
  const atsAttemptPublicId = typeof attempt === "string" ? attempt : null;
  if (record.atsCreateConfigurationJson === null) return state === "ALLOCATED" ? Object.freeze({ ats: null, state, atsAttemptPublicId: null }) : null;
  if (typeof record.atsCreateConfigurationJson !== "string" || record.atsCreateConfigurationJson.length > 16_384) return null;
  try {
    return Object.freeze({
      ats: createProviderToolAtsStageProjection({
        toolPublicId: expectedToolPublicId,
        offeringPublicId: `offering_${suffix}`,
        configuration: JSON.parse(record.atsCreateConfigurationJson),
      }), state, atsAttemptPublicId,
    });
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
