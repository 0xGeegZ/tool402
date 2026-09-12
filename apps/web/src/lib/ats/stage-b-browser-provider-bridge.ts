import { isAddress } from "viem";

import { STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH } from "./stage-b-ats-create-canonical-identity.ts";
import { createStageBAtsCreateExecutionProjection } from "./stage-b-ats-create-execution-projection.ts";
import {
  buildFactoryDeployBondRequest,
  decodeBondDeployed,
  encodeFactoryDeployBond,
  normalizeHederaCandidateTransactionId,
} from "./factory-deploy-bond.ts";

const chainId = "0x128";
const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const factory = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const mirrorBase = "https://testnet.mirrornode.hedera.com/api/v1/";
const expectedHash = STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH;
const timestampPattern = /^(?:0|[1-9][0-9]{0,9})\.[0-9]{9}$/u;
const transactionHashPattern = /^0x[0-9a-f]{64}$/u;
const bodyCapBytes = 1024 * 1024;
const receiptObservations = 5;
const mirrorCycles = 3;
const receiptObservationLimitMilliseconds = 5000;
const receiptObservationWaitMilliseconds = 1000;
const mirrorObservationLimitMilliseconds = 5000;
const mirrorObservationWaitMilliseconds = 2000;

export interface StageBEip1193Provider {
  request(input: { readonly method: string; readonly params?: readonly unknown[] }): Promise<unknown>;
}

export interface StageBDeadlineTimers {
  readonly set: (callback: () => void, milliseconds: number) => unknown;
  readonly clear: (timer: unknown) => void;
}

export type StageBCandidate = Readonly<{
  transactionId: string;
  evmAddress: string;
}>;

export type StageBBridgeOutcome =
  | Readonly<{ kind: "rejected" }>
  | Readonly<{ kind: "submission_unknown"; transactionHash?: string }>
  | Readonly<{ kind: "candidate"; candidate: StageBCandidate }>;

export interface StageBBridgeInput {
  readonly provider: StageBEip1193Provider;
  readonly fetch: (input: string, init: RequestInit) => Promise<unknown>;
  readonly wait?: (milliseconds: number) => Promise<void>;
  readonly now?: () => number;
  readonly timers?: StageBDeadlineTimers;
}

type MirrorRead<T> = Readonly<{ kind: "pending" }> | Readonly<{ kind: "value"; value: T }> | Readonly<{ kind: "invalid" }>;

const deadlineElapsed = Symbol("stage b deadline elapsed");
const abortedRead = Symbol("stage b aborted read");
const defaultTimers: StageBDeadlineTimers = Object.freeze({
  set(callback: () => void, milliseconds: number): unknown {
    return setTimeout(callback, milliseconds);
  },
  clear(timer: unknown): void {
    clearTimeout(timer as ReturnType<typeof setTimeout>);
  },
});

function unknownOutcome(transactionHash?: string): StageBBridgeOutcome {
  return Object.freeze({ kind: "submission_unknown", ...(transactionHash === undefined ? {} : { transactionHash }) });
}

function rejectedOutcome(): StageBBridgeOutcome {
  return Object.freeze({ kind: "rejected" });
}

function canonicalAddress(value: unknown): string | null {
  return typeof value === "string" && isAddress(value) ? value.toLowerCase() : null;
}

const issuerMirrorAddress = "0x00000000000000000000000000000000009f29a7";

function isIssuerAddress(value: unknown): boolean {
  const address = canonicalAddress(value);
  return address === issuer || address === issuerMirrorAddress;
}

function hasExactlyOneIssuerAccount(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  let issuerCount = 0;
  for (const account of value) {
    const address = canonicalAddress(account);
    if (address === null) return false;
    if (address === issuer) issuerCount += 1;
  }
  return issuerCount === 1;
}

export function isCanonicalStageBTransactionHash(value: unknown): value is string {
  return typeof value === "string" && transactionHashPattern.test(value);
}

function canonicalTransactionHash(value: unknown): string | null {
  return isCanonicalStageBTransactionHash(value) ? value : null;
}

function exactRecord(value: unknown): Record<string, unknown> | null {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
      return null;
    }
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

function captureOwnEnumerableDataFields(value: unknown, fields: readonly string[]): readonly unknown[] | null {
  const record = exactRecord(value);
  if (record === null) return null;
  try {
    const values: unknown[] = [];
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(record, field);
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return null;
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return null;
  }
}

function captureOwnArrayValues(value: unknown): readonly unknown[] | null {
  if (!Array.isArray(value)) return null;
  try {
    if (Object.getPrototypeOf(value) !== Array.prototype) return null;
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (
      lengthDescriptor === undefined ||
      !Object.hasOwn(lengthDescriptor, "value") ||
      typeof lengthDescriptor.value !== "number" ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return null;
    }
    const values: unknown[] = [];
    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value") ||
        Object.hasOwn(descriptor, "get") ||
        Object.hasOwn(descriptor, "set")
      ) {
        return null;
      }
      values.push(descriptor.value);
    }
    return values;
  } catch {
    return null;
  }
}

function defaultWait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function remainingMilliseconds(deadline: number, now: () => number): number | null {
  const current = now();
  if (!Number.isFinite(current)) return null;
  return deadline - current;
}

function deadlineFrom(now: () => number, limitMilliseconds: number): number | null {
  const current = now();
  return Number.isFinite(current) ? current + limitMilliseconds : null;
}

async function waitWithinDeadline(
  wait: (milliseconds: number) => Promise<void>,
  now: () => number,
  deadline: number,
  preferredMilliseconds: number,
): Promise<boolean> {
  const remaining = remainingMilliseconds(deadline, now);
  if (remaining === null || remaining <= 0) return false;
  await wait(Math.min(preferredMilliseconds, remaining));
  return true;
}

async function settleBeforeDeadline<T>(
  operation: Promise<T>,
  deadline: number,
  now: () => number,
  timers: StageBDeadlineTimers,
): Promise<T | typeof deadlineElapsed> {
  const remaining = remainingMilliseconds(deadline, now);
  if (remaining === null || remaining <= 0) return deadlineElapsed;
  let timer: unknown;
  const elapsed = new Promise<typeof deadlineElapsed>((resolve) => {
    timer = timers.set(() => resolve(deadlineElapsed), remaining);
  });
  try {
    return await Promise.race([operation, elapsed]);
  } finally {
    try {
      timers.clear(timer);
    } catch {
      // A timer that cannot be cleared cannot make a completed operation succeed.
    }
  }
}

async function settleBeforeAbort<T>(operation: Promise<T>, deadline: AbortSignal): Promise<T | typeof abortedRead> {
  if (deadline.aborted) return abortedRead;
  let removeAbortListener = () => {};
  const aborted = new Promise<typeof abortedRead>((resolve) => {
    const onAbort = () => resolve(abortedRead);
    deadline.addEventListener("abort", onAbort, { once: true });
    removeAbortListener = () => deadline.removeEventListener("abort", onAbort);
  });
  try {
    return await Promise.race([operation, aborted]);
  } finally {
    removeAbortListener();
  }
}

function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
  try {
    void reader.cancel().catch(() => undefined);
  } catch {
    // Cancellation is best-effort after an aborted or invalid read.
  }
}

async function readBoundedJson(body: unknown, deadline: AbortSignal): Promise<unknown | null> {
  if (body === null || typeof body !== "object") return null;
  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    const getReader = (body as { readonly getReader?: unknown }).getReader;
    if (typeof getReader !== "function") return null;
    reader = (body as ReadableStream<Uint8Array>).getReader();
  } catch {
    return null;
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    for (;;) {
      const read = await settleBeforeAbort(reader.read(), deadline);
      if (read === abortedRead) {
        cancelReader(reader);
        return null;
      }
      if (read.done) break;
      if (!(read.value instanceof Uint8Array) || read.value.byteLength > bodyCapBytes - byteLength) {
        cancelReader(reader);
        return null;
      }
      byteLength += read.value.byteLength;
      chunks.push(read.value);
    }
  } catch {
    cancelReader(reader);
    return null;
  }

  if (deadline.aborted) return null;
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return deadline.aborted ? null : parsed;
  } catch {
    return null;
  }
}

function isExplicitUserRejection(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  try {
    return (error as { readonly code?: unknown }).code === 4001;
  } catch {
    return false;
  }
}

function eligibleFactoryLog(value: unknown): { readonly data: `0x${string}`; readonly topics: readonly `0x${string}`[] } | null {
  const fields = captureOwnEnumerableDataFields(value, ["address", "data", "topics"]);
  if (fields === null) return null;
  const [address, data, topics] = fields;
  const topicValues = captureOwnArrayValues(topics);
  if (canonicalAddress(address) !== factory || typeof data !== "string" || topicValues === null) {
    return null;
  }
  if (!data.startsWith("0x") || topicValues.some((topic) => typeof topic !== "string" || !topic.startsWith("0x"))) {
    return null;
  }
  return Object.freeze({
    data: data as `0x${string}`,
    topics: Object.freeze([...topicValues] as `0x${string}`[]),
  });
}

function hasFixedFactoryEmitter(value: unknown): boolean {
  const fields = captureOwnEnumerableDataFields(value, ["address"]);
  return fields !== null && canonicalAddress(fields[0]) === factory;
}

function decodeSingleFactoryEvent(logs: unknown): string | null {
  const values = captureOwnArrayValues(logs);
  if (values === null) return null;
  let factoryLog: { readonly data: `0x${string}`; readonly topics: readonly `0x${string}`[] } | null = null;
  for (const value of values) {
    if (!hasFixedFactoryEmitter(value)) continue;
    const log = eligibleFactoryLog(value);
    if (log === null || factoryLog !== null) return null;
    factoryLog = log;
  }
  if (factoryLog === null) return null;
  try {
    return decodeBondDeployed(factoryLog).evmAddress;
  } catch {
    return null;
  }
}

function eligibleContractResult(value: unknown, transactionHash: string, expectedTimestamp?: string): { readonly timestamp: string; readonly evmAddress: string } | null {
  const fields = captureOwnEnumerableDataFields(
    value,
    ["hash", "chain_id", "result", "status", "from", "to", "timestamp", "logs"],
  );
  if (fields === null) return null;
  const [hash, resultChainId, resultValue, status, from, to, timestamp, logs] = fields;
  if (
    hash !== transactionHash ||
    resultChainId !== chainId ||
    resultValue !== "SUCCESS" ||
    status !== "0x1" ||
    !isIssuerAddress(from) ||
    canonicalAddress(to) !== factory ||
    typeof timestamp !== "string" ||
    !timestampPattern.test(timestamp) ||
    (expectedTimestamp !== undefined && timestamp !== expectedTimestamp)
  ) {
    return null;
  }
  const evmAddress = decodeSingleFactoryEvent(logs);
  return evmAddress === null ? null : Object.freeze({ timestamp, evmAddress });
}

async function responseJson(
  fetcher: StageBBridgeInput["fetch"],
  url: URL,
  deadline: number,
  now: () => number,
  timers: StageBDeadlineTimers,
): Promise<MirrorRead<unknown>> {
  const remaining = remainingMilliseconds(deadline, now);
  if (remaining === null || remaining <= 0) return Object.freeze({ kind: "invalid" });
  const abortController = new AbortController();
  let timeout: unknown;
  try {
    timeout = timers.set(() => abortController.abort(), remaining);
    let response: unknown;
    try {
      response = await settleBeforeAbort(
        Promise.resolve().then(() => fetcher(url.toString(), {
          method: "GET",
          credentials: "omit",
          redirect: "error",
          cache: "no-store",
          signal: abortController.signal,
        })),
        abortController.signal,
      );
    } catch {
      return Object.freeze({ kind: "invalid" });
    }
    const afterResponse = remainingMilliseconds(deadline, now);
    if (response === abortedRead || abortController.signal.aborted || afterResponse === null || afterResponse <= 0) {
      return Object.freeze({ kind: "invalid" });
    }
    if (response === null || typeof response !== "object") return Object.freeze({ kind: "invalid" });
    const responseValue = response as { status?: unknown; headers?: unknown; body?: unknown };
    if (typeof responseValue.status !== "number") return Object.freeze({ kind: "invalid" });
    if (responseValue.status === 404) return Object.freeze({ kind: "pending" });
    if (responseValue.status !== 200) return Object.freeze({ kind: "invalid" });
    const headers = responseValue.headers as { get?: unknown } | undefined;
    const contentType = typeof headers?.get === "function" ? headers.get("content-type") : null;
    if (typeof contentType !== "string" || !contentType.toLowerCase().startsWith("application/json")) {
      return Object.freeze({ kind: "invalid" });
    }
    const value = await readBoundedJson(responseValue.body, abortController.signal);
    const afterBody = remainingMilliseconds(deadline, now);
    if (value === null || abortController.signal.aborted || afterBody === null || afterBody <= 0) {
      return Object.freeze({ kind: "invalid" });
    }
    return Object.freeze({ kind: "value", value });
  } catch {
    return Object.freeze({ kind: "invalid" });
  } finally {
    try {
      timers.clear(timeout);
    } catch {
      // The single deadline has already made this read fail closed when needed.
    }
  }
}

function contractResultUrl(identifier: string): URL {
  const url = new URL(`contracts/results/${identifier}`, mirrorBase);
  url.searchParams.set("nonce", "0");
  return url;
}

function transactionListUrl(at: string): URL {
  const url = new URL("transactions", mirrorBase);
  url.searchParams.set("account.id", "0.0.10430887");
  url.searchParams.set("timestamp", `eq:${at}`);
  url.searchParams.set("transactiontype", "ETHEREUMTRANSACTION");
  url.searchParams.set("limit", "100");
  url.searchParams.set("order", "asc");
  return url;
}

function listedTransactionId(value: unknown, expectedTimestamp: string): string | null | undefined {
  const envelope = captureOwnEnumerableDataFields(value, ["transactions"]);
  if (envelope === null) return undefined;
  const transactions = captureOwnArrayValues(envelope[0]);
  if (transactions === null) return undefined;
  if (transactions.length === 0) return null;
  if (transactions.length !== 1) return undefined;
  const fields = captureOwnEnumerableDataFields(
    transactions[0],
    ["name", "result", "nonce", "consensus_timestamp", "transaction_id"],
  );
  if (fields === null) return undefined;
  const [name, result, nonce, consensusTimestamp, transactionId] = fields;
  if (
    name !== "ETHEREUMTRANSACTION" ||
    result !== "SUCCESS" ||
    nonce !== 0 ||
    consensusTimestamp !== expectedTimestamp ||
    typeof transactionId !== "string"
  ) return undefined;
  return transactionId;
}

async function resolveMirrorCandidate(
  fetcher: StageBBridgeInput["fetch"],
  wait: (milliseconds: number) => Promise<void>,
  now: () => number,
  timers: StageBDeadlineTimers,
  transactionHash: string,
  expectedReceiptAddress?: string,
): Promise<StageBCandidate | null> {
  const deadline = deadlineFrom(now, mirrorObservationLimitMilliseconds);
  if (deadline === null) return null;
  for (let cycle = 0; cycle < mirrorCycles; cycle += 1) {
    const first = await responseJson(fetcher, contractResultUrl(transactionHash), deadline, now, timers);
    if (first.kind === "pending") {
      if (cycle + 1 < mirrorCycles && await waitWithinDeadline(wait, now, deadline, mirrorObservationWaitMilliseconds)) continue;
      return null;
    }
    if (first.kind !== "value") return null;
    const firstResult = eligibleContractResult(first.value, transactionHash);
    if (firstResult === null) return null;
    const receiptAddress = expectedReceiptAddress ?? firstResult.evmAddress;
    if (firstResult.evmAddress !== receiptAddress) return null;

    const transactions = await responseJson(fetcher, transactionListUrl(firstResult.timestamp), deadline, now, timers);
    if (transactions.kind === "pending") return null;
    if (transactions.kind !== "value") return null;
    const rawTransactionId = listedTransactionId(transactions.value, firstResult.timestamp);
    if (rawTransactionId === null) {
      if (cycle + 1 < mirrorCycles && await waitWithinDeadline(wait, now, deadline, mirrorObservationWaitMilliseconds)) continue;
      return null;
    }
    if (rawTransactionId === undefined) return null;
    const validatedWireTransactionId = rawTransactionId;
    let normalizedTransactionId: string;
    try {
      normalizedTransactionId = normalizeHederaCandidateTransactionId(validatedWireTransactionId);
    } catch {
      return null;
    }

    const final = await responseJson(fetcher, contractResultUrl(validatedWireTransactionId), deadline, now, timers);
    if (final.kind === "pending") {
      if (cycle + 1 < mirrorCycles && await waitWithinDeadline(wait, now, deadline, mirrorObservationWaitMilliseconds)) continue;
      return null;
    }
    if (final.kind !== "value") return null;
    const finalResult = eligibleContractResult(final.value, transactionHash, firstResult.timestamp);
    if (finalResult === null || finalResult.evmAddress !== receiptAddress) return null;
    return Object.freeze({ transactionId: normalizedTransactionId, evmAddress: receiptAddress });
  }
  return null;
}

export function createStageBBrowserProviderBridge(input: StageBBridgeInput) {
  const { provider, fetch: fetcher, wait = defaultWait, now = Date.now, timers = defaultTimers } = input;
  let inFlight = false;
  let recoveryInFlight = false;
  let terminal: StageBBridgeOutcome | null = null;

  async function recover(transactionHash: string): Promise<StageBBridgeOutcome> {
    if (!isCanonicalStageBTransactionHash(transactionHash) || recoveryInFlight) return unknownOutcome();
    recoveryInFlight = true;
    try {
      const candidate = await resolveMirrorCandidate(fetcher, wait, now, timers, transactionHash);
      return candidate === null ? unknownOutcome(transactionHash) : Object.freeze({ kind: "candidate", candidate });
    } catch {
      return unknownOutcome(transactionHash);
    } finally {
      recoveryInFlight = false;
    }
  }

  async function execute(): Promise<StageBBridgeOutcome> {
    if (terminal !== null) return terminal;
    if (inFlight) return unknownOutcome();
    inFlight = true;
    let transactionHash: string | null = null;
    try {
      if (await provider.request({ method: "eth_chainId" }) !== chainId) return rejectedOutcome();
      const accounts = await provider.request({ method: "eth_accounts" });
      if (!hasExactlyOneIssuerAccount(accounts)) return rejectedOutcome();

      const projection = createStageBAtsCreateExecutionProjection();
      if (
        projection.issuerEvmAddress !== issuer ||
        projection.mirrorNodeBaseUrl !== mirrorBase ||
        projection.configuration.canonicalParametersHash !== expectedHash
      ) return rejectedOutcome();
      const request = buildFactoryDeployBondRequest(projection.configuration, { issuerEvmAddress: projection.issuerEvmAddress });
      const data = encodeFactoryDeployBond(request);
      let returnedHash: unknown;
      try {
        returnedHash = await provider.request({
          method: "eth_sendTransaction",
          params: [{ from: issuer, to: factory, data, value: "0x0" }],
        });
      } catch (error) {
        if (isExplicitUserRejection(error)) return rejectedOutcome();
        terminal = unknownOutcome();
        return terminal;
      }
      const hash = canonicalTransactionHash(returnedHash);
      if (hash === null) {
        terminal = unknownOutcome();
        return terminal;
      }
      transactionHash = hash;

      let receiptAddress: string | null = null;
      const receiptDeadline = deadlineFrom(now, receiptObservationLimitMilliseconds);
      if (receiptDeadline === null) {
        terminal = unknownOutcome(transactionHash);
        return terminal;
      }
      for (let observation = 0; observation < receiptObservations; observation += 1) {
        const remaining = remainingMilliseconds(receiptDeadline, now);
        if (remaining === null || remaining <= 0) break;
        const receipt = await settleBeforeDeadline(
          Promise.resolve().then(() => provider.request({ method: "eth_getTransactionReceipt", params: [hash] })),
          receiptDeadline,
          now,
          timers,
        );
        const afterReceipt = remainingMilliseconds(receiptDeadline, now);
        if (receipt === deadlineElapsed || afterReceipt === null || afterReceipt <= 0) break;
        const record = exactRecord(receipt);
        if (record !== null) {
          const fields = captureOwnEnumerableDataFields(record, ["transactionHash", "status", "to", "logs"]);
          if (fields === null) break;
          const [receiptHash, status, to, logs] = fields;
          if (receiptHash !== hash || status !== "0x1" || canonicalAddress(to) !== factory) break;
          receiptAddress = decodeSingleFactoryEvent(logs);
          break;
        }
        if (observation + 1 < receiptObservations) {
          const canObserveAgain = await waitWithinDeadline(wait, now, receiptDeadline, receiptObservationWaitMilliseconds);
          if (!canObserveAgain) break;
        }
      }
      if (receiptAddress === null) {
        terminal = unknownOutcome(transactionHash);
        return terminal;
      }
      const candidate = await resolveMirrorCandidate(fetcher, wait, now, timers, hash, receiptAddress);
      terminal = candidate === null ? unknownOutcome(transactionHash) : Object.freeze({ kind: "candidate", candidate });
      return terminal;
    } catch {
      if (transactionHash !== null) {
        terminal = unknownOutcome(transactionHash);
        return terminal;
      }
      return rejectedOutcome();
    } finally {
      inFlight = false;
    }
  }

  return Object.freeze({ execute, recover });
}
