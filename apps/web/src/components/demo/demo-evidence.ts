import { hashscanTransactionUrl } from "../../lib/hashscan-links.ts";

export type AgentPaymentEvidence = Readonly<{
  schemaVersion: 1;
  kind: "tool402.agent-payment";
  recordingRunRef: string | null;
  sourceVersion: string | null;
  observedAt: string;
  service: Readonly<{ id: "riskscan.quick"; host: string }>;
  payment: Readonly<{
    network: "hedera:testnet";
    asset: string;
    quotedAmount: string;
    settlementRef: string;
    payer: string;
    recipient: string;
    settlementReportedBy: "facilitator-reported";
  }>;
  result: Readonly<{ requestRef: string; digest: string; receivedAndValidatedByClient: true }>;
}>;

type StorageLike = Readonly<{ getItem(key: string): string | null; setItem(key: string, value: string): void }>;

const evidenceStorageKey = "tool402.demo-evidence.v1";
const maximumImportBytes = 16_384;
const maximumRecords = 8;
const accountPattern = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/u;
const settlementPattern = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)@(?:[1-9][0-9]*)\.(?:0|[1-9][0-9]{0,8})$/u;
const referencePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/u;
const sourcePattern = /^[0-9a-f]{7,64}$/u;
const hashPattern = /^[0-9a-f]{64}$/u;
const b03RecordingRun = "b03-release-001";
const b03ServiceHost = "tool402.vercel.app";

function exactObject(value: unknown, fields: readonly string[]): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const keys = Object.keys(value);
  return keys.length === fields.length && fields.every((field) => Object.hasOwn(value, field)) ? value as Record<string, unknown> : null;
}

function safeString(value: unknown, pattern: RegExp): value is string {
  return typeof value === "string" && pattern.test(value);
}

function nullable(value: unknown, pattern: RegExp): value is string | null {
  return value === null || safeString(value, pattern);
}

function snapshotEvidence(value: unknown): AgentPaymentEvidence | null {
  const outer = exactObject(value, ["schemaVersion", "kind", "recordingRunRef", "sourceVersion", "observedAt", "service", "payment", "result"]);
  if (outer === null || outer.schemaVersion !== 1 || outer.kind !== "tool402.agent-payment" || !nullable(outer.recordingRunRef, referencePattern)
    || !nullable(outer.sourceVersion, sourcePattern) || typeof outer.observedAt !== "string" || Number.isNaN(Date.parse(outer.observedAt))) return null;
  const service = exactObject(outer.service, ["id", "host"]);
  const payment = exactObject(outer.payment, ["network", "asset", "quotedAmount", "settlementRef", "payer", "recipient", "settlementReportedBy"]);
  const result = exactObject(outer.result, ["requestRef", "digest", "receivedAndValidatedByClient"]);
  if (service === null || payment === null || result === null || service.id !== "riskscan.quick"
    || typeof service.host !== "string" || service.host.length < 1 || service.host.length > 253 || /[/?#@:\\]/u.test(service.host)
    || payment.network !== "hedera:testnet" || !safeString(payment.asset, accountPattern) || !safeString(payment.quotedAmount, /^[1-9][0-9]*$/u)
    || !safeString(payment.settlementRef, settlementPattern) || !safeString(payment.payer, accountPattern) || !safeString(payment.recipient, accountPattern)
    || payment.settlementReportedBy !== "facilitator-reported" || !safeString(result.requestRef, referencePattern) || !safeString(result.digest, hashPattern)
    || result.receivedAndValidatedByClient !== true) return null;
  if (outer.recordingRunRef !== b03RecordingRun || service.host !== b03ServiceHost
    || payment.asset !== "0.0.0" || result.requestRef !== b03RecordingRun) return null;
  return Object.freeze({
    schemaVersion: 1, kind: "tool402.agent-payment", recordingRunRef: outer.recordingRunRef, sourceVersion: outer.sourceVersion, observedAt: outer.observedAt,
    service: Object.freeze({ id: "riskscan.quick", host: service.host }),
    payment: Object.freeze({ network: "hedera:testnet", asset: payment.asset, quotedAmount: payment.quotedAmount, settlementRef: payment.settlementRef, payer: payment.payer, recipient: payment.recipient, settlementReportedBy: "facilitator-reported" }),
    result: Object.freeze({ requestRef: result.requestRef, digest: result.digest, receivedAndValidatedByClient: true }),
  });
}

export function parseDemoEvidenceImport(value: unknown): AgentPaymentEvidence | null {
  if (typeof value !== "string" || value.length === 0 || value.length > maximumImportBytes) return null;
  try { return snapshotEvidence(JSON.parse(value) as unknown); } catch { return null; }
}

function evidenceKey(value: AgentPaymentEvidence): string {
  return `${value.payment.network}:${value.payment.settlementRef}`;
}

export function mergeDemoEvidence(current: readonly AgentPaymentEvidence[], next: AgentPaymentEvidence): readonly AgentPaymentEvidence[] {
  const existing = current.filter((item) => snapshotEvidence(item) !== null);
  return existing.some((item) => evidenceKey(item) === evidenceKey(next)) ? existing : [...existing, next].slice(-maximumRecords);
}

export function readStoredDemoEvidence(storage: StorageLike): readonly AgentPaymentEvidence[] {
  try {
    const raw = storage.getItem(evidenceStorageKey);
    if (raw === null || raw.length > maximumImportBytes * maximumRecords) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length > maximumRecords) return [];
    return parsed.reduce<readonly AgentPaymentEvidence[]>((records, item) => {
      const next = snapshotEvidence(item);
      return next === null ? records : mergeDemoEvidence(records, next);
    }, []);
  } catch { return []; }
}

export function writeStoredDemoEvidence(storage: StorageLike, records: readonly AgentPaymentEvidence[]): void {
  const safe = records.reduce<readonly AgentPaymentEvidence[]>((result, item) => {
    const snapshot = snapshotEvidence(item);
    return snapshot === null ? result : mergeDemoEvidence(result, snapshot);
  }, []);
  storage.setItem(evidenceStorageKey, JSON.stringify(safe));
}

export function summarizeDemoEvidence(records: readonly AgentPaymentEvidence[]): Readonly<{
  agentPayment: Readonly<{ status: "Not performed" | "Settlement reported"; detail: string; hashscanUrl: string | null; verifiedOnHedera: false }>;
}> {
  const evidence = records.at(-1);
  if (evidence === undefined) return { agentPayment: { status: "Not performed", detail: "No local Agent payment evidence has been imported.", hashscanUrl: null, verifiedOnHedera: false } };
  return {
    agentPayment: {
      status: "Settlement reported",
      detail: "Submitted — verification pending. Result received by the Agent.",
      hashscanUrl: hashscanTransactionUrl(evidence.payment.settlementRef),
      verifiedOnHedera: false,
    },
  };
}

export function exportDemoEvidenceSummary(records: readonly AgentPaymentEvidence[]): string {
  return JSON.stringify(records.filter((item) => snapshotEvidence(item) !== null).at(-1) ?? null);
}
