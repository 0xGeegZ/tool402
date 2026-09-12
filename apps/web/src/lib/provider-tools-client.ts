export type ProviderToolSummary = Readonly<{
  toolPublicId: string;
  subjectPublicId: string;
  offeringPublicId: string;
  serviceId: string;
  serviceSlug: string;
  title: string;
  state: "ALLOCATED" | "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
}>;

export type ProviderToolAllocation = Readonly<{
  outcome: "allocated" | "replayed";
  tool: ProviderToolSummary;
}>;

const toolIdPattern = /^tool_[0-9a-f]{32}$/u;
const states = new Set<ProviderToolSummary["state"]>(["ALLOCATED", "DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"]);

export function parseProviderToolSummary(input: unknown): ProviderToolSummary | null {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  const fields = ["toolPublicId", "subjectPublicId", "offeringPublicId", "serviceId", "serviceSlug", "title", "state"];
  if (Reflect.ownKeys(record).length !== fields.length || !fields.every((field) => Object.hasOwn(record, field))) return null;
  const toolPublicId = record.toolPublicId;
  if (typeof toolPublicId !== "string" || !toolIdPattern.test(toolPublicId)) return null;
  const suffix = toolPublicId.slice("tool_".length);
  if (
    record.subjectPublicId !== toolPublicId
    || record.offeringPublicId !== `offering_${suffix}`
    || record.serviceId !== toolPublicId
    || record.serviceSlug !== `tool-${suffix}`
    || typeof record.title !== "string"
    || !states.has(record.state as ProviderToolSummary["state"])
  ) return null;
  return Object.freeze({
    toolPublicId,
    subjectPublicId: toolPublicId,
    offeringPublicId: record.offeringPublicId,
    serviceId: toolPublicId,
    serviceSlug: record.serviceSlug,
    title: record.title,
    state: record.state as ProviderToolSummary["state"],
  });
}

export function parseProviderToolAllocation(input: unknown): ProviderToolAllocation | null {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== 2 || !Object.hasOwn(record, "outcome") || !Object.hasOwn(record, "tool")) return null;
  if (record.outcome !== "allocated" && record.outcome !== "replayed") return null;
  const tool = parseProviderToolSummary(record.tool);
  return tool === null ? null : Object.freeze({ outcome: record.outcome, tool });
}

export function parseProviderToolPage(input: unknown): Readonly<{
  tools: readonly ProviderToolSummary[];
  nextCursor: string | null;
}> | null {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) return null;
  const record = input as Record<string, unknown>;
  if (Reflect.ownKeys(record).length !== 2 || !Object.hasOwn(record, "tools") || !Object.hasOwn(record, "nextCursor") || !Array.isArray(record.tools)) return null;
  if (record.nextCursor !== null && (typeof record.nextCursor !== "string" || record.nextCursor.length === 0 || record.nextCursor.length > 1024)) return null;
  const tools = record.tools.map(parseProviderToolSummary);
  return tools.some((tool) => tool === null)
    ? null
    : Object.freeze({ tools: Object.freeze(tools as ProviderToolSummary[]), nextCursor: record.nextCursor });
}

export function createProviderToolAllocationRequest(requestId: string): RequestInit | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(requestId)) return null;
  return Object.freeze({
    method: "POST",
    credentials: "same-origin",
    headers: Object.freeze({ "content-type": "application/json" }),
    body: JSON.stringify({ requestId }),
  });
}
