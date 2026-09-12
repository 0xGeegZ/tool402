import { parseAgentDirectoryRecordCandidate } from "@tool402/core";
import {
  makeFunctionReference,
  type GenericActionCtx,
  type GenericDataModel,
} from "convex/server";
import { claimProtectedBody } from "../src/ingress/claimed-protected-body.ts";
import type { ResolveProtectedIngressKey } from "../src/ingress/protected-ingress-verifier.ts";
import type { TryClaimProtectedReplay } from "../src/ingress/protected-replay-claim.ts";
import {
  normalizeClaimedWalletCommand,
} from "../src/ingress/authenticated-wallet-command-normalizer.ts";
import type {
  ResolveWalletCommandAuthorities,
} from "../src/ingress/authenticated-wallet-command-normalizer.ts";
import type {
  CommandAuthorityRecord,
} from "../src/ingress/authenticated-external-prepare-normalizer.ts";

const maximumBodyBytes = 65_536;
const maximumInt64 = 9_223_372_036_854_775_807n;
const publicIdPattern = /^[A-Za-z0-9_-]{1,96}$/u;
const ingressKeyIdPattern = /^[A-Za-z0-9_-]{1,64}$/u;
const canonicalAddressPattern = /^0x[0-9a-f]{40}$/u;
const canonicalAttemptPublicIdPattern = /^[A-Za-z0-9_-]{21}[AQgw]$/u;
const ingressHeaders = [
  ["x-tool402-key-id", "keyId"],
  ["x-tool402-timestamp", "timestampUnixSeconds"],
  ["x-tool402-nonce", "requestNonce"],
  ["x-tool402-content-sha256", "bodySha256"],
  ["x-tool402-signature", "signature"],
] as const;

type ActionContext = GenericActionCtx<GenericDataModel>;
type WriteOutcome =
  | { readonly outcome: "ACCEPTED"; readonly publicId: string }
  | { readonly outcome: "REPLAYED"; readonly publicId: string }
  | { readonly outcome: "CONFLICT"; readonly publicId: string }
  | { readonly outcome: "REJECTED" }
  | { readonly outcome: "UNSUPPORTED_TYPE" };
type IngressSeams = {
  readonly resolveIngressKey: ResolveProtectedIngressKey;
  readonly tryClaimReplay: TryClaimProtectedReplay;
  readonly resolveCommandAuthorities: ResolveWalletCommandAuthorities;
  readonly serverNowMilliseconds: () => number;
};
type NormalizedCommand = Exclude<
  Awaited<ReturnType<typeof normalizeClaimedWalletCommand>>,
  null
>;
type DispatchEntry = {
  readonly enabled: boolean;
  readonly dispatch?: (ctx: ActionContext, command: NormalizedCommand) => Promise<Response>;
};
type PreparedIngress = {
  readonly envelope: Record<string, string>;
  readonly rawBody: Uint8Array;
  readonly serverNow: {
    readonly text: string;
    readonly unixSeconds: bigint;
  };
};

const claimIngressReplayReference = makeFunctionReference<"mutation">(
  "wallet_command_replay:claimIngressReplayIdentity",
);
const readCommandAuthoritiesReference = makeFunctionReference<"query">(
  "wallet_command_replay:readCommandAuthorities",
);
const admitExternalPrepareReference = makeFunctionReference<"mutation">(
  "external_prepare_command_admission:admitExternalPrepareCommand",
);
const admitAtsCreateReference = makeFunctionReference<"mutation">(
  "external_prepare_command_admission:admitAtsCreateAndMarkAssetPending",
);
const admitOfferingCreateReference = makeFunctionReference<"mutation">(
  "offerings:admitOfferingCreate",
);
const admitDirectoryPublishReference = makeFunctionReference<"mutation">(
  "directory_versions:admitDirectoryPublish",
);
const attachAtsCandidateReceiptReference = makeFunctionReference<"mutation">(
  "ats_candidate_receipts:attachAtsCandidateReceipt",
);
const verifyAtsCandidateReceiptReference = makeFunctionReference<"action">(
  "ats_receipt_verification:verifyAtsCandidateReceipt",
);
const getOfferingProjectionReference = makeFunctionReference<"query">(
  "offerings:getPublicProjection",
);
const getActiveDirectoryReference = makeFunctionReference<"query">(
  "directory_versions:getActive",
);
const commandDispatch: Readonly<Record<NormalizedCommand["type"], DispatchEntry>> = Object.freeze({
  "external.prepare": Object.freeze({
    enabled: true,
    dispatch: async (ctx: ActionContext, command: NormalizedCommand) => {
      if (command.type !== "external.prepare") return rejected();
      const mutation = command.payload.operationKind === "ATS_CREATE"
        ? admitAtsCreateReference
        : admitExternalPrepareReference;
      const result = await ctx.runMutation(mutation, serializedCommand(command));
      return mapAdmissionResult(result, command.payload.idempotencyKey);
    },
  }),
  "offering.create": Object.freeze({
    enabled: true,
    dispatch: async (ctx: ActionContext, command: NormalizedCommand) => {
      if (command.type !== "offering.create") return rejected();
      const result = await ctx.runMutation(admitOfferingCreateReference, serializedCommand(command));
      return mapAdmissionResult(result, command.payload.offeringPublicId);
    },
  }),
  "directory.publish": Object.freeze({
    enabled: true,
    dispatch: async (ctx: ActionContext, command: NormalizedCommand) => {
      if (command.type !== "directory.publish") return rejected();
      const result = await ctx.runMutation(admitDirectoryPublishReference, serializedCommand(command));
      return mapAdmissionResult(result, command.payload.offeringPublicId);
    },
  }),
  "external.attachCandidate": Object.freeze({
    enabled: true,
    dispatch: async (ctx: ActionContext, command: NormalizedCommand) => {
      if (command.type !== "external.attachCandidate") return rejected();
      const result = await ctx.runMutation(attachAtsCandidateReceiptReference, {
        attemptPublicId: command.payload.attemptPublicId,
        operationKind: command.payload.operationKind,
        candidateTransactionId: command.payload.candidateTransactionId,
        candidateEvmAddress: command.payload.candidateEvmAddress,
        canonicalSignerAddress: command.canonicalSignerAddress,
        principalPublicId: command.principalPublicId,
        role: command.role,
        authorityVersion: command.authorityVersion,
        replayIdentity: command.replayIdentity,
      });
      const attachmentStatus = result !== null && typeof result === "object"
        ? Object.getOwnPropertyDescriptor(result, "status")?.value
        : undefined;
      if (attachmentStatus === "ATTACHED" || attachmentStatus === "ALREADY_ATTACHED") {
        const attemptId = Object.getOwnPropertyDescriptor(result, "attemptId")?.value;
        if (typeof attemptId === "string") {
          try {
            await ctx.scheduler.runAfter(0, verifyAtsCandidateReceiptReference, { attemptId });
          } catch {
            // A scheduling failure leaves the durable offering ASSET_PENDING. The
            // signed attachment response must not claim corroboration succeeded.
          }
        }
      }
      return mapAttachmentResult(result, command.payload.attemptPublicId);
    },
  }),
});

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, (_key, value) => (
    typeof value === "bigint" ? value.toString() : value
  )), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function rejected(): Response {
  return response({ outcome: "REJECTED" } satisfies WriteOutcome);
}

function rejectedBeforeRead(request: Request): Response {
  try {
    const cancellation = request.body?.cancel();
    void cancellation?.catch(() => undefined);
  } catch {
    // The response remains reason-free even when a caller's body cannot be cancelled.
  }
  return rejected();
}

function notFound(): Response {
  return response({ outcome: "NOT_FOUND" }, 404);
}

function unavailable(): Response {
  return response({ outcome: "UNAVAILABLE" }, 503);
}

function readIngressEnvelope(request: Request): Record<string, string> | null {
  try {
    const envelope: Record<string, string> = {};
    for (const [header, field] of ingressHeaders) {
      const value = request.headers.get(header);
      if (value === null || value.length === 0 || value.includes(",")) {
        return null;
      }
      envelope[field] = value;
    }
    return envelope;
  } catch {
    return null;
  }
}

async function readRawBody(request: Request): Promise<Uint8Array | null> {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength !== null && /^(?:0|[1-9][0-9]*)$/u.test(contentLength)
      && Number(contentLength) > maximumBodyBytes) {
      return null;
    }
    if (request.body === null) {
      return new Uint8Array();
    }

    const chunks: Uint8Array[] = [];
    const reader = request.body.getReader();
    let total = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total > maximumBodyBytes) {
          await reader.cancel();
          return null;
        }
        chunks.push(new Uint8Array(next.value));
      }
    } finally {
      reader.releaseLock();
    }

    const raw = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      raw.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return raw;
  } catch {
    return null;
  }
}

function readServerNow(milliseconds: number): { readonly text: string; readonly unixSeconds: bigint } | null {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
    return null;
  }
  try {
    const date = new Date(milliseconds);
    const text = date.toISOString();
    return {
      text,
      unixSeconds: BigInt(Math.floor(milliseconds / 1_000)),
    };
  } catch {
    return null;
  }
}

type SerializedCommand = Exclude<NormalizedCommand, { readonly type: "external.attachCandidate" }>;
type OfferingCreateCommand = Extract<NormalizedCommand, { readonly type: "offering.create" }>;

function serializedOfferingCreatePayload(payload: OfferingCreateCommand["payload"]) {
  return {
    schemaVersion: payload.schemaVersion,
    offeringPublicId: payload.offeringPublicId,
    offeringVersion: payload.offeringVersion,
    subjectPublicId: payload.subjectPublicId,
    definition: {
      schemaVersion: payload.definition.schemaVersion,
      terms: {
        version: payload.definition.terms.version,
        fundingTargetTinybars: payload.definition.terms.fundingTargetTinybars.toString(),
        noteUnitPriceTinybars: payload.definition.terms.noteUnitPriceTinybars.toString(),
        maximumNoteUnits: payload.definition.terms.maximumNoteUnits.toString(),
        minimumPurchaseUnits: payload.definition.terms.minimumPurchaseUnits.toString(),
        reserveShareBps: payload.definition.terms.reserveShareBps.toString(),
        issuerShareBps: payload.definition.terms.issuerShareBps.toString(),
        platformFeeBps: payload.definition.terms.platformFeeBps.toString(),
        payoutCapTinybars: payload.definition.terms.payoutCapTinybars.toString(),
      },
      maturityAt: payload.definition.maturityAt,
      qualifyingResource: payload.definition.qualifyingResource,
    },
    narrative: {
      title: payload.narrative.title,
      customerProblem: payload.narrative.customerProblem,
      customerUseCases: [...payload.narrative.customerUseCases],
      useOfFunds: [...payload.narrative.useOfFunds],
      risks: [...payload.narrative.risks],
    },
    advertisedQuickPriceTinybars: payload.advertisedQuickPriceTinybars.toString(),
    advertisedStandardPriceTinybars: payload.advertisedStandardPriceTinybars.toString(),
    idempotencyKey: payload.idempotencyKey,
    expiresAt: payload.expiresAt,
  };
}

function serializedCommand(command: SerializedCommand) {
  return {
    version: command.version,
    type: command.type,
    chainId: command.chainId,
    canonicalSignerAddress: command.canonicalSignerAddress,
    nonce: command.nonce,
    issuedAt: command.issuedAt,
    expiresAt: command.expiresAt,
    payloadHash: command.payloadHash,
    replayIdentity: command.replayIdentity,
    principalPublicId: command.principalPublicId,
    role: command.role,
    authorityVersion: command.authorityVersion,
    payload: command.type === "offering.create"
      ? serializedOfferingCreatePayload(command.payload)
      : command.payload,
  };
}

function mapAdmissionResult(result: unknown, publicId: string): Response {
  if (result === null || typeof result !== "object") return rejected();
  const status = Object.getOwnPropertyDescriptor(result, "status")?.value;
  if (status === "NEW") {
    return response({ outcome: "ACCEPTED", publicId } satisfies WriteOutcome);
  }
  if (status === "COMMAND_REPLAYED" || status === "IDEMPOTENCY_REPLAYED") {
    return response({ outcome: "REPLAYED", publicId } satisfies WriteOutcome);
  }
  if (status === "IDEMPOTENCY_CONFLICT") {
    return response({ outcome: "CONFLICT", publicId } satisfies WriteOutcome);
  }
  return rejected();
}

function mapAttachmentResult(result: unknown, publicId: string): Response {
  if (result === null || typeof result !== "object") return rejected();
  const status = Object.getOwnPropertyDescriptor(result, "status")?.value;
  if (status === "ATTACHED") {
    return response({ outcome: "ACCEPTED", publicId } satisfies WriteOutcome);
  }
  if (status === "ALREADY_ATTACHED" || status === "COMMAND_REPLAYED") {
    return response({ outcome: "REPLAYED", publicId } satisfies WriteOutcome);
  }
  return rejected();
}

async function dispatchNormalizedCommand(
  ctx: ActionContext,
  command: Awaited<ReturnType<typeof normalizeClaimedWalletCommand>>,
): Promise<Response> {
  if (command === null) return rejected();
  const entry = commandDispatch[command.type];
  if (!entry.enabled || entry.dispatch === undefined) {
    return response({ outcome: "UNSUPPORTED_TYPE" } satisfies WriteOutcome);
  }
  return entry.dispatch(ctx, command);
}

async function prepareIngress(
  request: Request,
  envelope: Record<string, string>,
  serverNowMilliseconds: () => number,
): Promise<PreparedIngress | null> {
  const rawBody = await readRawBody(request);
  if (rawBody === null) return null;
  const serverNow = readServerNow(serverNowMilliseconds());
  if (serverNow === null) return null;
  return { envelope, rawBody, serverNow };
}

async function claimAndDispatchIngress(
  ctx: ActionContext,
  ingress: PreparedIngress,
  seams: IngressSeams,
): Promise<Response> {
  try {
    const claimed = await claimProtectedBody(
      ingress.envelope,
      ingress.rawBody,
      ingress.serverNow.unixSeconds,
      seams.resolveIngressKey,
      seams.tryClaimReplay,
    );
    if (claimed === null) return rejected();
    const command = await normalizeClaimedWalletCommand(
      claimed,
      ingress.serverNow.text,
      seams.resolveCommandAuthorities,
    );
    return await dispatchNormalizedCommand(ctx, command);
  } catch {
    return rejected();
  }
}

async function handleIngress(
  ctx: ActionContext,
  request: Request,
  seams: IngressSeams,
): Promise<Response> {
  const envelope = readIngressEnvelope(request);
  if (envelope === null) return rejectedBeforeRead(request);
  try {
    const ingress = await prepareIngress(request, envelope, seams.serverNowMilliseconds);
    return ingress === null ? rejected() : await claimAndDispatchIngress(ctx, ingress, seams);
  } catch {
    return rejected();
  }
}

async function readProductionIngressKey(): Promise<{
  readonly keyId: string;
  readonly key: CryptoKey;
} | null> {
  try {
    const keyId = process.env.TOOL402_INGRESS_KEY_ID;
    const secret = process.env.TOOL402_INGRESS_SECRET;
    if (
      typeof keyId !== "string" || !ingressKeyIdPattern.test(keyId)
      || typeof secret !== "string" || !/^[0-9a-f]{64}$/u.test(secret)
      || globalThis.crypto?.subtle === undefined
    ) {
      return null;
    }
    const secretBytes = new Uint8Array(secret.length / 2);
    for (let index = 0; index < secretBytes.length; index += 1) {
      const value = Number.parseInt(secret.slice(index * 2, index * 2 + 2), 16);
      if (!Number.isInteger(value)) return null;
      secretBytes[index] = value;
    }
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return { keyId, key };
  } catch {
    return null;
  }
}

export async function handleCommandIngress(
  ctx: ActionContext,
  request: Request,
): Promise<Response> {
  const envelope = readIngressEnvelope(request);
  if (envelope === null) return rejectedBeforeRead(request);
  let ingress: PreparedIngress | null;
  try {
    ingress = await prepareIngress(request, envelope, () => Date.now());
  } catch {
    return rejected();
  }
  if (ingress === null) return rejected();
  const configured = await readProductionIngressKey();
  return claimAndDispatchIngress(ctx, ingress, {
    resolveIngressKey: (keyId) => (
      configured !== null && keyId === configured.keyId ? configured.key : undefined
    ),
    tryClaimReplay: (replayIdentity) => ctx.runMutation(
      claimIngressReplayReference,
      { replayIdentity },
    ),
    resolveCommandAuthorities: (chainId, canonicalSignerAddress, selection) => ctx.runQuery(
      readCommandAuthoritiesReference,
      { chainId, canonicalSignerAddress, ...(selection === undefined ? {} : { selection }) },
    ) as Promise<readonly CommandAuthorityRecord[]>,
    serverNowMilliseconds: () => Date.now(),
  });
}

export function handleCommandIngressForTest(
  ctx: ActionContext,
  request: Request,
  seams: IngressSeams,
): Promise<Response> {
  return handleIngress(ctx, request, seams);
}

function exactRecord(
  input: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> | null {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype) {
    return null;
  }
  const allowed = new Set([...required, ...optional]);
  const keys = Reflect.ownKeys(input);
  if (keys.some((key) => typeof key !== "string" || !allowed.has(key))
    || required.some((key) => !Object.hasOwn(input, key))) {
    return null;
  }
  const record: Record<string, unknown> = {};
  for (const key of keys) {
    if (typeof key !== "string") return null;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return null;
    record[key] = descriptor.value;
  }
  return record;
}

function capturePlainArray(input: unknown): readonly unknown[] | null {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) return null;
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(input, "length");
    if (
      lengthDescriptor === undefined
      || lengthDescriptor.enumerable !== false
      || lengthDescriptor.configurable !== false
      || !Object.hasOwn(lengthDescriptor, "value")
      || Object.hasOwn(lengthDescriptor, "get")
      || Object.hasOwn(lengthDescriptor, "set")
      || typeof lengthDescriptor.value !== "number"
      || !Number.isSafeInteger(lengthDescriptor.value)
      || lengthDescriptor.value < 0
    ) return null;

    const length = lengthDescriptor.value;
    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== length + 1
      || keys.some((key) => key !== "length" && (
        typeof key !== "string"
        || !/^(?:0|[1-9][0-9]*)$/u.test(key)
        || Number(key) >= length
      ))
    ) return null;

    const values: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
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
    return values;
  } catch {
    return null;
  }
}

function copyJson(value: unknown): unknown | null {
  try {
    if (typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) {
      const items = capturePlainArray(value);
      if (items === null) return null;
      const copy: unknown[] = [];
      for (const item of items) {
        const cloned = copyJson(item);
        if (cloned === null) return null;
        copy.push(cloned);
      }
      return copy;
    }
    if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
      return null;
    }
    const copy: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return null;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) return null;
      const cloned = copyJson(descriptor.value);
      if (cloned === null) return null;
      Object.defineProperty(copy, key, {
        configurable: true,
        enumerable: true,
        value: cloned,
        writable: true,
      });
    }
    return copy;
  } catch {
    return null;
  }
}

function int64(value: unknown): bigint | null {
  return typeof value === "bigint" && value >= 0n && value <= maximumInt64 ? value : null;
}

function stringArray(input: unknown): string[] | null {
  const items = capturePlainArray(input);
  if (items === null) return null;
  const values: string[] = [];
  for (const value of items) {
    if (typeof value !== "string") return null;
    values.push(value);
  }
  return values;
}

function offeringDefinition(input: unknown) {
  const definition = exactRecord(input, ["schemaVersion", "terms", "maturityAt", "qualifyingResource"]);
  const terms = definition === null ? null : exactRecord(definition.terms, [
    "version",
    "fundingTargetTinybars",
    "noteUnitPriceTinybars",
    "maximumNoteUnits",
    "minimumPurchaseUnits",
    "reserveShareBps",
    "issuerShareBps",
    "platformFeeBps",
    "payoutCapTinybars",
  ]);
  if (
    definition === null || terms === null
    || definition.schemaVersion !== 1
    || typeof definition.maturityAt !== "string"
    || typeof definition.qualifyingResource !== "string"
    || Object.values(terms).some((value) => typeof value !== "string")
  ) {
    return null;
  }
  return {
    schemaVersion: 1 as const,
    terms: {
      version: terms.version as string,
      fundingTargetTinybars: terms.fundingTargetTinybars as string,
      noteUnitPriceTinybars: terms.noteUnitPriceTinybars as string,
      maximumNoteUnits: terms.maximumNoteUnits as string,
      minimumPurchaseUnits: terms.minimumPurchaseUnits as string,
      reserveShareBps: terms.reserveShareBps as string,
      issuerShareBps: terms.issuerShareBps as string,
      platformFeeBps: terms.platformFeeBps as string,
      payoutCapTinybars: terms.payoutCapTinybars as string,
    },
    maturityAt: definition.maturityAt,
    qualifyingResource: definition.qualifyingResource,
  };
}

function offeringNarrative(input: unknown) {
  const narrative = exactRecord(input, [
    "title",
    "customerProblem",
    "customerUseCases",
    "useOfFunds",
    "risks",
  ]);
  if (
    narrative === null
    || typeof narrative.title !== "string"
    || typeof narrative.customerProblem !== "string"
  ) {
    return null;
  }
  const customerUseCases = stringArray(narrative.customerUseCases);
  const useOfFunds = stringArray(narrative.useOfFunds);
  const risks = stringArray(narrative.risks);
  if (customerUseCases === null || useOfFunds === null || risks === null) return null;
  return {
    title: narrative.title,
    customerProblem: narrative.customerProblem,
    customerUseCases,
    useOfFunds,
    risks,
  };
}

function offeringRecord(input: unknown) {
  const record = exactRecord(input, [
    "offeringPublicId",
    "version",
    "subjectPublicId",
    "state",
    "definition",
    "narrative",
    "advertisedQuickPriceTinybars",
    "advertisedStandardPriceTinybars",
    "canonicalSignerAddress",
    "acceptedAt",
    "updatedAt",
  ], ["atsAssetEvmAddress", "atsAttemptPublicId"]);
  if (
    record === null
    || typeof record.offeringPublicId !== "string" || !publicIdPattern.test(record.offeringPublicId)
    || typeof record.version !== "number" || !Number.isSafeInteger(record.version) || record.version < 1
    || typeof record.subjectPublicId !== "string" || !publicIdPattern.test(record.subjectPublicId)
    || !["DRAFT", "ASSET_PENDING", "READY", "OPEN", "CLOSED"].includes(record.state as string)
    || typeof record.advertisedQuickPriceTinybars !== "string"
    || typeof record.advertisedStandardPriceTinybars !== "string"
    || typeof record.canonicalSignerAddress !== "string" || !canonicalAddressPattern.test(record.canonicalSignerAddress)
    || (Object.hasOwn(record, "atsAssetEvmAddress")
      && (typeof record.atsAssetEvmAddress !== "string" || !canonicalAddressPattern.test(record.atsAssetEvmAddress)))
    || (Object.hasOwn(record, "atsAttemptPublicId")
      && (record.state !== "ASSET_PENDING"
        || typeof record.atsAttemptPublicId !== "string"
        || !canonicalAttemptPublicIdPattern.test(record.atsAttemptPublicId)))
  ) {
    return null;
  }
  const acceptedAt = int64(record.acceptedAt);
  const updatedAt = int64(record.updatedAt);
  const definition = offeringDefinition(record.definition);
  const narrative = offeringNarrative(record.narrative);
  if (acceptedAt === null || updatedAt === null || definition === null || narrative === null) {
    return null;
  }
  return {
    offeringPublicId: record.offeringPublicId,
    version: record.version,
    subjectPublicId: record.subjectPublicId,
    state: record.state,
    definition,
    narrative,
    advertisedQuickPriceTinybars: record.advertisedQuickPriceTinybars,
    advertisedStandardPriceTinybars: record.advertisedStandardPriceTinybars,
    canonicalSignerAddress: record.canonicalSignerAddress,
    ...(Object.hasOwn(record, "atsAssetEvmAddress")
      ? { atsAssetEvmAddress: record.atsAssetEvmAddress }
      : {}),
    ...(Object.hasOwn(record, "atsAttemptPublicId")
      ? { atsAttemptPublicId: record.atsAttemptPublicId }
      : {}),
    acceptedAt,
    updatedAt,
  };
}

function activeDirectoryRecord(input: unknown, serviceSlug: string) {
  const record = exactRecord(input, [
    "offeringPublicId",
    "offeringVersion",
    "directoryVersion",
    "serviceSlug",
    "record",
    "state",
    "acceptedAt",
  ]);
  if (
    record === null
    || record.serviceSlug !== serviceSlug
    || record.state !== "ACTIVE"
    || typeof record.offeringPublicId !== "string"
    || !publicIdPattern.test(record.offeringPublicId)
    || typeof record.offeringVersion !== "number" || !Number.isSafeInteger(record.offeringVersion) || record.offeringVersion < 1
    || typeof record.directoryVersion !== "number" || !Number.isSafeInteger(record.directoryVersion) || record.directoryVersion < 1
    || int64(record.acceptedAt) === null
  ) {
    return null;
  }
  const copied = copyJson(record.record);
  if (copied === null) return null;
  try {
    const parsed = parseAgentDirectoryRecordCandidate(copied);
    if (
      parsed.serviceSlug !== serviceSlug
      || parsed.offeringPublicId !== record.offeringPublicId
      || parsed.offeringVersion !== record.offeringVersion
    ) return null;
    return {
      directoryVersion: record.directoryVersion,
      record: {
        schemaVersion: parsed.schemaVersion,
        serviceId: parsed.serviceId,
        serviceSlug: parsed.serviceSlug,
        offeringPublicId: parsed.offeringPublicId,
        offeringVersion: parsed.offeringVersion,
        capabilities: [...parsed.capabilities],
        x402Endpoint: parsed.x402Endpoint,
        ...(parsed.webUrl === undefined ? {} : { webUrl: parsed.webUrl }),
        paymentProtocol: parsed.paymentProtocol,
        paymentNetwork: parsed.paymentNetwork,
        asset: parsed.asset,
        advertisedTiers: [...parsed.advertisedTiers],
        issuerRevenueAccount: parsed.issuerRevenueAccount,
        clearingAccount: parsed.clearingAccount,
        status: parsed.status,
        publishedAt: parsed.publishedAt,
      },
    };
  } catch {
    return null;
  }
}

export async function handleOfferingProjection(
  ctx: ActionContext,
  request: Request,
): Promise<Response> {
  let offeringPublicId: string | undefined;
  try {
    offeringPublicId = new URL(request.url).pathname.match(/^\/public\/offerings\/([A-Za-z0-9_-]{1,96})$/u)?.[1];
  } catch {
    return notFound();
  }
  if (offeringPublicId === undefined) return notFound();
  try {
    const result = await ctx.runQuery(getOfferingProjectionReference, { offeringPublicId });
    if (result === null) return notFound();
    const record = offeringRecord(result);
    return record === null ? unavailable() : response({ outcome: "FOUND", record });
  } catch {
    return unavailable();
  }
}

export async function handleActiveDirectory(
  ctx: ActionContext,
  request: Request,
): Promise<Response> {
  let serviceSlug: string | undefined;
  try {
    serviceSlug = new URL(request.url).pathname.match(/^\/public\/directory\/([A-Za-z0-9_-]{1,96})\/active$/u)?.[1];
  } catch {
    return notFound();
  }
  if (serviceSlug === undefined || (serviceSlug !== "riskscan" && !/^tool-[0-9a-f]{32}$/u.test(serviceSlug))) return notFound();
  try {
    const result = await ctx.runQuery(getActiveDirectoryReference, { serviceSlug });
    if (result === null) return notFound();
    const directory = activeDirectoryRecord(result, serviceSlug);
    return directory === null
      ? unavailable()
      : response({ outcome: "FOUND", record: directory.record, directoryVersion: directory.directoryVersion });
  } catch {
    return unavailable();
  }
}
