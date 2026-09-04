import assert from "node:assert/strict";
import test from "node:test";

import * as core from "@tool402/core";

const validRequestInput = {
  requestRef: " request-quick-42 ",
  subjectRef: " service:tool402 ",
  context: " caller disclosure review ",
};

const validatedRequest = {
  requestRef: "request-quick-42",
  subjectRef: "service:tool402",
  context: "caller disclosure review",
};

const baselineLimitation =
  "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.";

const validDeclarations = {
  identity: true,
  pricing: true,
  limitations: true,
  evidence: true,
};

test("rejects missing and non-boolean disclosure declarations", () => {
  assert.equal(
    typeof core.assessRiskScanQuick,
    "function",
    "the public Quick assessment function must be exported",
  );

  const invalidDeclarations = [
    ["missing declarations", undefined, /declarations/u],
    ["null declarations", null, /declarations/u],
    ["array declarations", [], /declarations/u],
    [
      "missing evidence declaration",
      { identity: true, pricing: true, limitations: true },
      /evidence/u,
    ],
    [
      "non-boolean pricing declaration",
      { identity: true, pricing: "reported", limitations: true, evidence: true },
      /pricing/u,
    ],
    [
      "unsupported declaration",
      {
        ...validDeclarations,
        externalAudit: true,
      },
      /unsupported/u,
    ],
    [
      "non-enumerable unsupported declaration",
      Object.defineProperty({ ...validDeclarations }, "internalAudit", {
        value: true,
      }),
      /unsupported/u,
    ],
    [
      "symbol unsupported declaration",
      { ...validDeclarations, [Symbol("internalAudit")]: true },
      /unsupported/u,
    ],
  ];

  for (const [description, declarations, expectedError] of invalidDeclarations) {
    assert.throws(
      () =>
        core.assessRiskScanQuick({
          ...validRequestInput,
          declarations,
        }),
      expectedError,
      description,
    );
  }
});

test("validates malformed request fields through the Quick entry point", () => {
  const invalidRequests = [
    ["blank request reference", { requestRef: "   " }, /requestRef/u],
    [
      "oversized subject reference",
      { subjectRef: "s".repeat(161) },
      /subjectRef/u,
    ],
    ["non-string context", { context: null }, /context must be a string/u],
  ];

  for (const [description, requestOverride, expectedError] of invalidRequests) {
    assert.throws(
      () =>
        core.assessRiskScanQuick({
          ...validRequestInput,
          ...requestOverride,
          declarations: validDeclarations,
        }),
      expectedError,
      description,
    );
  }
});

test("reports exactly the missing disclosure labels in stable order", () => {
  const assessment = core.assessRiskScanQuick({
    ...validRequestInput,
    declarations: { ...validDeclarations, identity: false, limitations: false, evidence: false },
  });

  assert.deepEqual(assessment, {
    ...validatedRequest,
    disposition: "needs_disclosure",
    reasons: ["identity disclosure", "limitations disclosure", "evidence disclosure"],
    limitations: [baselineLimitation],
  });
});

test("reports declarations without certifying service, payment, or evidence", () => {
  const assessment = core.assessRiskScanQuick({
    ...validRequestInput,
    declarations: validDeclarations,
  });

  assert.deepEqual(assessment, {
    ...validatedRequest,
    disposition: "disclosures_reported",
    reasons: [
      "caller reported identity disclosure",
      "caller reported pricing disclosure",
      "caller reported limitations disclosure",
      "caller reported evidence disclosure",
    ],
    limitations: [baselineLimitation],
  });

  for (const field of ["score", "price", "payment", "receiptRef", "settlementRef", "evidenceRef"]) {
    assert.equal(field in assessment, false, `${field} must not be part of Quick`);
  }
});
