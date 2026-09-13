import { isCanonicalStageBTransactionHash } from "../../../lib/ats/stage-b-browser-provider-bridge.ts";

const storagePrefix = "tool402:ats-create-recovery:v1";
const attemptPattern = /^[A-Za-z0-9_-]{22}$/u;

export type StageBRecoveryScope = Readonly<{
  address: string;
  chainId: 296;
  preparedAttemptPublicId: string;
  toolPublicId: string;
}>;

type StageBRecoveryRecord = Readonly<{
  version: 1;
  hash: string;
  scope: StageBRecoveryScope;
}>;

function exactRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;
  return value as Record<string, unknown>;
}

function isScope(value: unknown): value is StageBRecoveryScope {
  const record = exactRecord(value);
  return record !== null
    && Object.keys(record).length === 4
    && typeof record.address === "string"
    && record.address === record.address.toLowerCase()
    && record.chainId === 296
    && typeof record.preparedAttemptPublicId === "string"
    && attemptPattern.test(record.preparedAttemptPublicId)
    && typeof record.toolPublicId === "string"
    && record.toolPublicId.length > 0;
}

function isRecord(value: unknown): value is StageBRecoveryRecord {
  const record = exactRecord(value);
  return record !== null
    && Object.keys(record).length === 3
    && record.version === 1
    && isCanonicalStageBTransactionHash(record.hash)
    && isScope(record.scope);
}

function sameScope(left: StageBRecoveryScope, right: StageBRecoveryScope): boolean {
  return left.address === right.address
    && left.chainId === right.chainId
    && left.preparedAttemptPublicId === right.preparedAttemptPublicId
    && left.toolPublicId === right.toolPublicId;
}

function key(scope: StageBRecoveryScope): string {
  return `${storagePrefix}:${scope.address}:${scope.chainId}:${scope.toolPublicId}:${scope.preparedAttemptPublicId}`;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createStageBRecoveryScope(input: Readonly<{
  address: string;
  preparedAttemptPublicId?: string;
  selectedToolPublicId?: string;
}>): StageBRecoveryScope | null {
  if (input.preparedAttemptPublicId === undefined || !attemptPattern.test(input.preparedAttemptPublicId)) return null;
  return Object.freeze({
    address: input.address,
    chainId: 296,
    preparedAttemptPublicId: input.preparedAttemptPublicId,
    toolPublicId: input.selectedToolPublicId ?? "riskscan_revenue_note_demo",
  });
}

export function readStageBRecovery(scope: StageBRecoveryScope): string | null {
  const local = storage();
  if (local === null) return null;
  try {
    const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
    return isRecord(parsed) && sameScope(parsed.scope, scope) ? parsed.hash : null;
  } catch {
    return null;
  }
}

export function persistStageBRecovery(scope: StageBRecoveryScope, hash: string): void {
  if (!isCanonicalStageBTransactionHash(hash)) return;
  const local = storage();
  if (local === null) return;
  const record: StageBRecoveryRecord = Object.freeze({ version: 1, hash, scope });
  try {
    local.setItem(key(scope), JSON.stringify(record));
  } catch {
    // Recovery remains available in the current UI when browser storage is unavailable.
  }
}

export function clearStageBRecovery(scope: StageBRecoveryScope, hash: string): void {
  const local = storage();
  if (local === null) return;
  try {
    const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
    if (isRecord(parsed) && sameScope(parsed.scope, scope) && parsed.hash === hash) local.removeItem(key(scope));
  } catch {
    // A malformed or unavailable browser store cannot affect the corroborated candidate.
  }
}
