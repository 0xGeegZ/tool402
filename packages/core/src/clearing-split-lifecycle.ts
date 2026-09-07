import { claimPaidTaskResultForClearing } from "./paid-task-lifecycle.ts";
import type {
  PaidTaskResultValid,
  PaidTaskSnapshot,
} from "./paid-task-lifecycle.ts";
import type { RequirementsDigest } from "./requirements-offering-quote.ts";

export interface ClearingSplitSnapshot {
  readonly taskRef: string;
  readonly offeringVersion: string;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export type ClearingSplitRequired = ClearingSplitSnapshot & {
  readonly state: "split_required";
};

export type ClearingSplitSubmitted = ClearingSplitSnapshot & {
  readonly state: "split_submitted";
};

export type ClearingSplitOutcomeUnknown = ClearingSplitSnapshot & {
  readonly state: "split_outcome_unknown";
};

export type ClearingSplitConfirmed = ClearingSplitSnapshot & {
  readonly state: "split_confirmed";
};

export type ClearingSplitState =
  | ClearingSplitRequired
  | ClearingSplitSubmitted
  | ClearingSplitOutcomeUnknown
  | ClearingSplitConfirmed;

export type ClearingSplitEvent =
  | { readonly type: "submit" }
  | { readonly type: "confirm" }
  | { readonly type: "outcome_unknown" }
  | { readonly type: "non_execution_proven" };

type ClearingSplitStateName = ClearingSplitState["state"];
type ClearingSplitStateFor<Name extends ClearingSplitStateName> = Extract<
  ClearingSplitState,
  { readonly state: Name }
>;
type ClearingSplitEventType = ClearingSplitEvent["type"];

interface DataPropertyDescriptor extends PropertyDescriptor {
  readonly value: unknown;
}

const snapshotByIssuedState = new WeakMap<object, ClearingSplitSnapshot>();
const stateNameByIssuedState = new WeakMap<object, ClearingSplitStateName>();
const consumedStates = new WeakSet<object>();
const transitioningStates = new WeakSet<object>();

function rejectTransition(): never {
  throw new TypeError("invalid clearing split transition");
}

function issueState<Name extends ClearingSplitStateName>(
  state: Name,
  snapshot: ClearingSplitSnapshot,
): ClearingSplitStateFor<Name> {
  const issued = Object.freeze({
    state,
    taskRef: snapshot.taskRef,
    offeringVersion: snapshot.offeringVersion,
    requirementsDigest: snapshot.requirementsDigest,
    expiresAt: snapshot.expiresAt,
  }) as ClearingSplitStateFor<Name>;

  snapshotByIssuedState.set(issued, snapshot);
  stateNameByIssuedState.set(issued, state);
  return issued;
}

function snapshotForIssuedState(value: unknown): {
  readonly state: ClearingSplitStateName;
  readonly snapshot: ClearingSplitSnapshot;
} {
  if (
    typeof value !== "object" ||
    value === null ||
    consumedStates.has(value) ||
    transitioningStates.has(value)
  ) {
    return rejectTransition();
  }

  const state = stateNameByIssuedState.get(value) ?? rejectTransition();
  const snapshot = snapshotByIssuedState.get(value) ?? rejectTransition();
  return { state, snapshot };
}

function isDataPropertyDescriptor(
  descriptor: PropertyDescriptor,
): descriptor is DataPropertyDescriptor {
  return (
    Object.hasOwn(descriptor, "value") &&
    !Object.hasOwn(descriptor, "get") &&
    !Object.hasOwn(descriptor, "set")
  );
}

function eventType(value: unknown): ClearingSplitEventType {
  if (typeof value !== "object" || value === null) {
    return rejectTransition();
  }

  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return rejectTransition();
    }

    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "type") {
      return rejectTransition();
    }

    const descriptor = Reflect.getOwnPropertyDescriptor(value, "type");
    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      !isDataPropertyDescriptor(descriptor)
    ) {
      return rejectTransition();
    }

    switch (descriptor.value) {
      case "submit":
      case "confirm":
      case "outcome_unknown":
      case "non_execution_proven":
        return descriptor.value;
      default:
        return rejectTransition();
    }
  } catch {
    return rejectTransition();
  }
}

function nextStateName(
  state: ClearingSplitStateName,
  event: ClearingSplitEventType,
): ClearingSplitStateName {
  switch (state) {
    case "split_required":
      return event === "submit" ? "split_submitted" : rejectTransition();
    case "split_submitted":
      switch (event) {
        case "confirm":
          return "split_confirmed";
        case "outcome_unknown":
          return "split_outcome_unknown";
        default:
          return rejectTransition();
      }
    case "split_outcome_unknown":
      switch (event) {
        case "confirm":
          return "split_confirmed";
        case "non_execution_proven":
          return "split_required";
        default:
          return rejectTransition();
      }
    case "split_confirmed":
      return rejectTransition();
  }
}

export function createClearingSplit(
  result: PaidTaskResultValid,
): ClearingSplitRequired {
  const snapshot = claimPaidTaskResultForClearing(result);
  return issueState("split_required", snapshot);
}

export function transitionClearingSplit(
  state: ClearingSplitState,
  event: ClearingSplitEvent,
): ClearingSplitState {
  const issued = snapshotForIssuedState(state);
  transitioningStates.add(state);

  try {
    const successor = issueState(
      nextStateName(issued.state, eventType(event)),
      issued.snapshot,
    );
    consumedStates.add(state);
    return successor;
  } finally {
    transitioningStates.delete(state);
  }
}
