import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} = require("@x402/core/http");
const { handleRiskScanPost } = require("../src/lib/riskscan-x402.ts");
const {
  clearRiskScanSettlementEvidence,
  readRiskScanSettlementEvidence,
  recordRiskScanVerifiedSettlement,
} = require("../src/lib/riskscan-settlement-evidence.ts");

function configuredEnvironment() {
  return {
    RISKSCAN_X402_PAY_TO: `0x${"1".repeat(40)}`,
    RISKSCAN_X402_FACILITATOR_URL: "https://facilitator.invalid",
    RISKSCAN_X402_NETWORK: "eip155:84532",
    RISKSCAN_X402_PRICE: "$0.01",
  };
}

function validQuickInput() {
  return {
    requestRef: "request-evidence-7",
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

function createRequest(body = validQuickInput(), headers = {}) {
  return new NextRequest("http://tool402.test/api/riskscan", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function successfulSettlement({ requirements }) {
  return {
    success: true,
    transaction: "settlement-evidence-7",
    network: requirements.network,
  };
}

function createSettlingLocalFacilitator(settle) {
  return {
    async getSupported() {
      return {
        kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:84532" }],
        extensions: [],
        signers: {},
      };
    },
    async verify() {
      return { isValid: true };
    },
    async settle(payload, requirements) {
      return settle({ payload, requirements });
    },
  };
}

async function post(body, headers, options) {
  return handleRiskScanPost(
    createRequest(body, headers),
    configuredEnvironment(),
    options,
  );
}

async function paidRequest(
  facilitatorClient,
  options = {},
  body = validQuickInput(),
) {
  const challenge = await post(body, {}, { facilitatorClient, ...options });
  const requiredHeader = challenge.headers.get("payment-required");

  assert.equal(challenge.status, 402);
  assert.notEqual(requiredHeader, null);

  const paymentRequired = decodePaymentRequiredHeader(requiredHeader);
  const paymentSignature = encodePaymentSignatureHeader({
    x402Version: 2,
    accepted: paymentRequired.accepts[0],
    payload: {},
  });

  return post(
    body,
    { "payment-signature": paymentSignature },
    {
      facilitatorClient,
      ...options,
    },
  );
}

function verifiedSettlement(requestRef) {
  const core = require("@tool402/core");
  const pending = core.markRiskScanPaymentPending(
    core.startRiskScanRequest({
      requestRef,
      subjectRef: "service:tool402",
      context: "caller disclosure review",
    }),
  );

  return core.createRiskScanVerifiedSettlement(pending, {
    requestRef,
    settlementRef: `settlement-${requestRef}`,
  });
}

test("the route records a genuine verified settlement without a supplied consumer", async (t) => {
  t.after(clearRiskScanSettlementEvidence);
  clearRiskScanSettlementEvidence();

  const response = await paidRequest(
    createSettlingLocalFacilitator(successfulSettlement),
  );
  const recorded = readRiskScanSettlementEvidence();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("payment-response") ?? "", /\S/u);
  assert.deepEqual(await response.json(), {
    requestRef: "request-evidence-7",
    subjectRef: "service:tool402",
    context: "caller disclosure review",
    disposition: "disclosures_reported",
    reasons: [
      "caller reported identity disclosure",
      "caller reported pricing disclosure",
      "caller reported limitations disclosure",
      "caller reported evidence disclosure",
    ],
    limitations: [
      "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.",
    ],
  });
  assert.equal(recorded.length, 1);

  const core = require("@tool402/core");

  assert.deepEqual(
    core.bindRiskScanReceiptEvidence(recorded[0], {
      receiptRef: "receipt-evidence-7",
      evidenceRef: "evidence-evidence-7",
    }),
    {
      requestRef: "request-evidence-7",
      settlementRef: "settlement-evidence-7",
      receiptRef: "receipt-evidence-7",
      evidenceRef: "evidence-evidence-7",
    },
  );
});

test("an explicitly supplied consumer replaces the default recorder", async (t) => {
  t.after(clearRiskScanSettlementEvidence);
  clearRiskScanSettlementEvidence();

  const settlements = [];
  const response = await paidRequest(
    createSettlingLocalFacilitator(successfulSettlement),
    { onVerifiedSettlement: (settlement) => settlements.push(settlement) },
  );

  assert.equal(response.status, 200);
  assert.equal(settlements.length, 1);
  assert.equal(readRiskScanSettlementEvidence().length, 0);
});

test("unsettled, unsigned, and invalid protected requests record nothing", async (t) => {
  t.after(clearRiskScanSettlementEvidence);
  clearRiskScanSettlementEvidence();

  const settling = createSettlingLocalFacilitator(successfulSettlement);
  const failing = createSettlingLocalFacilitator(({ requirements }) => ({
    success: false,
    network: requirements.network,
    transaction: "",
  }));

  const unsigned = await post(
    validQuickInput(),
    {},
    { facilitatorClient: settling },
  );
  const failed = await paidRequest(failing);
  const invalid = await paidRequest(
    settling,
    {},
    {
      ...validQuickInput(),
      declarations: { identity: true },
    },
  );

  assert.equal(unsigned.status, 402);
  assert.equal(failed.status, 402);
  assert.equal(invalid.status, 400);
  assert.equal(readRiskScanSettlementEvidence().length, 0);
});

test("the evidence sink is bounded, evicts oldest first, and returns a snapshot", (t) => {
  t.after(clearRiskScanSettlementEvidence);
  clearRiskScanSettlementEvidence();

  for (let index = 1; index <= 52; index += 1) {
    recordRiskScanVerifiedSettlement(verifiedSettlement(`request-${index}`));
  }

  const recorded = readRiskScanSettlementEvidence();

  assert.equal(recorded.length, 50);
  assert.equal(recorded[0].requestRef, "request-3");
  assert.equal(recorded.at(-1).requestRef, "request-52");

  recorded.length = 0;

  assert.equal(readRiskScanSettlementEvidence().length, 50);

  clearRiskScanSettlementEvidence();

  assert.equal(readRiskScanSettlementEvidence().length, 0);
});
