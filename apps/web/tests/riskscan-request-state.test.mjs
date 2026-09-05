import assert from "node:assert/strict";
import test from "node:test";

import { submitRiskScanRequest } from "../src/components/riskscan/request/riskscan-request-state.ts";

function validInput() {
  return {
    requestRef: "request-web-42",
    subjectRef: "service:tool402",
    context: "caller disclosure review",
    declarations: {
      identity: true,
      pricing: true,
      limitations: true,
      evidence: true,
    },
  };
}

function validQuickResult() {
  return {
    requestRef: "request-web-42",
    subjectRef: "service:tool402",
    context: "caller disclosure review",
    disposition: "disclosures_reported",
    reasons: ["caller reported identity disclosure"],
    limitations: ["Quick reflects caller-supplied declarations."],
  };
}

test("maps a 503 into unavailable", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    new Response(null, { status: 503 }),
  );

  assert.deepEqual(outcome, { kind: "unavailable" });
});

test("maps a 402 with PAYMENT-REQUIRED into payment_required without exposing its value", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    new Response(null, {
      status: 402,
      headers: { "payment-required": "opaque-protocol-data" },
    }),
  );

  assert.deepEqual(outcome, { kind: "payment_required" });
});

test("rejects a 402 without a nonempty payment header", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    new Response(null, {
      status: 402,
      headers: { "payment-required": "   " },
    }),
  );

  assert.deepEqual(outcome, { kind: "unexpected_response" });
});

test("maps a 400 into invalid_request", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    new Response(null, { status: 400 }),
  );

  assert.deepEqual(outcome, { kind: "invalid_request" });
});

test("maps a thrown sender into transport_failure", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () => {
    throw new Error("network unavailable");
  });

  assert.deepEqual(outcome, { kind: "transport_failure" });
});

test("rejects an unrecognized status", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    new Response(null, { status: 418 }),
  );

  assert.deepEqual(outcome, { kind: "unexpected_response" });
});

test("rejects a malformed 200 payload instead of presenting it as Quick", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    Response.json({ disposition: "completed" }),
  );

  assert.deepEqual(outcome, { kind: "unexpected_response" });
});

test("returns a full schema-valid Quick payload", async () => {
  const result = validQuickResult();
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    Response.json(result),
  );

  assert.deepEqual(outcome, { kind: "quick_response", result });
});
