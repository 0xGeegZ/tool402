import { createProviderToolAtsStageProjection, type ProviderToolAtsStageProjection } from "./ats/provider-tool-ats-projection.ts";

const toolIdPattern = /^tool_[0-9a-f]{32}$/u;

export type ProviderToolDeployment = Readonly<{
  ats: ProviderToolAtsStageProjection | null;
}>;

export function parseProviderToolDeployment(input: unknown, expectedToolPublicId: string): ProviderToolDeployment | null {
  if (!toolIdPattern.test(expectedToolPublicId) || input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== 2 || !Object.hasOwn(record, "tool") || !Object.hasOwn(record, "atsCreateConfigurationJson")) return null;
  if (record.tool === null || typeof record.tool !== "object" || Object.getPrototypeOf(record.tool) !== Object.prototype) return null;
  const tool = record.tool as Record<string, unknown>;
  const suffix = expectedToolPublicId.slice("tool_".length);
  if (tool.toolPublicId !== expectedToolPublicId || tool.subjectPublicId !== expectedToolPublicId || tool.offeringPublicId !== `offering_${suffix}`) return null;
  if (record.atsCreateConfigurationJson === null) return Object.freeze({ ats: null });
  if (typeof record.atsCreateConfigurationJson !== "string" || record.atsCreateConfigurationJson.length > 16_384) return null;
  try {
    return Object.freeze({
      ats: createProviderToolAtsStageProjection({
        toolPublicId: expectedToolPublicId,
        offeringPublicId: `offering_${suffix}`,
        configuration: JSON.parse(record.atsCreateConfigurationJson),
      }),
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
