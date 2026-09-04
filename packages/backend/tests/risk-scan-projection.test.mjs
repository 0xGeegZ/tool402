import assert from "node:assert/strict";
import test from "node:test";

const baseState = {
  requestRef: "request-402",
  subjectRef: "service:weather",
  context: "travel-planning",
};

test("projects every RiskScan lifecycle state through the public backend entry", async () => {
  const { projectRiskScanLifecycle } = await import("@tool402/backend");
  const lifecycleStates = [
    { state: "unavailable", ...baseState, reason: "not supported" },
    { state: "payment_required", ...baseState },
    { state: "payment_pending", ...baseState },
    { state: "payment_failed", ...baseState, reason: "settlement rejected" },
    {
      state: "execution_failed",
      ...baseState,
      settlementRef: "settlement-402",
      reason: "provider unavailable",
    },
    {
      state: "completed",
      ...baseState,
      settlementRef: "settlement-402",
      result: {
        resultRef: "result-402",
        salientReasons: ["licensed", "recently maintained"],
        limitations: ["regional coverage"],
      },
      receiptRef: "receipt-402",
      evidenceRef: "evidence-402",
    },
  ];

  const projections = lifecycleStates.map(projectRiskScanLifecycle);

  assert.deepEqual(
    projections.map(({ state, requestRef, subjectRef, context }) => ({
      state,
      requestRef,
      subjectRef,
      context,
    })),
    lifecycleStates.map(({ state, requestRef, subjectRef, context }) => ({
      state,
      requestRef,
      subjectRef,
      context,
    })),
  );
  assert.equal(projections[0].reason, "not supported");
  assert.equal(projections[3].reason, "settlement rejected");
  assert.deepEqual(projections[4], {
    state: "execution_failed",
    ...baseState,
    settlementRef: "settlement-402",
    reason: "provider unavailable",
  });

  for (const projection of projections.slice(0, -1)) {
    assert.equal("result" in projection, false);
    assert.equal("receiptRef" in projection, false);
    assert.equal("evidenceRef" in projection, false);
  }

  assert.deepEqual(projections[5], lifecycleStates[5]);
  assert.notEqual(
    projections[5].result.salientReasons,
    lifecycleStates[5].result.salientReasons,
  );
  assert.notEqual(
    projections[5].result.limitations,
    lifecycleStates[5].result.limitations,
  );
});
