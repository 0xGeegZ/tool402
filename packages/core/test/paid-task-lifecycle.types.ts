import {
  createPaidTask,
  transitionPaidTask,
} from "../src/index.ts";
import type {
  PaidTaskEvent,
  PaidTaskPaymentSettled,
  PaidTaskQuoted,
  PaidTaskResultValid,
  PaidTaskState,
  RequirementsDigest,
  Tinybar,
} from "../src/index.ts";

const quoted: PaidTaskQuoted = await createPaidTask({
  taskRef: "task-1",
  offeringVersion: "risk-v1",
  requirements: { x402Version: 2 },
  expiresAt: "2026-09-07T00:00:00.000Z",
});
const state: PaidTaskState = await transitionPaidTask(quoted, {
  type: "payment_submitted",
  observedAt: "2026-09-06T23:59:59.999Z",
  requirements: { x402Version: 2 },
});
const digest: RequirementsDigest = state.requirementsDigest;

if (state.state === "payment_settled") {
  const settled: PaidTaskPaymentSettled = state;
  void settled;
}

if (state.state === "result_valid") {
  const result: PaidTaskResultValid = state;
  void result;
}

// @ts-expect-error A digest is not a tinybar amount.
const amount: Tinybar = state.requirementsDigest;
// @ts-expect-error A payment-submitted event always carries requirements.
const missingRequirements: PaidTaskEvent = {
  type: "payment_submitted",
  observedAt: "2026-09-06T23:59:59.999Z",
};

void quoted;
void state;
void digest;
void amount;
void missingRequirements;
