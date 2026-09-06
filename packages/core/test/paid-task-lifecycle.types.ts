import {
  createPaidTask,
  transitionPaidTask,
} from "../src/index.ts";
import type {
  PaidTaskEvent,
  PaidTaskExecutionFailed,
  PaidTaskExecutionStarted,
  PaidTaskExpired,
  PaidTaskInput,
  PaidTaskPaymentOutcomeUnknown,
  PaidTaskPaymentRejected,
  PaidTaskPaymentSettled,
  PaidTaskPaymentSubmitted,
  PaidTaskQuoted,
  PaidTaskResultValid,
  PaidTaskResponseOutcomeUnknown,
  PaidTaskSnapshot,
  PaidTaskState,
  RequirementsDigest,
  Tinybar,
} from "../src/index.ts";

const input: PaidTaskInput = {
  taskRef: "task-1",
  offeringVersion: "risk-v1",
  requirements: { x402Version: 2 },
  expiresAt: "2026-09-07T00:00:00.000Z",
};
const quoted: PaidTaskQuoted = await createPaidTask(input);
const state: PaidTaskState = await transitionPaidTask(quoted, {
  type: "payment_submitted",
  observedAt: "2026-09-06T23:59:59.999Z",
  requirements: { x402Version: 2 },
});
const digest: RequirementsDigest = state.requirementsDigest;
const snapshot: PaidTaskSnapshot = state;

if (state.state === "quoted") {
  const quotedState: PaidTaskQuoted = state;
  void quotedState;
}

if (state.state === "expired") {
  const expired: PaidTaskExpired = state;
  void expired;
}

if (state.state === "payment_submitted") {
  const submitted: PaidTaskPaymentSubmitted = state;
  void submitted;
}

if (state.state === "payment_rejected") {
  const rejected: PaidTaskPaymentRejected = state;
  void rejected;
}

if (state.state === "payment_outcome_unknown") {
  const paymentUnknown: PaidTaskPaymentOutcomeUnknown = state;
  void paymentUnknown;
}

if (state.state === "payment_settled") {
  const settled: PaidTaskPaymentSettled = state;
  void settled;
}

if (state.state === "execution_started") {
  const executionStarted: PaidTaskExecutionStarted = state;
  void executionStarted;
}

if (state.state === "result_valid") {
  const result: PaidTaskResultValid = state;
  void result;
}

if (state.state === "execution_failed") {
  const executionFailed: PaidTaskExecutionFailed = state;
  void executionFailed;
}

if (state.state === "response_outcome_unknown") {
  const responseUnknown: PaidTaskResponseOutcomeUnknown = state;
  void responseUnknown;
}

// @ts-expect-error A digest is not a tinybar amount.
const amount: Tinybar = state.requirementsDigest;
// @ts-expect-error A payment-submitted event always carries requirements.
const missingRequirements: PaidTaskEvent = {
  type: "payment_submitted",
  observedAt: "2026-09-06T23:59:59.999Z",
};

void quoted;
void input;
void state;
void digest;
void snapshot;
void amount;
void missingRequirements;
