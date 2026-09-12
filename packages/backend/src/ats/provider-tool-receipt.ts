type ExpectedProviderToolReceipt = Readonly<{
  chainId: 296;
  sender: string;
  factory: string;
  input: string;
  transactionHash: string;
  asset: string;
}>;

type ProviderToolTransactionDocument = Readonly<{
  hash: string;
  chainId: number;
  from: string;
  to: string;
  input: string;
}>;

type ProviderToolReceiptDocument = Readonly<{
  transactionHash: string;
  status: string;
  logs: readonly unknown[];
}>;

export type ProviderToolReceiptVerification =
  | Readonly<{ outcome: "VERIFIED"; transactionHash: string; asset: string }>
  | Readonly<{ outcome: "REJECTED" }>
  | Readonly<{ outcome: "UNKNOWN" }>;

const addressPattern = /^0x[0-9a-f]{40}$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;
const inputPattern = /^0x(?:[0-9a-f]{2})*$/u;
const maximumLogs = 100;

function unknown(): ProviderToolReceiptVerification {
  return Object.freeze({ outcome: "UNKNOWN" });
}

function rejected(): ProviderToolReceiptVerification {
  return Object.freeze({ outcome: "REJECTED" });
}

function ownDataRecord(input: unknown, fields: readonly string[]): Record<string, unknown> | null {
  try {
    if (
      input === null
      || typeof input !== "object"
      || Array.isArray(input)
      || Object.getPrototypeOf(input) !== Object.prototype
    ) return null;
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== fields.length
      || keys.some((key) => typeof key !== "string" || !fields.includes(key))
    ) return null;
    const record: Record<string, unknown> = Object.create(null);
    for (const field of fields) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
      if (
        descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get")
        || Object.hasOwn(descriptor, "set")
      ) return null;
      record[field] = descriptor.value;
    }
    return Object.freeze(record);
  } catch {
    return null;
  }
}

function canonicalAddress(value: unknown): string | null {
  return typeof value === "string" && addressPattern.test(value) ? value : null;
}

function canonicalHash(value: unknown): string | null {
  return typeof value === "string" && hashPattern.test(value) ? value : null;
}

function canonicalInput(value: unknown): string | null {
  return typeof value === "string" && inputPattern.test(value) ? value : null;
}

function readExpected(input: unknown): ExpectedProviderToolReceipt | null {
  const record = ownDataRecord(input, ["chainId", "sender", "factory", "input", "transactionHash", "asset"]);
  if (
    record === null
    || record.chainId !== 296
    || canonicalAddress(record.sender) === null
    || canonicalAddress(record.factory) === null
    || canonicalInput(record.input) === null
    || canonicalHash(record.transactionHash) === null
    || canonicalAddress(record.asset) === null
  ) return null;
  return Object.freeze({
    chainId: 296,
    sender: record.sender as string,
    factory: record.factory as string,
    input: record.input as string,
    transactionHash: record.transactionHash as string,
    asset: record.asset as string,
  });
}

function readTransaction(input: unknown): ProviderToolTransactionDocument | null {
  const record = ownDataRecord(input, ["hash", "chainId", "from", "to", "input"]);
  if (
    record === null
    || canonicalHash(record.hash) === null
    || typeof record.chainId !== "number"
    || !Number.isSafeInteger(record.chainId)
    || canonicalAddress(record.from) === null
    || canonicalAddress(record.to) === null
    || canonicalInput(record.input) === null
  ) return null;
  return Object.freeze({
    hash: record.hash as string,
    chainId: record.chainId,
    from: record.from as string,
    to: record.to as string,
    input: record.input as string,
  });
}

function readLogs(input: unknown): readonly unknown[] | null {
  if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype || input.length > maximumLogs) return null;
  const values: unknown[] = [];
  try {
    for (let index = 0; index < input.length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(input, String(index));
      if (
        descriptor === undefined
        || descriptor.enumerable !== true
        || !Object.hasOwn(descriptor, "value")
        || Object.hasOwn(descriptor, "get")
        || Object.hasOwn(descriptor, "set")
      ) return null;
      values.push(descriptor.value);
    }
  } catch {
    return null;
  }
  return Object.freeze(values);
}

function readReceipt(input: unknown): ProviderToolReceiptDocument | null {
  const record = ownDataRecord(input, ["transactionHash", "status", "logs"]);
  const logs = record === null ? null : readLogs(record.logs);
  if (
    record === null
    || canonicalHash(record.transactionHash) === null
    || typeof record.status !== "string"
    || logs === null
  ) return null;
  return Object.freeze({
    transactionHash: record.transactionHash as string,
    status: record.status,
    logs,
  });
}

function hasOneExpectedBondDeployedLog(
  logs: readonly unknown[],
  expected: ExpectedProviderToolReceipt,
): boolean | null {
  let found = false;
  for (const value of logs) {
    const record = ownDataRecord(value, ["address", "eventName", "asset"]);
    if (record === null) return null;
    if (
      canonicalAddress(record.address) === null
      || typeof record.eventName !== "string"
      || canonicalAddress(record.asset) === null
    ) return null;
    if (record.address !== expected.factory) continue;
    if (record.eventName !== "BondDeployed" || record.asset !== expected.asset || found) return false;
    found = true;
  }
  return found;
}

/**
 * Verify untrusted transaction and receipt documents against immutable,
 * server-derived selected-tool expectations. The caller decides how documents
 * were read; malformed or unavailable evidence is deliberately UNKNOWN.
 */
export function verifyProviderToolReceipt(input: Readonly<{
  expected: unknown;
  transaction: unknown;
  receipt: unknown;
}>): ProviderToolReceiptVerification {
  const envelope = ownDataRecord(input, ["expected", "transaction", "receipt"]);
  if (envelope === null) return unknown();
  const expected = readExpected(envelope.expected);
  const transaction = readTransaction(envelope.transaction);
  const receipt = readReceipt(envelope.receipt);
  if (expected === null || transaction === null || receipt === null) return unknown();
  if (
    transaction.hash !== expected.transactionHash
    || transaction.chainId !== expected.chainId
    || transaction.from !== expected.sender
    || transaction.to !== expected.factory
    || transaction.input !== expected.input
    || receipt.transactionHash !== expected.transactionHash
    || receipt.status !== "0x1"
  ) return rejected();
  const event = hasOneExpectedBondDeployedLog(receipt.logs, expected);
  if (event === null) return unknown();
  if (!event) return rejected();
  return Object.freeze({
    outcome: "VERIFIED",
    transactionHash: expected.transactionHash,
    asset: expected.asset,
  });
}
