import { sha256Requirements } from "./requirements-offering-quote.ts";
import type { RequirementsDigest } from "./requirements-offering-quote.ts";

export interface PaidTaskInput {
  readonly taskRef: string;
  readonly offeringVersion: string;
  readonly requirements: unknown;
  readonly expiresAt: string;
}

export interface PaidTaskSnapshot {
  readonly taskRef: string;
  readonly offeringVersion: string;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export type PaidTaskQuoted = PaidTaskSnapshot & {
  readonly state: "quoted";
};

export type PaidTaskExpired = PaidTaskSnapshot & {
  readonly state: "expired";
};

export type PaidTaskPaymentSubmitted = PaidTaskSnapshot & {
  readonly state: "payment_submitted";
};

export type PaidTaskPaymentRejected = PaidTaskSnapshot & {
  readonly state: "payment_rejected";
};

export type PaidTaskPaymentOutcomeUnknown = PaidTaskSnapshot & {
  readonly state: "payment_outcome_unknown";
};

export type PaidTaskPaymentSettled = PaidTaskSnapshot & {
  readonly state: "payment_settled";
};

export type PaidTaskExecutionStarted = PaidTaskSnapshot & {
  readonly state: "execution_started";
};

export type PaidTaskResultValid = PaidTaskSnapshot & {
  readonly state: "result_valid";
};

export type PaidTaskExecutionFailed = PaidTaskSnapshot & {
  readonly state: "execution_failed";
};

export type PaidTaskResponseOutcomeUnknown = PaidTaskSnapshot & {
  readonly state: "response_outcome_unknown";
};

export type PaidTaskState =
  | PaidTaskQuoted
  | PaidTaskExpired
  | PaidTaskPaymentSubmitted
  | PaidTaskPaymentRejected
  | PaidTaskPaymentOutcomeUnknown
  | PaidTaskPaymentSettled
  | PaidTaskExecutionStarted
  | PaidTaskResultValid
  | PaidTaskExecutionFailed
  | PaidTaskResponseOutcomeUnknown;

export type PaidTaskEvent =
  | { readonly type: "expire"; readonly observedAt: string }
  | {
      readonly type: "payment_submitted";
      readonly observedAt: string;
      readonly requirements: unknown;
    }
  | { readonly type: "payment_rejected" }
  | { readonly type: "payment_outcome_unknown" }
  | { readonly type: "payment_settled" }
  | { readonly type: "execution_started" }
  | { readonly type: "result_valid" }
  | { readonly type: "execution_failed" }
  | { readonly type: "response_outcome_unknown" };

type PaidTaskStateName = PaidTaskState["state"];

type PaidTaskStateFor<Name extends PaidTaskStateName> = Extract<
  PaidTaskState,
  { readonly state: Name }
>;

const snapshotByIssuedState = new WeakMap<object, PaidTaskSnapshot>();
const consumedStates = new WeakSet<object>();
const transitioningStates = new WeakSet<object>();
const canonicalUtcMilliseconds =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;

function rejectTransition(): never {
  throw new TypeError("invalid paid task transition");
}

function boundedReference(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 96 ||
    value.trim() !== value
  ) {
    throw new TypeError(
      "task references must be trimmed nonblank strings of at most 96 characters",
    );
  }

  return value;
}

function parseCanonicalUtcMilliseconds(value: unknown): number {
  if (typeof value !== "string" || !canonicalUtcMilliseconds.test(value)) {
    throw new TypeError("timestamp must use canonical UTC milliseconds");
  }

  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new RangeError(
      "timestamp must round-trip as canonical UTC milliseconds",
    );
  }

  return epoch;
}

function issueState<Name extends PaidTaskStateName>(
  state: Name,
  snapshot: PaidTaskSnapshot,
): PaidTaskStateFor<Name> {
  const issued = Object.freeze({
    state,
    taskRef: snapshot.taskRef,
    offeringVersion: snapshot.offeringVersion,
    requirementsDigest: snapshot.requirementsDigest,
    expiresAt: snapshot.expiresAt,
  }) as PaidTaskStateFor<Name>;

  snapshotByIssuedState.set(issued, snapshot);
  return issued;
}

function snapshotForIssuedState(state: PaidTaskState): PaidTaskSnapshot {
  if (
    typeof state !== "object" ||
    state === null ||
    consumedStates.has(state) ||
    transitioningStates.has(state)
  ) {
    return rejectTransition();
  }

  return snapshotByIssuedState.get(state) ?? rejectTransition();
}

async function nextStateName(
  state: PaidTaskState,
  event: PaidTaskEvent,
  snapshot: PaidTaskSnapshot,
): Promise<PaidTaskStateName> {
  switch (state.state) {
    case "quoted":
      switch (event.type) {
        case "expire":
          return parseCanonicalUtcMilliseconds(event.observedAt) >=
              parseCanonicalUtcMilliseconds(snapshot.expiresAt)
            ? "expired"
            : rejectTransition();
        case "payment_submitted":
          if (
            parseCanonicalUtcMilliseconds(event.observedAt) >=
            parseCanonicalUtcMilliseconds(snapshot.expiresAt)
          ) {
            return rejectTransition();
          }

          return (await sha256Requirements(event.requirements)) ===
              snapshot.requirementsDigest
            ? "payment_submitted"
            : rejectTransition();
        default:
          return rejectTransition();
      }
    case "payment_submitted":
      switch (event.type) {
        case "payment_rejected":
          return "payment_rejected";
        case "payment_outcome_unknown":
          return "payment_outcome_unknown";
        case "payment_settled":
          return "payment_settled";
        default:
          return rejectTransition();
      }
    case "payment_settled":
      return event.type === "execution_started"
        ? "execution_started"
        : rejectTransition();
    case "execution_started":
      switch (event.type) {
        case "result_valid":
          return "result_valid";
        case "execution_failed":
          return "execution_failed";
        case "response_outcome_unknown":
          return "response_outcome_unknown";
        default:
          return rejectTransition();
      }
    case "expired":
    case "payment_rejected":
    case "payment_outcome_unknown":
    case "result_valid":
    case "execution_failed":
    case "response_outcome_unknown":
      return rejectTransition();
  }
}

export async function createPaidTask(
  input: PaidTaskInput,
): Promise<PaidTaskQuoted> {
  const taskRef = boundedReference(input.taskRef);
  const offeringVersion = boundedReference(input.offeringVersion);
  const expiresAt = input.expiresAt;
  parseCanonicalUtcMilliseconds(expiresAt);
  const requirementsDigest = await sha256Requirements(input.requirements);

  return issueState("quoted", {
    taskRef,
    offeringVersion,
    requirementsDigest,
    expiresAt,
  });
}

export async function transitionPaidTask(
  state: PaidTaskState,
  event: PaidTaskEvent,
): Promise<PaidTaskState> {
  const snapshot = snapshotForIssuedState(state);
  transitioningStates.add(state);

  try {
    const successor = issueState(
      await nextStateName(state, event, snapshot),
      snapshot,
    );

    consumedStates.add(state);
    return successor;
  } finally {
    transitioningStates.delete(state);
  }
}
