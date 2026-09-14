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
  version: 2;
  claimId: string;
  state: "reserved" | "submitted";
  hash?: string;
  recoveryHash?: string;
  scope: StageBRecoveryScope;
}>;

type LegacyStageBRecoveryRecord = Readonly<{
  version: 1;
  state?: "submitted";
  hash?: string;
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

function isLegacyRecord(value: unknown): value is LegacyStageBRecoveryRecord {
  const record = exactRecord(value);
  return record !== null
    && (Object.keys(record).length === 2 || Object.keys(record).length === 3 || Object.keys(record).length === 4)
    && record.version === 1
    && (record.state === undefined || record.state === "submitted")
    && (record.hash === undefined || isCanonicalStageBTransactionHash(record.hash))
    && isScope(record.scope);
}

function isRecord(value: unknown): value is StageBRecoveryRecord {
  const record = exactRecord(value);
  return record !== null
    && (Object.keys(record).length === 4 || Object.keys(record).length === 5 || Object.keys(record).length === 6)
    && record.version === 2
    && typeof record.claimId === "string"
    && record.claimId.length > 0
    && (record.state === "reserved" || record.state === "submitted")
    && (record.hash === undefined || (record.state === "submitted" && isCanonicalStageBTransactionHash(record.hash)))
    && (record.recoveryHash === undefined || (record.state === "reserved" && isCanonicalStageBTransactionHash(record.recoveryHash)))
    && !(record.hash !== undefined && record.recoveryHash !== undefined)
    && !(record.state === "submitted" && record.hash === undefined)
    && isScope(record.scope);
}

function isKnownRecord(value: unknown): value is StageBRecoveryRecord | LegacyStageBRecoveryRecord {
  return isRecord(value) || isLegacyRecord(value);
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
    return isKnownRecord(parsed) && sameScope(parsed.scope, scope)
      ? parsed.hash ?? (isRecord(parsed) ? parsed.recoveryHash ?? null : null)
      : null;
  } catch {
    return null;
  }
}

function writeStageBRecovery(local: Storage, record: StageBRecoveryRecord): boolean {
  try {
    local.setItem(key(record.scope), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

async function withStageBRecoveryLock<T>(scope: StageBRecoveryScope, unavailable: T, operation: (local: Storage) => T | Promise<T>): Promise<T> {
  const local = storage();
  if (local === null || typeof navigator === "undefined" || navigator.locks === undefined) return unavailable;
  try {
    return await navigator.locks.request(`tool402:ats-create:${key(scope)}`, { mode: "exclusive" }, () => operation(local));
  } catch {
    return unavailable;
  }
}

export async function persistStageBRecovery(scope: StageBRecoveryScope, claimId: string, hash: string): Promise<boolean> {
  if (!isCanonicalStageBTransactionHash(hash)) return false;
  return withStageBRecoveryLock(scope, false, (local) => {
    try {
      const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
      if (!isRecord(parsed) || !sameScope(parsed.scope, scope) || parsed.claimId !== claimId || parsed.state !== "reserved") return false;
      if (parsed.recoveryHash !== undefined && parsed.recoveryHash !== hash) return false;
      return writeStageBRecovery(local, Object.freeze({ version: 2, claimId, state: "submitted", hash, scope }));
    } catch {
      return false;
    }
  });
}

export function hasStageBRecovery(scope: StageBRecoveryScope): boolean {
  return stageBRecoveryStatus(scope) === "existing";
}

export type StageBRecoveryStatus = "clear" | "existing" | "unavailable";

export function stageBRecoveryStatus(scope: StageBRecoveryScope): StageBRecoveryStatus {
  const local = storage();
  if (local === null || typeof navigator === "undefined" || navigator.locks === undefined) return "unavailable";
  try {
    const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
    if (parsed === null) return "clear";
    return isKnownRecord(parsed) && sameScope(parsed.scope, scope) ? "existing" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export type StageBRecoveryClaim =
  | Readonly<{ kind: "claimed"; claimId: string }>
  | Readonly<{ kind: "existing" }>
  | Readonly<{ kind: "unavailable" }>;

export type StageBRecoveryReconciliation =
  | Readonly<{ kind: "reconciled" }>
  | Readonly<{ kind: "existing" }>
  | Readonly<{ kind: "conflict" }>
  | Readonly<{ kind: "unavailable" }>;

function createClaimId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export async function beginStageBRecovery(scope: StageBRecoveryScope): Promise<StageBRecoveryClaim> {
  return withStageBRecoveryLock(scope, { kind: "unavailable" }, (local) => {
    try {
      const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
      if (parsed !== null) return isKnownRecord(parsed) && sameScope(parsed.scope, scope) ? { kind: "existing" } : { kind: "unavailable" };
      const claimId = createClaimId();
      return writeStageBRecovery(local, Object.freeze({ version: 2, claimId, state: "reserved", scope }))
        ? { kind: "claimed", claimId }
        : { kind: "unavailable" };
    } catch {
      return { kind: "unavailable" };
    }
  });
}

export async function reconcileStageBRecovery(scope: StageBRecoveryScope, hash: string): Promise<StageBRecoveryReconciliation> {
  if (!isCanonicalStageBTransactionHash(hash)) return { kind: "unavailable" };
  return withStageBRecoveryLock(scope, { kind: "unavailable" }, (local) => {
    try {
      const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
      if (!isKnownRecord(parsed) || !sameScope(parsed.scope, scope)) return { kind: "unavailable" };
      if (isLegacyRecord(parsed)) {
        if (parsed.hash !== undefined) return parsed.hash === hash ? { kind: "existing" } : { kind: "conflict" };
        return writeStageBRecovery(local, Object.freeze({ version: 2, claimId: createClaimId(), state: "reserved", recoveryHash: hash, scope }))
          ? { kind: "reconciled" }
          : { kind: "unavailable" };
      }
      if (parsed.state === "submitted") return parsed.hash === hash ? { kind: "existing" } : { kind: "conflict" };
      if (parsed.recoveryHash !== undefined) return parsed.recoveryHash === hash ? { kind: "existing" } : { kind: "conflict" };
      return writeStageBRecovery(local, Object.freeze({ ...parsed, recoveryHash: hash })) ? { kind: "reconciled" } : { kind: "unavailable" };
    } catch {
      return { kind: "unavailable" };
    }
  });
}

export async function releaseStageBRecoveryReservation(scope: StageBRecoveryScope, claimId: string): Promise<boolean> {
  return withStageBRecoveryLock(scope, false, (local) => {
    try {
      const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
      if (!isRecord(parsed) || !sameScope(parsed.scope, scope) || parsed.claimId !== claimId || parsed.state !== "reserved" || parsed.recoveryHash !== undefined) return false;
      local.removeItem(key(scope));
      return true;
    } catch {
      return false;
    }
  });
}

export async function clearStageBRecovery(scope: StageBRecoveryScope, hash: string): Promise<boolean> {
  return withStageBRecoveryLock(scope, false, (local) => {
    try {
      const parsed: unknown = JSON.parse(local.getItem(key(scope)) ?? "null");
      if (!isKnownRecord(parsed) || !sameScope(parsed.scope, scope) || parsed.hash !== hash) return false;
      local.removeItem(key(scope));
      return true;
    } catch {
      return false;
    }
  });
}
