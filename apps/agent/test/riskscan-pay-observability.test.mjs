import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
let observabilityModule;
let observabilityModuleError;
try {
  observabilityModule = require("../src/riskscan-pay-observability.ts");
} catch (error) {
  observabilityModuleError = error;
}

const observabilityTest = observabilityModuleError === undefined ? test : test.skip;

test("resolves the declared private B03 observability module before its contracts run", () => {
  if (observabilityModuleError !== undefined) throw observabilityModuleError;
});

const quote = {
  network: "hedera:testnet",
  asset: "0.0.429274",
  amount: "10000",
};

const paymentRequired = {
  x402Version: 2,
  resource: { url: "http://service.test/api/riskscan" },
  accepts: [{
    scheme: "exact",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
    payTo: "0.0.1002",
    maxTimeoutSeconds: 60,
    extra: {},
  }],
};

observabilityTest("maps CLI boundaries to the closed redacted diagnostic allowlist", () => {
  const { diagnosticForRiskScanPayPhase, formatRiskScanPayDiagnostic } = observabilityModule;
  const vectors = [
    [{ phase: "configuration" }, "CONFIGURATION_INVALID"],
    [{ phase: "directory" }, "DIRECTORY_FAILED"],
    [{ phase: "quote" }, "QUOTE_DECLINED"],
    [{ phase: "initial_request" }, "INITIAL_REQUEST_OR_CHALLENGE_FAILED"],
    [{ phase: "payment_payload" }, "PAYMENT_PAYLOAD_OR_SIGNING_FAILED"],
    [{ phase: "signed_retry" }, "SIGNED_RETRY_FAILED"],
    [{ phase: "settlement" }, "SETTLEMENT_OR_RESULT_FAILED"],
    [{ phase: "result", outcome: { kind: "paid" } }, "PAID"],
    [{ phase: "terminal" }, "TERMINAL_UNEXPECTED_FAILURE"],
  ];

  for (const [input, expected] of vectors) {
    const code = diagnosticForRiskScanPayPhase(input);
    assert.equal(code, expected);
    assert.equal(formatRiskScanPayDiagnostic(code), `RISKSCAN_PAY_DIAGNOSTIC ${expected}\n`);
    assert.doesNotMatch(formatRiskScanPayDiagnostic(code), /SECRET_SENTINEL_B03/u);
  }
});

observabilityTest("accepts only the exact initial challenge before the preflight guard", () => {
  const { matchesRiskScanPayPreflightChallenge } = observabilityModule;

  assert.equal(matchesRiskScanPayPreflightChallenge(paymentRequired, quote), true);
  assert.equal(matchesRiskScanPayPreflightChallenge({ ...paymentRequired, accepts: [{ ...paymentRequired.accepts[0], amount: "10001" }] }, quote), false);
  assert.equal(matchesRiskScanPayPreflightChallenge({ ...paymentRequired, accepts: [] }, quote), false);
});
