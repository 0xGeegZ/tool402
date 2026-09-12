import { parseHederaAccountId, type HederaAccountId } from "./value.ts";

export type DirectoryCapability = "evm-contract-risk-signals";
export type DirectoryTier = "quick" | "standard";
export type DirectoryServiceSlug = "riskscan" | `tool-${string}`;

export type AdvertisedDirectoryTiers =
  | readonly ["quick"]
  | readonly ["standard"]
  | readonly ["quick", "standard"];

export interface AgentDirectoryRecordCandidate {
  readonly schemaVersion: 1;
  readonly serviceId: string;
  readonly serviceSlug: DirectoryServiceSlug;
  readonly offeringPublicId: string;
  readonly offeringVersion: number;
  readonly capabilities: readonly [DirectoryCapability];
  readonly x402Endpoint: string;
  readonly webUrl?: string;
  readonly paymentProtocol: "x402";
  readonly paymentNetwork: "hedera-testnet";
  readonly asset: "HBAR";
  readonly advertisedTiers: AdvertisedDirectoryTiers;
  readonly issuerRevenueAccount: HederaAccountId;
  readonly clearingAccount: HederaAccountId;
  readonly status: "active";
  readonly publishedAt: string;
}

const requiredFields: readonly string[] = [
  "schemaVersion",
  "serviceId",
  "serviceSlug",
  "offeringPublicId",
  "offeringVersion",
  "capabilities",
  "x402Endpoint",
  "paymentProtocol",
  "paymentNetwork",
  "asset",
  "advertisedTiers",
  "issuerRevenueAccount",
  "clearingAccount",
  "status",
  "publishedAt",
];
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const allocatedToolServiceSlugPattern = /^tool-[0-9a-f]{32}$/u;
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function rejectDirectoryRecord(): never {
  throw new TypeError("invalid directory record candidate");
}

function captureDataField(input: object, field: string): unknown {
  const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
  if (
    descriptor === undefined ||
    descriptor.enumerable !== true ||
    !Object.hasOwn(descriptor, "value") ||
    Object.hasOwn(descriptor, "get") ||
    Object.hasOwn(descriptor, "set")
  ) {
    return rejectDirectoryRecord();
  }

  return descriptor.value;
}

function captureRecord(input: unknown): readonly unknown[] {
  if (input === null || typeof input !== "object") {
    return rejectDirectoryRecord();
  }

  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return rejectDirectoryRecord();
    }

    const keys = Reflect.ownKeys(input);
    if (
      (keys.length !== requiredFields.length &&
        keys.length !== requiredFields.length + 1) ||
      keys.some((key) =>
        typeof key !== "string" ||
        (!requiredFields.includes(key) && key !== "webUrl")
      )
    ) {
      return rejectDirectoryRecord();
    }

    const values = requiredFields.map((field) => captureDataField(input, field));
    if (keys.includes("webUrl")) {
      values.push(captureDataField(input, "webUrl"));
    }
    return values;
  } catch {
    return rejectDirectoryRecord();
  }
}

function captureArray(input: unknown, maximumLength: 1 | 2): readonly unknown[] {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) {
      return rejectDirectoryRecord();
    }

    const descriptor = Reflect.getOwnPropertyDescriptor(input, "length");
    if (
      descriptor === undefined ||
      descriptor.enumerable !== false ||
      descriptor.configurable !== false ||
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set")
    ) {
      return rejectDirectoryRecord();
    }
    const length: unknown = descriptor.value;
    if (length !== 1 && !(maximumLength === 2 && length === 2)) {
      return rejectDirectoryRecord();
    }

    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== length + 1 ||
      keys.some((key) =>
        key !== "length" && key !== "0" && !(length === 2 && key === "1")
      )
    ) {
      return rejectDirectoryRecord();
    }

    const values = [captureDataField(input, "0")];
    if (length === 2) {
      values.push(captureDataField(input, "1"));
    }
    return values;
  } catch {
    return rejectDirectoryRecord();
  }
}

function parsePublicId(value: unknown): string {
  if (typeof value !== "string" || !publicIdPattern.test(value)) {
    return rejectDirectoryRecord();
  }
  return value;
}

function parseServiceSlug(value: unknown): DirectoryServiceSlug {
  if (value === "riskscan") return value;
  if (typeof value === "string" && allocatedToolServiceSlugPattern.test(value)) return value as `tool-${string}`;
  return rejectDirectoryRecord();
}

function parseAccount(value: unknown): HederaAccountId {
  if (typeof value !== "string" || value.length > 96) {
    return rejectDirectoryRecord();
  }
  return parseHederaAccountId(value) ?? rejectDirectoryRecord();
}

function parsePublishedAt(value: unknown): string {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    return rejectDirectoryRecord();
  }

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
    return rejectDirectoryRecord();
  }
  return value;
}

function parseUrl(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048 ||
    value.trim() !== value ||
    value.includes("#")
  ) {
    return rejectDirectoryRecord();
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname.length === 0 ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== ""
    ) {
      return rejectDirectoryRecord();
    }
    return url.href;
  } catch {
    return rejectDirectoryRecord();
  }
}

function parseTiers(values: readonly unknown[]): AdvertisedDirectoryTiers {
  if (values.length === 1) {
    if (values[0] === "quick") return Object.freeze(["quick"] as const);
    if (values[0] === "standard") return Object.freeze(["standard"] as const);
  } else if (values[0] === "quick" && values[1] === "standard") {
    return Object.freeze(["quick", "standard"] as const);
  }
  return rejectDirectoryRecord();
}

export function parseAgentDirectoryRecordCandidate(
  input: unknown,
): AgentDirectoryRecordCandidate {
  const snapshot = captureRecord(input);
  const [
    schemaVersion,
    serviceId,
    serviceSlug,
    offeringPublicId,
    offeringVersion,
    capabilitiesInput,
    x402Endpoint,
    paymentProtocol,
    paymentNetwork,
    asset,
    advertisedTiersInput,
    issuerRevenueAccount,
    clearingAccount,
    status,
    publishedAt,
    webUrl,
  ] = snapshot;
  const capabilities = captureArray(capabilitiesInput, 1);
  const advertisedTiers = captureArray(advertisedTiersInput, 2);

  if (
    schemaVersion !== 1 ||
    typeof offeringVersion !== "number" ||
    !Number.isSafeInteger(offeringVersion) ||
    offeringVersion < 1 ||
    capabilities[0] !== "evm-contract-risk-signals" ||
    paymentProtocol !== "x402" ||
    paymentNetwork !== "hedera-testnet" ||
    asset !== "HBAR" ||
    status !== "active"
  ) {
    return rejectDirectoryRecord();
  }

  const parsedServiceSlug = parseServiceSlug(serviceSlug);
  const record: AgentDirectoryRecordCandidate = {
    schemaVersion,
    serviceId: parsePublicId(serviceId),
    serviceSlug: parsedServiceSlug,
    offeringPublicId: parsePublicId(offeringPublicId),
    offeringVersion,
    capabilities: Object.freeze(["evm-contract-risk-signals"] as const),
    x402Endpoint: parseUrl(x402Endpoint),
    paymentProtocol,
    paymentNetwork,
    asset,
    advertisedTiers: parseTiers(advertisedTiers),
    issuerRevenueAccount: parseAccount(issuerRevenueAccount),
    clearingAccount: parseAccount(clearingAccount),
    status,
    publishedAt: parsePublishedAt(publishedAt),
  };
  if (snapshot.length === requiredFields.length + 1) {
    Object.defineProperty(record, "webUrl", {
      value: parseUrl(webUrl),
      enumerable: true,
    });
  }
  return Object.freeze(record);
}
