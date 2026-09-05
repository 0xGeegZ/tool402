import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const { NextRequest } = require("next/server");
const {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} = require("@x402/core/http");
const {
  createRiskScanProtectedHandler,
  handleRiskScanPost,
  isRiskScanX402ConfigurationUsable,
  readRiskScanX402Configuration,
  runRiskScanQuick,
} = require("../src/lib/riskscan-x402.ts");

const configurationKeys = [
  "RISKSCAN_X402_PAY_TO",
  "RISKSCAN_X402_FACILITATOR_URL",
  "RISKSCAN_X402_NETWORK",
  "RISKSCAN_X402_PRICE",
];

function createRequest(body = {}, headers = {}) {
  return createRawRequest(JSON.stringify(body), headers);
}

function createRawRequest(body, headers = {}) {
  return new NextRequest("http://tool402.test/api/riskscan", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

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
    requestRef: "request-api-42",
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

function createLocalFacilitator() {
  const calls = {
    getSupported: 0,
    verify: 0,
    settle: 0,
  };

  return {
    calls,
    client: {
      async getSupported() {
        calls.getSupported += 1;

        return {
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: "eip155:84532",
            },
          ],
          extensions: [],
          signers: {},
        };
      },
      async verify() {
        calls.verify += 1;
        throw new Error("an unsigned request must not be verified");
      },
      async settle() {
        calls.settle += 1;
        throw new Error("an unsigned request must not be settled");
      },
    },
  };
}

function createUnsupportedLocalFacilitator() {
  const calls = {
    getSupported: 0,
  };

  return {
    calls,
    client: {
      async getSupported() {
        calls.getSupported += 1;

        return {
          kinds: [],
          extensions: [],
          signers: {},
        };
      },
      async verify() {
        throw new Error("verification must not run without a supported kind");
      },
      async settle() {
        throw new Error("settlement must not run without a supported kind");
      },
    },
  };
}

function createMismatchedNetworkLocalFacilitator() {
  const calls = {
    getSupported: 0,
    verify: 0,
    settle: 0,
  };

  return {
    calls,
    client: {
      async getSupported() {
        calls.getSupported += 1;

        return {
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: "eip155:1",
            },
          ],
          extensions: [],
          signers: {},
        };
      },
      async verify() {
        calls.verify += 1;
        throw new Error("verification must not run for an unsupported network");
      },
      async settle() {
        calls.settle += 1;
        throw new Error("settlement must not run for an unsupported network");
      },
    },
  };
}

function createVerifiedLocalFacilitator() {
  const calls = {
    getSupported: 0,
    verify: 0,
    settle: 0,
  };

  return {
    calls,
    client: {
      async getSupported() {
        calls.getSupported += 1;

        return {
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: "eip155:84532",
            },
          ],
          extensions: [],
          signers: {},
        };
      },
      async verify() {
        calls.verify += 1;
        return { isValid: true };
      },
      async settle() {
        calls.settle += 1;
        throw new Error("a malformed request must not settle");
      },
    },
  };
}

async function withoutRiskScanConfiguration(run) {
  const original = new Map(
    configurationKeys.map((key) => [key, process.env[key]]),
  );

  for (const key of configurationKeys) {
    delete process.env[key];
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("returns an unavailable response without a payment challenge when x402 configuration is absent", async () => {
  assert.equal(
    typeof handleRiskScanPost,
    "function",
    "the API boundary must expose its request handler",
  );

  const response = await withoutRiskScanConfiguration(() =>
    handleRiskScanPost(createRequest(), process.env),
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("payment-required"), null);
  assert.deepEqual(await response.json(), { error: "risk_scan_unavailable" });
});

test("accepts only a complete strict EVM x402 configuration", () => {
  assert.equal(
    typeof readRiskScanX402Configuration,
    "function",
    "the x402 boundary must parse its runtime configuration",
  );

  const configuration = configuredEnvironment();

  assert.deepEqual(readRiskScanX402Configuration(configuration), {
    payTo: configuration.RISKSCAN_X402_PAY_TO,
    facilitatorUrl: configuration.RISKSCAN_X402_FACILITATOR_URL,
    network: configuration.RISKSCAN_X402_NETWORK,
    price: configuration.RISKSCAN_X402_PRICE,
  });

  for (const [description, override] of [
    ["blank recipient", { RISKSCAN_X402_PAY_TO: " " }],
    ["invalid recipient", { RISKSCAN_X402_PAY_TO: "0xabc" }],
    ["unencrypted facilitator", { RISKSCAN_X402_FACILITATOR_URL: "http://facilitator.invalid" }],
    ["facilitator userinfo", { RISKSCAN_X402_FACILITATOR_URL: "https://operator@facilitator.invalid" }],
    ["non-EVM network", { RISKSCAN_X402_NETWORK: "solana:mainnet" }],
    ["non-numeric chain", { RISKSCAN_X402_NETWORK: "eip155:chain" }],
    ["zero price", { RISKSCAN_X402_PRICE: "$0" }],
    ["signed price", { RISKSCAN_X402_PRICE: "$-0.01" }],
    ["exponent price", { RISKSCAN_X402_PRICE: "$1e-2" }],
  ]) {
    assert.equal(
      readRiskScanX402Configuration({ ...configuration, ...override }),
      null,
      description,
    );
  }
});

test("permits only prices the local exact EVM scheme can represent above zero", async () => {
  assert.equal(
    typeof isRiskScanX402ConfigurationUsable,
    "function",
    "the API boundary must validate exact EVM price representation before startup",
  );

  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  const atomicConfiguration = readRiskScanX402Configuration({
    ...configuredEnvironment(),
    RISKSCAN_X402_PRICE: "$0.000001",
  });
  const subAtomicConfiguration = readRiskScanX402Configuration({
    ...configuredEnvironment(),
    RISKSCAN_X402_PRICE: "$0.0000001",
  });
  const highPrecisionConfiguration = readRiskScanX402Configuration({
    ...configuredEnvironment(),
    RISKSCAN_X402_NETWORK: "eip155:4326",
    RISKSCAN_X402_PRICE: "$0.0000001",
  });
  const unsupportedNetworkConfiguration = readRiskScanX402Configuration({
    ...configuredEnvironment(),
    RISKSCAN_X402_NETWORK: "eip155:999999",
  });

  assert.notEqual(configuration, null);
  assert.notEqual(atomicConfiguration, null);
  assert.notEqual(subAtomicConfiguration, null);
  assert.notEqual(highPrecisionConfiguration, null);
  assert.notEqual(unsupportedNetworkConfiguration, null);
  assert.equal(await isRiskScanX402ConfigurationUsable(configuration), true);
  assert.equal(
    await isRiskScanX402ConfigurationUsable(atomicConfiguration),
    true,
  );
  assert.equal(
    await isRiskScanX402ConfigurationUsable(subAtomicConfiguration),
    false,
  );
  assert.equal(
    await isRiskScanX402ConfigurationUsable(highPrecisionConfiguration),
    true,
  );
  assert.equal(
    await isRiskScanX402ConfigurationUsable(unsupportedNetworkConfiguration),
    false,
  );
});

test("keeps malformed x402 configuration unavailable rather than challenging", async () => {
  const response = await handleRiskScanPost(createRequest(), {
    ...configuredEnvironment(),
    RISKSCAN_X402_PRICE: "$0",
  });

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("payment-required"), null);
  assert.deepEqual(await response.json(), { error: "risk_scan_unavailable" });
});

test("keeps unpriceable exact EVM configuration unavailable before facilitator startup", async () => {
  for (const [description, environment] of [
    [
      "sub-atomic price",
      { ...configuredEnvironment(), RISKSCAN_X402_PRICE: "$0.0000001" },
    ],
    [
      "unknown default asset",
      { ...configuredEnvironment(), RISKSCAN_X402_NETWORK: "eip155:999999" },
    ],
  ]) {
    const unsupportedFacilitator = createUnsupportedLocalFacilitator();
    const response = await handleRiskScanPost(
      createRequest(),
      environment,
      { facilitatorClient: unsupportedFacilitator.client },
    );

    assert.equal(response.status, 503, description);
    assert.equal(response.headers.get("payment-required"), null, description);
    assert.deepEqual(
      await response.json(),
      { error: "risk_scan_unavailable" },
      description,
    );
    assert.equal(unsupportedFacilitator.calls.getSupported, 0, description);
  }
});

test("returns unavailable when explicit facilitator initialization cannot establish support", async () => {
  const unsupportedFacilitator = createUnsupportedLocalFacilitator();
  const response = await handleRiskScanPost(
    createRequest(),
    configuredEnvironment(),
    { facilitatorClient: unsupportedFacilitator.client },
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("payment-required"), null);
  assert.deepEqual(await response.json(), { error: "risk_scan_unavailable" });
  assert.equal(unsupportedFacilitator.calls.getSupported, 1);
});

test("keeps a facilitator network mismatch unavailable before it can challenge", async () => {
  const mismatchedFacilitator = createMismatchedNetworkLocalFacilitator();
  const response = await handleRiskScanPost(
    createRequest(validQuickInput()),
    configuredEnvironment(),
    { facilitatorClient: mismatchedFacilitator.client },
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("payment-required"), null);
  assert.deepEqual(await response.json(), { error: "risk_scan_unavailable" });
  assert.equal(mismatchedFacilitator.calls.getSupported, 1);
  assert.equal(mismatchedFacilitator.calls.verify, 0);
  assert.equal(mismatchedFacilitator.calls.settle, 0);
});

test("issues a real x402 payment challenge before it runs Quick", async () => {
  assert.equal(
    typeof createRiskScanProtectedHandler,
    "function",
    "the API boundary must create an x402-protected handler",
  );

  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const localFacilitator = createLocalFacilitator();
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: localFacilitator.client,
  });
  const response = await handler(createRequest(validQuickInput()));

  assert.equal(response.status, 402);
  assert.match(response.headers.get("payment-required") ?? "", /\S/u);
  assert.equal(response.headers.get("payment-response"), null);
  assert.equal(localFacilitator.calls.getSupported, 1);
  assert.equal(localFacilitator.calls.verify, 0);
  assert.equal(localFacilitator.calls.settle, 0);
  assert.equal("disposition" in (await response.json()), false);
});

test("initializes the facilitator before it wraps a protected handler", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const unsupportedFacilitator = createUnsupportedLocalFacilitator();

  await assert.rejects(
    () =>
      createRiskScanProtectedHandler(configuration, {
        facilitatorClient: unsupportedFacilitator.client,
      }),
    Error,
  );
  assert.equal(unsupportedFacilitator.calls.getSupported, 1);
});

test("does not settle a locally verified malformed protected request", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const verifiedFacilitator = createVerifiedLocalFacilitator();
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: verifiedFacilitator.client,
  });
  const challenge = await handler(createRequest(validQuickInput()));
  const requiredHeader = challenge.headers.get("payment-required");

  assert.equal(challenge.status, 402);
  assert.notEqual(requiredHeader, null);

  const paymentRequired = decodePaymentRequiredHeader(requiredHeader);
  const paymentSignature = encodePaymentSignatureHeader({
    x402Version: 2,
    accepted: paymentRequired.accepts[0],
    payload: {},
  });
  const response = await handler(
    createRequest(
      { ...validQuickInput(), declarations: { identity: true } },
      { "payment-signature": paymentSignature },
    ),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_riskscan_request" });
  assert.equal(response.headers.get("payment-response"), null);
  assert.equal(verifiedFacilitator.calls.verify, 1);
  assert.equal(verifiedFacilitator.calls.settle, 0);
});

test("runs only the deterministic Quick result for a valid request", async () => {
  assert.equal(
    typeof runRiskScanQuick,
    "function",
    "the API boundary must expose the protected Quick handler",
  );

  const response = await runRiskScanQuick(createRequest(validQuickInput()));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    requestRef: "request-api-42",
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
  assert.equal(response.headers.get("payment-response"), null);
});

test("rejects malformed Quick input without a settlement response", async () => {
  assert.equal(
    typeof runRiskScanQuick,
    "function",
    "the API boundary must expose the protected Quick handler",
  );

  const response = await runRiskScanQuick(
    createRequest({ ...validQuickInput(), declarations: { identity: true } }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_riskscan_request" });
  assert.equal(response.headers.get("payment-response"), null);
});

test("rejects malformed JSON without a settlement response", async () => {
  const response = await runRiskScanQuick(createRawRequest("{"));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_riskscan_request" });
  assert.equal(response.headers.get("payment-response"), null);
});

test("does not classify a Quick module fault as invalid client input", async () => {
  const originalLoad = Module._load;

  Module._load = function loadRiskScanQuickWithFault(request, parent, isMain) {
    if (request === "@tool402/core") {
      throw new Error("Quick module unavailable");
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    await assert.rejects(
      () => runRiskScanQuick(createRequest(validQuickInput())),
      /Quick module unavailable/u,
    );
  } finally {
    Module._load = originalLoad;
  }
});
