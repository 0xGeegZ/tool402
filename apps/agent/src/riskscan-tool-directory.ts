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

const directoryRequest: RequestInit = {
  method: "GET",
  headers: { accept: "application/json" },
  credentials: "omit",
  redirect: "error",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function hasKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const ownKeys = Reflect.ownKeys(value);
  return ownKeys.length === keys.length && ownKeys.every((key) =>
    typeof key === "string" && keys.includes(key) && Object.prototype.propertyIsEnumerable.call(value, key) &&
      Object.getOwnPropertyDescriptor(value, key)?.get === undefined && Object.getOwnPropertyDescriptor(value, key)?.set === undefined,
  );
}

function hasArray(value: unknown, values: readonly string[]): boolean {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype &&
    Reflect.ownKeys(value).length === values.length + 1 && value.length === values.length &&
    values.every((expected, index) => value[index] === expected);
}

function hasStringBounds(value: unknown, maxLength: number): boolean {
  return hasKeys(value, ["type", "minLength", "maxLength"]) && value.type === "string" &&
    value.minLength === 1 && value.maxLength === maxLength;
}

function hasBoolean(value: unknown): boolean {
  return hasKeys(value, ["type"]) && value.type === "boolean";
}

function validPayment(value: unknown): RiskScanPayment | null {
  if (hasKeys(value, ["state"]) && value.state === "configuration_required") {
    return { state: "configuration_required" };
  }
  if (!hasKeys(value, ["state", "protocol", "network", "price"]) ||
    value.state !== "locally_configured" || value.protocol !== "x402" ||
    typeof value.network !== "string" || typeof value.price !== "string" ||
    !/^eip155:[1-9]\d*$/u.test(value.network) ||
    !/^\$(?:0\.\d*[1-9]\d*|[1-9]\d*(?:\.\d+)?)$/u.test(value.price)) {
    return null;
  }
  return { state: "locally_configured", protocol: "x402", network: value.network as `eip155:${number}`, price: value.price as `$${string}` };
}

function validDirectory(value: unknown): RiskScanPayment | null {
  if (!hasKeys(value, ["version", "tools"]) || value.version !== "v1" ||
    !Array.isArray(value.tools) || Object.getPrototypeOf(value.tools) !== Array.prototype ||
    value.tools.length !== 1 || Reflect.ownKeys(value.tools).length !== 2) return null;
  const tool = value.tools[0];
  if (!hasKeys(tool, ["id", "name", "request", "input", "limitations", "payment"]) ||
    tool.id !== "riskscan.quick" || tool.name !== "RiskScan Quick" ||
    !hasKeys(tool.request, ["method", "path", "contentType"]) || tool.request.method !== "POST" ||
    tool.request.path !== "/api/riskscan" || tool.request.contentType !== "application/json" ||
    !hasKeys(tool.input, ["type", "required", "properties"]) || tool.input.type !== "object" ||
    !hasArray(tool.input.required, ["requestRef", "subjectRef", "context", "declarations"]) ||
    !hasKeys(tool.input.properties, ["requestRef", "subjectRef", "context", "declarations"]) ||
    !hasStringBounds(tool.input.properties.requestRef, 96) || !hasStringBounds(tool.input.properties.subjectRef, 160) ||
    !hasStringBounds(tool.input.properties.context, 280) || !hasKeys(tool.input.properties.declarations, ["type", "additionalProperties", "required", "properties"]) ||
    tool.input.properties.declarations.type !== "object" || tool.input.properties.declarations.additionalProperties !== false ||
    !hasArray(tool.input.properties.declarations.required, ["identity", "pricing", "limitations", "evidence"]) ||
    !hasKeys(tool.input.properties.declarations.properties, ["identity", "pricing", "limitations", "evidence"]) ||
    !hasBoolean(tool.input.properties.declarations.properties.identity) || !hasBoolean(tool.input.properties.declarations.properties.pricing) ||
    !hasBoolean(tool.input.properties.declarations.properties.limitations) || !hasBoolean(tool.input.properties.declarations.properties.evidence) ||
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
    response = await fetcher(new URL("/api/tools", serviceBase), directoryRequest);
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
  const payment = validDirectory(value);
  return payment === null ? { kind: "directory_invalid" } : selection(payment);
}
