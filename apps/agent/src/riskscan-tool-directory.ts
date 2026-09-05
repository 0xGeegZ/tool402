export type RiskScanDirectoryFetcher = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

type RiskScanPayment =
  | { state: "configuration_required" }
  | {
      state: "locally_configured";
      protocol: "x402";
      network: `eip155:${number}`;
      price: `$${string}`;
    };

type RiskScanTool = {
  id: "riskscan.quick";
  name: "RiskScan Quick";
  request: {
    method: "POST";
    path: "/api/riskscan";
    contentType: "application/json";
  };
  input: {
    type: "object";
    required: ["requestRef", "subjectRef", "context", "declarations"];
    properties: {
      requestRef: { type: "string"; minLength: 1; maxLength: 96 };
      subjectRef: { type: "string"; minLength: 1; maxLength: 160 };
      context: { type: "string"; minLength: 1; maxLength: 280 };
      declarations: {
        type: "object";
        additionalProperties: false;
        required: ["identity", "pricing", "limitations", "evidence"];
        properties: {
          identity: { type: "boolean" };
          pricing: { type: "boolean" };
          limitations: { type: "boolean" };
          evidence: { type: "boolean" };
        };
      };
    };
  };
  limitations: [
    "quick_assessment_only",
    "caller_declarations_are_not_external_verification",
  ];
  payment: RiskScanPayment;
};

export type RiskScanConsumerDiscovery =
  | { kind: "directory_unavailable" }
  | { kind: "directory_invalid" }
  | { kind: "tool_selected"; tool: RiskScanTool };

function directoryRequest(): RequestInit {
  return {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "omit",
    redirect: "error",
  };
}

function snapshotRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length || !ownKeys.every((key) => typeof key === "string" && keys.includes(key))) return null;
  const snapshot: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || descriptor.enumerable !== true || descriptor.get !== undefined || descriptor.set !== undefined) return null;
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function snapshotArray(value: unknown, length: number): unknown[] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || Reflect.ownKeys(value).length !== length + 1) return null;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (lengthDescriptor === undefined || lengthDescriptor.enumerable !== false || lengthDescriptor.get !== undefined ||
    lengthDescriptor.set !== undefined || lengthDescriptor.value !== length) return null;
  const snapshot: unknown[] = [];
  for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || descriptor.enumerable !== true || descriptor.get !== undefined || descriptor.set !== undefined) return null;
    snapshot.push(descriptor.value);
  }
  return snapshot;
}

function hasArray(value: unknown, values: readonly string[]): boolean {
  const snapshot = snapshotArray(value, values.length);
  return snapshot !== null && values.every((expected, index) => snapshot[index] === expected);
}

function hasStringBounds(value: unknown, maxLength: number): boolean {
  const snapshot = snapshotRecord(value, ["type", "minLength", "maxLength"]);
  return snapshot !== null && snapshot.type === "string" && snapshot.minLength === 1 && snapshot.maxLength === maxLength;
}

function hasBoolean(value: unknown): boolean {
  const snapshot = snapshotRecord(value, ["type"]);
  return snapshot !== null && snapshot.type === "boolean";
}

function validPayment(value: unknown): RiskScanPayment | null {
  const configurationRequired = snapshotRecord(value, ["state"]);
  if (configurationRequired !== null && configurationRequired.state === "configuration_required") {
    return { state: "configuration_required" };
  }
  const snapshot = snapshotRecord(value, ["state", "protocol", "network", "price"]);
  if (snapshot === null || snapshot.state !== "locally_configured" || snapshot.protocol !== "x402" ||
    typeof snapshot.network !== "string" || typeof snapshot.price !== "string" ||
    !/^eip155:[1-9]\d*$/u.test(snapshot.network) ||
    !/^\$(?:0\.\d*[1-9]\d*|[1-9]\d*(?:\.\d+)?)$/u.test(snapshot.price)) {
    return null;
  }
  return { state: "locally_configured", protocol: "x402", network: snapshot.network as `eip155:${number}`, price: snapshot.price as `$${string}` };
}

function validDirectory(value: unknown): RiskScanPayment | null {
  const directory = snapshotRecord(value, ["version", "tools"]);
  if (directory === null || directory.version !== "v1") return null;
  const tools = snapshotArray(directory.tools, 1);
  if (tools === null) return null;
  const tool = snapshotRecord(tools[0], ["id", "name", "request", "input", "limitations", "payment"]);
  if (tool === null || tool.id !== "riskscan.quick" || tool.name !== "RiskScan Quick") return null;
  const request = snapshotRecord(tool.request, ["method", "path", "contentType"]);
  if (request === null || request.method !== "POST" || request.path !== "/api/riskscan" || request.contentType !== "application/json") return null;
  const input = snapshotRecord(tool.input, ["type", "required", "properties"]);
  if (input === null || input.type !== "object" || !hasArray(input.required, ["requestRef", "subjectRef", "context", "declarations"])) return null;
  const properties = snapshotRecord(input.properties, ["requestRef", "subjectRef", "context", "declarations"]);
  if (properties === null || !hasStringBounds(properties.requestRef, 96) || !hasStringBounds(properties.subjectRef, 160) || !hasStringBounds(properties.context, 280)) return null;
  const declarations = snapshotRecord(properties.declarations, ["type", "additionalProperties", "required", "properties"]);
  if (declarations === null || declarations.type !== "object" || declarations.additionalProperties !== false ||
    !hasArray(declarations.required, ["identity", "pricing", "limitations", "evidence"])) return null;
  const declarationProperties = snapshotRecord(declarations.properties, ["identity", "pricing", "limitations", "evidence"]);
  if (declarationProperties === null || !hasBoolean(declarationProperties.identity) || !hasBoolean(declarationProperties.pricing) ||
    !hasBoolean(declarationProperties.limitations) || !hasBoolean(declarationProperties.evidence) ||
    !hasArray(tool.limitations, ["quick_assessment_only", "caller_declarations_are_not_external_verification"])) return null;
  return validPayment(tool.payment);
}

function selection(payment: RiskScanPayment): RiskScanConsumerDiscovery {
  return {
    kind: "tool_selected",
    tool: {
      id: "riskscan.quick", name: "RiskScan Quick",
      request: { method: "POST", path: "/api/riskscan", contentType: "application/json" },
      input: {
        type: "object", required: ["requestRef", "subjectRef", "context", "declarations"],
        properties: {
          requestRef: { type: "string", minLength: 1, maxLength: 96 },
          subjectRef: { type: "string", minLength: 1, maxLength: 160 },
          context: { type: "string", minLength: 1, maxLength: 280 },
          declarations: {
            type: "object", additionalProperties: false, required: ["identity", "pricing", "limitations", "evidence"],
            properties: { identity: { type: "boolean" }, pricing: { type: "boolean" }, limitations: { type: "boolean" }, evidence: { type: "boolean" } },
          },
        },
      },
      limitations: ["quick_assessment_only", "caller_declarations_are_not_external_verification"], payment,
    },
  };
}

export async function discoverRiskScanQuick(
  serviceBase: URL,
  fetcher: RiskScanDirectoryFetcher = fetch,
): Promise<RiskScanConsumerDiscovery> {
  if (!(serviceBase instanceof URL) || !["http:", "https:"].includes(serviceBase.protocol) || serviceBase.username || serviceBase.password) {
    return { kind: "directory_invalid" };
  }
  let response: Response;
  try {
    response = await fetcher(new URL("/api/tools", serviceBase), directoryRequest());
  } catch {
    return { kind: "directory_unavailable" };
  }
  if (response.status !== 200) return { kind: "directory_unavailable" };
  if (!/^application\/json(?:;|$)/iu.test(response.headers.get("content-type") ?? "")) return { kind: "directory_invalid" };
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    return { kind: "directory_invalid" };
  }
  let payment: RiskScanPayment | null;
  try {
    payment = validDirectory(value);
  } catch {
    return { kind: "directory_invalid" };
  }
  return payment === null ? { kind: "directory_invalid" } : selection(payment);
}
