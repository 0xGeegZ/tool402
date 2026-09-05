import assert from "node:assert/strict";
import test from "node:test";

import * as core from "@tool402/core";

test("starts a valid request in payment_required with no completed artifacts", () => {
  assert.equal(
    typeof core.startRiskScanRequest,
    "function",
    "the public RiskScan lifecycle constructor must be exported",
  );

  const state = core.startRiskScanRequest({
    requestRef: " request-42 ",
    subjectRef: " wallet:0xabc ",
    context: " quick assessment ",
  });

  assert.deepEqual(state, {
    state: "payment_required",
    requestRef: "request-42",
    subjectRef: "wallet:0xabc",
    context: "quick assessment",
  });
  assert.equal("result" in state, false);
  assert.equal("receiptRef" in state, false);
  assert.equal("evidenceRef" in state, false);
});

test("rejects blank, oversized, and structurally unsupported request input", () => {
  const validInput = {
    requestRef: "request-42",
    subjectRef: "wallet:0xabc",
    context: "quick assessment",
  };

  const invalidInputs = [
    ["blank requestRef", { ...validInput, requestRef: "   " }, /requestRef/u],
    [
      "oversized requestRef",
      { ...validInput, requestRef: "r".repeat(97) },
      /requestRef/u,
    ],
    ["blank subjectRef", { ...validInput, subjectRef: "   " }, /subjectRef/u],
    [
      "oversized subjectRef",
      { ...validInput, subjectRef: "s".repeat(161) },
      /subjectRef/u,
    ],
    ["blank context", { ...validInput, context: "   " }, /context/u],
    [
      "oversized context",
      { ...validInput, context: "c".repeat(281) },
      /context/u,
    ],
    [
      "non-string requestRef",
      { ...validInput, requestRef: null },
      /requestRef must be a string/u,
    ],
  ];

  for (const [description, input, expectedError] of invalidInputs) {
    assert.throws(
      () => core.startRiskScanRequest(input),
      expectedError,
      description,
    );
  }
});

test("validates request input as trimmed opaque values", () => {
  assert.equal(
    typeof core.validateRiskScanRequest,
    "function",
    "the public RiskScan request validator must be exported",
  );

  assert.deepEqual(
    core.validateRiskScanRequest({
      requestRef: " request-43 ",
      subjectRef: " contract:0xdef ",
      context: " bounded review ",
    }),
    {
      requestRef: "request-43",
      subjectRef: "contract:0xdef",
      context: "bounded review",
    },
  );
});

test("transitions valid requests through non-completed lifecycle states", () => {
  assert.equal(
    typeof core.markRiskScanUnavailable,
    "function",
    "the unavailable transition must be exported",
  );
  assert.equal(
    typeof core.markRiskScanPaymentPending,
    "function",
    "the pending transition must be exported",
  );
  assert.equal(
    typeof core.markRiskScanPaymentFailed,
    "function",
    "the payment failure transition must be exported",
  );

  const initial = core.startRiskScanRequest({
    requestRef: "request-44",
    subjectRef: "wallet:0x123",
    context: "bounded assessment",
  });
  const unavailable = core.markRiskScanUnavailable(
    initial,
    "subject is unavailable",
  );
  const pending = core.markRiskScanPaymentPending(initial);
  const paymentFailed = core.markRiskScanPaymentFailed(
    pending,
    "settlement was declined",
  );

  assert.deepEqual(unavailable, {
    state: "unavailable",
    requestRef: "request-44",
    subjectRef: "wallet:0x123",
    context: "bounded assessment",
    reason: "subject is unavailable",
  });
  assert.deepEqual(pending, {
    state: "payment_pending",
    requestRef: "request-44",
    subjectRef: "wallet:0x123",
    context: "bounded assessment",
  });
  assert.deepEqual(paymentFailed, {
    state: "payment_failed",
    requestRef: "request-44",
    subjectRef: "wallet:0x123",
    context: "bounded assessment",
    reason: "settlement was declined",
  });

  for (const state of [unavailable, pending, paymentFailed]) {
    assert.equal("result" in state, false);
    assert.equal("receiptRef" in state, false);
    assert.equal("evidenceRef" in state, false);
  }
});

test("requires issued payment-state provenance for capability transitions", () => {
  const validInput = {
    requestRef: "request-provenance",
    subjectRef: "wallet:provenance",
    context: "bounded assessment",
  };
  const validCorrelation = {
    requestRef: "request-provenance",
    settlementRef: "settlement-provenance",
  };
  const required = core.startRiskScanRequest(validInput);

  assert.equal(Object.isFrozen(required), true);
  assert.throws(
    () => core.markRiskScanPaymentPending({ ...required }),
    /issued payment requirement/u,
  );
  assert.throws(
    () =>
      core.markRiskScanPaymentPending(
        Object.defineProperties({}, Object.getOwnPropertyDescriptors(required)),
      ),
    /issued payment requirement/u,
  );
  assert.throws(
    () => core.markRiskScanUnavailable({ ...required }, "unavailable"),
    /issued payment requirement/u,
  );
  assert.throws(
    () => core.markRiskScanPaymentFailed({ ...required }, "declined"),
    /issued payment state/u,
  );

  const pending = core.markRiskScanPaymentPending(required);
  assert.equal(Object.isFrozen(pending), true);
  assert.throws(
    () => core.createRiskScanVerifiedSettlement({ ...pending }, validCorrelation),
    /issued payment pending state/u,
  );
  assert.throws(
    () =>
      core.createRiskScanVerifiedSettlement(
        Object.defineProperties({}, Object.getOwnPropertyDescriptors(pending)),
        validCorrelation,
      ),
    /issued payment pending state/u,
  );
  assert.throws(
    () => core.markRiskScanPaymentFailed({ ...pending }, "declined"),
    /issued payment state/u,
  );

  const settlement = core.createRiskScanVerifiedSettlement(
    pending,
    validCorrelation,
  );
  const artifacts = core.bindRiskScanReceiptEvidence(settlement, {
    receiptRef: "receipt-provenance",
    evidenceRef: "evidence-provenance",
  });
  assert.deepEqual(
    core.completeRiskScanRequest(settlement, artifacts, {
      resultRef: "result-provenance",
      salientReasons: ["bounded input"],
      limitations: ["limited source coverage"],
    }).state,
    "completed",
  );
});

test("requires a verified settlement correlation for execution failure", () => {
  assert.equal(
    typeof core.createRiskScanVerifiedSettlement,
    "function",
    "the verified settlement correlation constructor must be exported",
  );
  assert.equal(
    typeof core.markRiskScanExecutionFailed,
    "function",
    "the execution failure transition must be exported",
  );

  const initial = core.startRiskScanRequest({
    requestRef: "request-45",
    subjectRef: "wallet:0x456",
    context: "bounded assessment",
  });
  const pending = core.markRiskScanPaymentPending(initial);
  const settlement = core.createRiskScanVerifiedSettlement(pending, {
    requestRef: "request-45",
    settlementRef: "settlement-45",
  });
  const executionFailed = core.markRiskScanExecutionFailed(
    settlement,
    "assessment execution failed",
  );

  assert.deepEqual(executionFailed, {
    state: "execution_failed",
    requestRef: "request-45",
    subjectRef: "wallet:0x456",
    context: "bounded assessment",
    settlementRef: "settlement-45",
    reason: "assessment execution failed",
  });
  assert.equal("result" in executionFailed, false);
  assert.equal("receiptRef" in executionFailed, false);
  assert.equal("evidenceRef" in executionFailed, false);

  assert.throws(
    () =>
      core.createRiskScanVerifiedSettlement(pending, {
        requestRef: "request-other",
        settlementRef: "settlement-45",
      }),
    /requestRef must match the payment state/u,
  );

  assert.throws(
    () =>
      core.markRiskScanExecutionFailed(
        { requestRef: "request-45", settlementRef: "settlement-45" },
        "assessment execution failed",
      ),
    /verified settlement correlation/u,
  );
});

test("makes verified settlement correlations immutable", () => {
  const initial = core.startRiskScanRequest({
    requestRef: "request-immutable",
    subjectRef: "wallet:0ximmutable",
    context: "bounded assessment",
  });
  const pending = core.markRiskScanPaymentPending(initial);
  const settlement = core.createRiskScanVerifiedSettlement(pending, {
    requestRef: "request-immutable",
    settlementRef: "settlement-immutable",
  });

  assert.throws(() => {
    settlement.requestRef = "request-unrelated";
  }, TypeError);
  assert.throws(() => {
    settlement.settlementRef = "settlement-unrelated";
  }, TypeError);

  const reflectiveCopy = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(settlement),
  );

  assert.throws(
    () =>
      core.markRiskScanExecutionFailed(
        reflectiveCopy,
        "assessment execution failed",
      ),
    /verified settlement correlation/u,
  );
});

test("binds receipt and evidence references to a verified settlement", () => {
  assert.equal(
    typeof core.bindRiskScanReceiptEvidence,
    "function",
    "the receipt/evidence binder must be exported",
  );

  const initial = core.startRiskScanRequest({
    requestRef: "request-46",
    subjectRef: "wallet:0x789",
    context: "bounded assessment",
  });
  const pending = core.markRiskScanPaymentPending(initial);
  const settlement = core.createRiskScanVerifiedSettlement(pending, {
    requestRef: "request-46",
    settlementRef: "settlement-46",
  });

  for (const invalidSettlement of [undefined, null]) {
    assert.throws(
      () =>
        core.bindRiskScanReceiptEvidence(invalidSettlement, {
          receiptRef: "receipt-46",
          evidenceRef: "evidence-46",
        }),
      /verified settlement correlation/u,
    );
  }

  const reflectiveCopy = Object.defineProperties(
    {},
    Object.getOwnPropertyDescriptors(settlement),
  );
  assert.throws(
    () =>
      core.bindRiskScanReceiptEvidence(reflectiveCopy, {
        receiptRef: "receipt-46",
        evidenceRef: "evidence-46",
      }),
    /verified settlement correlation/u,
  );

  const artifacts = core.bindRiskScanReceiptEvidence(settlement, {
    receiptRef: " receipt-46 ",
    evidenceRef: " evidence-46 ",
  });

  assert.equal(Object.isFrozen(artifacts), true);
  assert.deepEqual(artifacts, {
    requestRef: "request-46",
    settlementRef: "settlement-46",
    receiptRef: "receipt-46",
    evidenceRef: "evidence-46",
  });

  for (const [field, invalidValue] of [
    ["receiptRef", "   "],
    ["evidenceRef", "   "],
  ]) {
    assert.throws(
      () =>
        core.bindRiskScanReceiptEvidence(settlement, {
          receiptRef: field === "receiptRef" ? invalidValue : "evidence-46",
          evidenceRef:
            field === "evidenceRef" ? invalidValue : "evidence-46",
        }),
      new RegExp(field, "u"),
    );
  }
});

test("completes only matching verified correlations with structured assessment content", () => {
  assert.equal(
    typeof core.completeRiskScanRequest,
    "function",
    "the completed-state transition must be exported",
  );

  const initial = core.startRiskScanRequest({
    requestRef: "request-46",
    subjectRef: "wallet:0x789",
    context: "bounded assessment",
  });
  const pending = core.markRiskScanPaymentPending(initial);
  const settlement = core.createRiskScanVerifiedSettlement(pending, {
    requestRef: "request-46",
    settlementRef: "settlement-46",
  });
  const artifacts = core.bindRiskScanReceiptEvidence(settlement, {
    receiptRef: "receipt-46",
    evidenceRef: "evidence-46",
  });
  const completion = {
    resultRef: "result-46",
    salientReasons: [" bounded input was assessed "],
    limitations: [" source coverage is limited "],
  };

  assert.throws(
    () => core.completeRiskScanRequest(undefined, artifacts, completion),
    /verified settlement correlation/u,
  );
  assert.throws(
    () =>
      core.completeRiskScanRequest(
        settlement,
        Object.defineProperties({}, Object.getOwnPropertyDescriptors(artifacts)),
        completion,
      ),
    /bound receipt and evidence/u,
  );

  assert.throws(
    () => core.completeRiskScanRequest(settlement, {}, completion),
    /bound receipt and evidence/u,
  );

  const otherInitial = core.startRiskScanRequest({
    requestRef: "request-identity",
    subjectRef: "wallet:other",
    context: "bounded assessment",
  });
  const otherPending = core.markRiskScanPaymentPending(otherInitial);
  const firstIdentitySettlement = core.createRiskScanVerifiedSettlement(
    otherPending,
    { requestRef: "request-identity", settlementRef: "settlement-identity" },
  );
  const secondIdentitySettlement = core.createRiskScanVerifiedSettlement(
    otherPending,
    { requestRef: "request-identity", settlementRef: "settlement-identity" },
  );
  const identityArtifacts = core.bindRiskScanReceiptEvidence(
    firstIdentitySettlement,
    { receiptRef: "receipt-identity", evidenceRef: "evidence-identity" },
  );
  assert.throws(
    () =>
      core.completeRiskScanRequest(
        secondIdentitySettlement,
        identityArtifacts,
        completion,
      ),
    /bound receipt and evidence/u,
  );

  assert.throws(
    () => core.completeRiskScanRequest(settlement, artifacts, {
      ...completion,
      resultRef: "   ",
    }),
    /resultRef/u,
  );

  assert.throws(
    () => core.completeRiskScanRequest(settlement, artifacts, {
      ...completion,
      salientReasons: [],
    }),
    /salientReasons/u,
  );
  assert.throws(
    () => core.completeRiskScanRequest(settlement, artifacts, {
      ...completion,
      limitations: ["   "],
    }),
    /limitations/u,
  );

  assert.deepEqual(core.completeRiskScanRequest(settlement, artifacts, completion), {
    state: "completed",
    requestRef: "request-46",
    subjectRef: "wallet:0x789",
    context: "bounded assessment",
    settlementRef: "settlement-46",
    result: {
      resultRef: "result-46",
      salientReasons: ["bounded input was assessed"],
      limitations: ["source coverage is limited"],
    },
    receiptRef: "receipt-46",
    evidenceRef: "evidence-46",
  });
});

test("requires a nonblank explicit reason for each terminal failure state", () => {
  const initial = core.startRiskScanRequest({
    requestRef: "request-47",
    subjectRef: "wallet:0x999",
    context: "bounded assessment",
  });
  const pending = core.markRiskScanPaymentPending(initial);
  const settlement = core.createRiskScanVerifiedSettlement(pending, {
    requestRef: "request-47",
    settlementRef: "settlement-47",
  });

  for (const transition of [
    () => core.markRiskScanUnavailable(initial, "   "),
    () => core.markRiskScanPaymentFailed(pending, "   "),
    () => core.markRiskScanExecutionFailed(settlement, "   "),
  ]) {
    assert.throws(transition, /reason/u);
  }
});
