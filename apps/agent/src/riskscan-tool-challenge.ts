import type { RiskScanConsumerDiscovery } from "./riskscan-tool-directory.ts";

export type RiskScanChallengeSender = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

export type RiskScanConsumerChallengeOutcome =
  | { kind: "directory_unavailable" }
  | { kind: "directory_invalid" }
  | { kind: "input_invalid" }
  | { kind: "transport_failure" }
  | { kind: "unavailable" }
  | { kind: "payment_required" }
  | { kind: "unexpected_response" };

type QuickInput = {
  requestRef: string;
  subjectRef: string;
  context: string;
  declarations: { identity: boolean; pricing: boolean; limitations: boolean; evidence: boolean };
};

function snapshotRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length || !ownKeys.every((key) => typeof key === "string" && keys.includes(key))) return null;
  const snapshot: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || descriptor.enumerable !== true || descriptor.get !== undefined || descriptor.set !== undefined ||
      !Object.hasOwn(descriptor, "value")) return null;
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function selectedDiscovery(value: RiskScanConsumerDiscovery): "directory_unavailable" | "directory_invalid" | "tool_selected" | null {
  if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const keys = Reflect.ownKeys(value);
  if (!keys.every((key) => typeof key === "string") || !keys.includes("kind")) return null;
  const kind = Object.getOwnPropertyDescriptor(value, "kind");
  if (kind === undefined || kind.enumerable !== true || kind.get !== undefined || kind.set !== undefined || !Object.hasOwn(kind, "value")) return null;
  if (keys.length === 1) return kind.value === "directory_unavailable" || kind.value === "directory_invalid" ? kind.value : null;
  if (keys.length !== 2 || !keys.includes("tool")) return null;
  const tool = Object.getOwnPropertyDescriptor(value, "tool");
  if (tool === undefined || tool.enumerable !== true || tool.get !== undefined || tool.set !== undefined || !Object.hasOwn(tool, "value")) return null;
  return kind.value === "tool_selected" ? "tool_selected" : null;
}

function snapshotInput(value: unknown): QuickInput | null {
  const outer = snapshotRecord(value, ["requestRef", "subjectRef", "context", "declarations"]);
  if (outer === null) return null;
  const declarations = snapshotRecord(outer.declarations, ["identity", "pricing", "limitations", "evidence"]);
  if (declarations === null || typeof declarations.identity !== "boolean" || typeof declarations.pricing !== "boolean" ||
    typeof declarations.limitations !== "boolean" || typeof declarations.evidence !== "boolean") return null;
  const strings = [["requestRef", 96], ["subjectRef", 160], ["context", 280]] as const;
  const local: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, maximum] of strings) {
    if (typeof outer[key] !== "string") return null;
    const trimmed = outer[key].trim();
    if (trimmed.length === 0 || trimmed.length > maximum) return null;
    local[key] = trimmed;
  }
  return {
    requestRef: local.requestRef,
    subjectRef: local.subjectRef,
    context: local.context,
    declarations: {
      identity: declarations.identity,
      pricing: declarations.pricing,
      limitations: declarations.limitations,
      evidence: declarations.evidence,
    },
  };
}

function safeTarget(serviceBase: URL): URL | null {
  try {
    if (!(serviceBase instanceof URL) || !["http:", "https:"].includes(serviceBase.protocol) || serviceBase.username || serviceBase.password) return null;
    const target = new URL("/api/riskscan", serviceBase);
    return ["http:", "https:"].includes(target.protocol) && !target.username && !target.password ? target : null;
  } catch {
    return null;
  }
}

function request(localInput: QuickInput): RequestInit {
  return {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(localInput),
    credentials: "omit",
    redirect: "error",
  };
}

export async function requestRiskScanQuickChallenge(
  serviceBase: URL,
  selection: RiskScanConsumerDiscovery,
  input: unknown,
  sender: RiskScanChallengeSender = fetch,
): Promise<RiskScanConsumerChallengeOutcome> {
  let discovery: ReturnType<typeof selectedDiscovery>;
  try {
    discovery = selectedDiscovery(selection);
  } catch {
    return { kind: "directory_invalid" };
  }
  if (discovery === "directory_unavailable") return { kind: "directory_unavailable" };
  if (discovery !== "tool_selected") return { kind: "directory_invalid" };
  let localInput: QuickInput | null;
  try {
    localInput = snapshotInput(input);
  } catch {
    return { kind: "input_invalid" };
  }
  if (localInput === null) return { kind: "input_invalid" };
  const target = safeTarget(serviceBase);
  if (target === null) return { kind: "directory_invalid" };
  let response: Response;
  try {
    response = await sender(target, request(localInput));
  } catch {
    return { kind: "transport_failure" };
  }
  try {
    if (response.status === 503) return { kind: "unavailable" };
    if (response.status !== 402) return { kind: "unexpected_response" };
    const challenge = response.headers.get("payment-required");
    return typeof challenge === "string" && challenge.trim().length > 0
      ? { kind: "payment_required" }
      : { kind: "unexpected_response" };
  } catch {
    return { kind: "unexpected_response" };
  }
}
