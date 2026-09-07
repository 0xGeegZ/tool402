import {
  createClearingSplit,
  createPaidTask,
  transitionClearingSplit,
  transitionPaidTask,
} from "../src/index.ts";
import type {
  ClearingSplitConfirmed,
  ClearingSplitEvent,
  ClearingSplitOutcomeUnknown,
  ClearingSplitRequired,
  ClearingSplitSnapshot,
  ClearingSplitState,
  ClearingSplitSubmitted,
  PaidTaskResultValid,
  PaidTaskState,
  RequirementsDigest,
  Tinybar,
} from "../src/index.ts";

async function resultValid(): Promise<PaidTaskResultValid> {
  let state: PaidTaskState = await createPaidTask({
    taskRef: "task-1",
    offeringVersion: "risk-v1",
    requirements: { x402Version: 2 },
    expiresAt: "2026-09-07T00:00:00.000Z",
  });

  state = await transitionPaidTask(state, {
    type: "payment_submitted",
    observedAt: "2026-09-06T23:59:59.999Z",
    requirements: { x402Version: 2 },
  });
  state = await transitionPaidTask(state, { type: "payment_settled" });
  state = await transitionPaidTask(state, { type: "execution_started" });
  state = await transitionPaidTask(state, { type: "result_valid" });

  if (state.state !== "result_valid") {
    throw new Error("fixture must produce an issued result_valid state");
  }
  return state;
}

const result = await resultValid();
const split: ClearingSplitRequired = createClearingSplit(result);
const snapshot: ClearingSplitSnapshot = split;
const next: ClearingSplitState = transitionClearingSplit(split, { type: "submit" });
const event: ClearingSplitEvent = { type: "confirm" };
const digest: RequirementsDigest = next.requirementsDigest;

if (next.state === "split_required") {
  const required: ClearingSplitRequired = next;
  void required;
}
if (next.state === "split_submitted") {
  const submitted: ClearingSplitSubmitted = next;
  void submitted;
}
if (next.state === "split_outcome_unknown") {
  const unknown: ClearingSplitOutcomeUnknown = next;
  void unknown;
}
if (next.state === "split_confirmed") {
  const confirmed: ClearingSplitConfirmed = next;
  void confirmed;
}

// @ts-expect-error Split lifecycle states do not carry an external amount.
const amount: Tinybar = split.amount;
// @ts-expect-error Unknown events are not part of the closed public union.
transitionClearingSplit(split, { type: "retry" });

void result;
void split;
void snapshot;
void next;
void event;
void digest;
void amount;
