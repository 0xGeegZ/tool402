import {
  parseAgentDirectoryRecordCandidate,
  type AgentDirectoryRecordCandidate,
} from "@tool402/core";

export type ActiveDirectoryView =
  | { readonly state: "no_active_version" }
  | {
      readonly state: "active_version";
      readonly directoryVersion: number;
      readonly record: AgentDirectoryRecordCandidate;
    };

export type ActiveDirectoryFetcher = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

const activeDirectoryView = "active-directory-version";
const activeDirectoryEnvironmentKey = "TOOL402_CONVEX_SITE_URL";
const activeDirectoryPath = "/public/directory/riskscan/active";
const activeDirectoryTimeoutMilliseconds = 2_000;
const maximumResponseBytes = 16_384;
const projectionFields = ["outcome", "record", "directoryVersion"] as const;
const jsonContentType = /^application\/json(?:;|$)/iu;
const abortedRead = Symbol("aborted active Directory read");

const noActiveVersion: ActiveDirectoryView = Object.freeze({
  state: "no_active_version",
});

function noActiveDirectoryVersion(): ActiveDirectoryView {
  return noActiveVersion;
}

function captureProjection(input: unknown): readonly unknown[] | null {
  if (input === null || typeof input !== "object") {
    return null;
  }

  try {
    if (Object.getPrototypeOf(input) !== Object.prototype) {
      return null;
    }

    const keys = Reflect.ownKeys(input);
    if (
      keys.length !== projectionFields.length ||
      keys.some((key) => typeof key !== "string" || !projectionFields.includes(key as never))
    ) {
      return null;
    }

    const values: unknown[] = [];
    for (const field of projectionFields) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
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

async function cancelResponse(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The body can already be closed or locked by a completed read.
  }
}

async function cancelReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // Cancellation is best-effort after a deadline or bounded-read failure.
  }
}

async function settleBeforeDeadline<T>(
  operation: Promise<T>,
  deadline: AbortSignal,
): Promise<T | typeof abortedRead> {
  if (deadline.aborted) {
    return abortedRead;
  }

  let removeAbortListener = () => {};
  const abort = new Promise<typeof abortedRead>((resolve) => {
    const onAbort = () => resolve(abortedRead);
    deadline.addEventListener("abort", onAbort, { once: true });
    removeAbortListener = () => deadline.removeEventListener("abort", onAbort);
  });

  try {
    return await Promise.race([operation, abort]);
  } finally {
    removeAbortListener();
  }
}

async function readBoundedJson(
  response: Response,
  deadline: AbortSignal,
): Promise<unknown | null> {
  const stream = response.body;
  if (stream === null) {
    return null;
  }

  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    reader = stream.getReader();
  } catch {
    await cancelResponse(response);
    return null;
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    for (;;) {
      const read = await settleBeforeDeadline(reader.read(), deadline);
      if (read === abortedRead) {
        await cancelReader(reader);
        return null;
      }
      if (read.done) {
        break;
      }
      if (!(read.value instanceof Uint8Array)) {
        await cancelReader(reader);
        return null;
      }

      byteLength += read.value.byteLength;
      if (byteLength > maximumResponseBytes) {
        await cancelReader(reader);
        return null;
      }
      chunks.push(read.value);
    }
  } catch {
    await cancelReader(reader);
    return null;
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
}

export function activeDirectoryViewRequested(request: Request): boolean {
  try {
    return new URL(request.url).search === `?view=${activeDirectoryView}`;
  } catch {
    return false;
  }
}

export function activeDirectorySource(environment: NodeJS.ProcessEnv): URL | null {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(
      environment,
      activeDirectoryEnvironmentKey,
    );
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      Object.hasOwn(descriptor, "get") ||
      Object.hasOwn(descriptor, "set") ||
      typeof descriptor.value !== "string"
    ) {
      return null;
    }

    const source = new URL(descriptor.value.trim());
    if (
      source.protocol !== "https:" ||
      source.hostname.length === 0 ||
      source.username !== "" ||
      source.password !== "" ||
      source.pathname !== "/" ||
      source.search !== "" ||
      source.hash !== ""
    ) {
      return null;
    }

    return new URL(activeDirectoryPath, source);
  } catch {
    return null;
  }
}

export function parseActiveDirectoryProjection(input: unknown): ActiveDirectoryView {
  const projection = captureProjection(input);
  if (projection === null) {
    return noActiveDirectoryVersion();
  }

  const [outcome, recordInput, directoryVersion] = projection;
  if (
    outcome !== "FOUND" ||
    typeof directoryVersion !== "number" ||
    !Number.isSafeInteger(directoryVersion) ||
    directoryVersion < 1
  ) {
    return noActiveDirectoryVersion();
  }

  try {
    const record = parseAgentDirectoryRecordCandidate(recordInput);
    return Object.freeze({
      state: "active_version",
      directoryVersion,
      record,
    });
  } catch {
    return noActiveDirectoryVersion();
  }
}

export async function readActiveDirectoryVersion(
  environment: NodeJS.ProcessEnv,
  fetcher: ActiveDirectoryFetcher,
): Promise<ActiveDirectoryView> {
  const source = activeDirectorySource(environment);
  if (source === null || typeof fetcher !== "function") {
    return noActiveDirectoryVersion();
  }

  try {
    const deadline = AbortSignal.timeout(activeDirectoryTimeoutMilliseconds);
    const pendingResponse = Promise.resolve().then(() =>
      fetcher(source, {
        method: "GET",
        headers: { accept: "application/json" },
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
        signal: deadline,
      }),
    );
    const response = await settleBeforeDeadline(pendingResponse, deadline);
    if (response === abortedRead) {
      void pendingResponse.then(cancelResponse, () => undefined);
      return noActiveDirectoryVersion();
    }
    if (!(response instanceof Response)) {
      return noActiveDirectoryVersion();
    }
    if (response.status !== 200) {
      await cancelResponse(response);
      return noActiveDirectoryVersion();
    }
    if (!jsonContentType.test(response.headers.get("content-type") ?? "")) {
      await cancelResponse(response);
      return noActiveDirectoryVersion();
    }

    const body = await readBoundedJson(response, deadline);
    return body === null
      ? noActiveDirectoryVersion()
      : parseActiveDirectoryProjection(body);
  } catch {
    return noActiveDirectoryVersion();
  }
}
