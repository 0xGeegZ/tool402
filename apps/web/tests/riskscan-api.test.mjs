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

function createSettlingLocalFacilitator(settle) {
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
      async settle(payload, requirements) {
        calls.settle += 1;
        return settle({ calls, payload, requirements });
      },
    },
  };
}

async function createSignedRequest(handler, body = validQuickInput()) {
  const challenge = await handler(createRequest(body));
  const requiredHeader = challenge.headers.get("payment-required");

  assert.equal(challenge.status, 402);
  assert.notEqual(requiredHeader, null);

  const paymentRequired = decodePaymentRequiredHeader(requiredHeader);
  const paymentSignature = encodePaymentSignatureHeader({
    x402Version: 2,
    accepted: paymentRequired.accepts[0],
    payload: {},
  });

  return createRequest(body, { "payment-signature": paymentSignature });
}

function successfulSettlement({ requirements }) {
  return {
    success: true,
    transaction: "settlement-api-42",
    network: requirements.network,
  };
}

function createDeferredSettlement() {
  const pending = [];
  const listeners = [];

  return {
    settle({ requirements }) {
      return new Promise((resolve) => {
        pending.push({ resolve, requirements });

        for (const listener of listeners.splice(0)) {
          listener();
        }
      });
    },
    async waitFor(count) {
      while (pending.length < count) {
        await new Promise((resolve) => listeners.push(resolve));
      }
    },
    release(index) {
      const entry = pending[index];
      assert.notEqual(entry, undefined);
      entry.resolve(successfulSettlement(entry));
    },
  };
}

test("observes only a successful protected settlement as a genuine core capability", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const settlements = [];
  const settlingFacilitator = createSettlingLocalFacilitator(successfulSettlement);
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: settlingFacilitator.client,
    onVerifiedSettlement: (settlement) => settlements.push(settlement),
  });

  const directResponse = await runRiskScanQuick(createRequest(validQuickInput()));
  const unsignedResponse = await handler(createRequest(validQuickInput()));
  const invalidRequest = await createSignedRequest(handler, {
    ...validQuickInput(),
    declarations: { identity: true },
  });
  const invalidResponse = await handler(invalidRequest);
  const signedRequest = await createSignedRequest(handler);
  const response = await handler(signedRequest);

  assert.equal(directResponse.status, 200);
  assert.equal(unsignedResponse.status, 402);
  assert.equal(invalidResponse.status, 400);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("payment-response") ?? "", /\S/u);
  assert.equal(settlements.length, 1);

  const core = require("@tool402/core");
  const bound = core.bindRiskScanReceiptEvidence(settlements[0], {
    receiptRef: "receipt-api-42",
    evidenceRef: "evidence-api-42",
  });

  assert.deepEqual(bound, {
    requestRef: "request-api-42",
    settlementRef: "settlement-api-42",
    receiptRef: "receipt-api-42",
    evidenceRef: "evidence-api-42",
  });
});

test("rejects malformed settlement successes before releasing protected output", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  for (const [description, settlement] of [
    ["failed settlement", ({ requirements }) => ({ success: false, network: requirements.network, transaction: "failed" })],
    ["wrong network", () => ({ success: true, network: "eip155:1", transaction: "wrong-network" })],
    ["blank transaction", ({ requirements }) => ({ success: true, network: requirements.network, transaction: "  " })],
    ["non-string transaction", ({ requirements }) => ({ success: true, network: requirements.network, transaction: 42 })],
    ["truthy non-boolean success", ({ requirements }) => ({ success: "true", network: requirements.network, transaction: "truthy-success" })],
    ["missing success", ({ requirements }) => ({ network: requirements.network, transaction: "missing-success" })],
  ]) {
    const settlements = [];
    const settlingFacilitator = createSettlingLocalFacilitator(settlement);
    const handler = await createRiskScanProtectedHandler(configuration, {
      facilitatorClient: settlingFacilitator.client,
      onVerifiedSettlement: (value) => settlements.push(value),
    });
    const response = await handler(await createSignedRequest(handler));

    assert.equal(settlements.length, 0, description);
    assert.match(response.headers.get("payment-response") ?? "", /\S/u, description);
    assert.equal(response.status, 402, description);
    assert.doesNotMatch(await response.clone().text(), /"disposition"/u, description);
  }
});

test("isolates synchronous and rejected settlement consumers from protected responses", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  for (const consumer of [
    () => {
      throw new Error("consumer failure");
    },
    async () => Promise.reject(new Error("consumer rejection")),
  ]) {
    const settlingFacilitator = createSettlingLocalFacilitator(successfulSettlement);
    const handler = await createRiskScanProtectedHandler(configuration, {
      facilitatorClient: settlingFacilitator.client,
      onVerifiedSettlement: consumer,
    });
    const response = await handler(await createSignedRequest(handler));

    assert.equal(response.status, 200);
    assert.match(response.headers.get("payment-response") ?? "", /\S/u);
  }
});

test("discards duplicate active payment signatures when their Quick response bytes differ", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const settlements = [];
  const deferred = createDeferredSettlement();
  const settlingFacilitator = createSettlingLocalFacilitator((context) =>
    deferred.settle(context),
  );
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: settlingFacilitator.client,
    onVerifiedSettlement: (settlement) => settlements.push(settlement),
  });
  const firstRequest = await createSignedRequest(handler);
  const secondRequest = createRequest(
    { ...validQuickInput(), requestRef: "request-api-43" },
    { "payment-signature": firstRequest.headers.get("payment-signature") },
  );

  const firstResponse = handler(firstRequest);
  await deferred.waitFor(1);
  const secondResponse = handler(secondRequest);
  await deferred.waitFor(2);
  deferred.release(1);
  const resolvedSecondResponse = await secondResponse;
  deferred.release(0);
  const resolvedFirstResponse = await firstResponse;

  assert.equal(settlements.length, 0);
  for (const response of [resolvedFirstResponse, resolvedSecondResponse]) {
    assert.equal(response.status, 200);
    assert.match(response.headers.get("payment-response") ?? "", /\S/u);
  }
});

test("expires a protected settlement observation before a delayed facilitator result", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const settlements = [];
  const deferred = createDeferredSettlement();
  const settlingFacilitator = createSettlingLocalFacilitator((context) =>
    deferred.settle(context),
  );
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: settlingFacilitator.client,
    onVerifiedSettlement: (settlement) => settlements.push(settlement),
    settlementObserverTimeoutMs: 10,
  });
  const response = handler(await createSignedRequest(handler));

  await deferred.waitFor(1);
  await new Promise((resolve) => setTimeout(resolve, 30));
  deferred.release(0);
  const resolvedResponse = await response;

  assert.equal(settlements.length, 0);
  assert.equal(resolvedResponse.status, 200);
  assert.match(resolvedResponse.headers.get("payment-response") ?? "", /\S/u);
});

test("isolates core capability failures and validates the local timeout seam", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const settlingFacilitator = createSettlingLocalFacilitator(successfulSettlement);
  await assert.rejects(
    () =>
      createRiskScanProtectedHandler(configuration, {
        facilitatorClient: settlingFacilitator.client,
        onVerifiedSettlement: () => {},
        settlementObserverTimeoutMs: 0,
      }),
    RangeError,
  );

  const settlements = [];
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: settlingFacilitator.client,
    onVerifiedSettlement: (settlement) => settlements.push(settlement),
  });
  const signedRequest = await createSignedRequest(handler);
  const originalLoad = Module._load;

  Module._load = function loadRiskScanCoreWithCapabilityFault(
    request,
    parent,
    isMain,
  ) {
    const loaded = originalLoad.call(this, request, parent, isMain);

    return request === "@tool402/core"
      ? {
          ...loaded,
          createRiskScanVerifiedSettlement() {
            throw new Error("core capability failure");
          },
        }
      : loaded;
  };

  try {
    const failedResponse = await handler(signedRequest);
    assert.equal(failedResponse.status, 200);
    assert.match(failedResponse.headers.get("payment-response") ?? "", /\S/u);
    const directResponse = await runRiskScanQuick(createRequest(validQuickInput()));
    assert.deepEqual(
      await failedResponse.clone().json(),
      await directResponse.json(),
    );
  } finally {
    Module._load = originalLoad;
  }

  const recoveredResponse = await handler(
    createRequest(validQuickInput(), {
      "payment-signature": signedRequest.headers.get("payment-signature"),
    }),
  );

  assert.equal(settlements.length, 1);
  assert.equal(recoveredResponse.status, 200);
  assert.match(recoveredResponse.headers.get("payment-response") ?? "", /\S/u);
});

test("pins protected settlement observation to after-handler authorization", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const phases = [];
  const settlements = [];
  let forceAuthorization = false;
  const originalLoad = Module._load;

  Module._load = function loadUpfrontExactScheme(request, parent, isMain) {
    const loaded = originalLoad.call(this, request, parent, isMain);

    if (request === "@x402/core/server") {
      return {
        ...loaded,
        x402ResourceServer: class extends loaded.x402ResourceServer {
          getPaymentFlow(payload, requirements) {
            return forceAuthorization
              ? "authorization"
              : super.getPaymentFlow(payload, requirements);
          }
          onAfterSettle(hook) {
            return super.onAfterSettle(async (context) => {
              phases.push(context.phase);
              await hook(context);
            });
          }
        },
      };
    }

    if (request === "@x402/evm/exact/server") {
      return {
        ...loaded,
        ExactEvmScheme: class extends loaded.ExactEvmScheme {
          constructor() {
            super();
            this.paymentFlows.eip3009.default = "upfront";
          }
        },
      };
    }

    return loaded;
  };

  try {
    const settlingFacilitator = createSettlingLocalFacilitator(successfulSettlement);
    const handler = await createRiskScanProtectedHandler(configuration, {
      facilitatorClient: settlingFacilitator.client,
      onVerifiedSettlement: (settlement) => settlements.push(settlement),
    });
    const firstRequest = await createSignedRequest(handler);
    const firstResponse = await handler(firstRequest);
    forceAuthorization = true;
    const secondResponse = await handler(
      createRequest(
        { ...validQuickInput(), requestRef: "request-api-43" },
        { "payment-signature": firstRequest.headers.get("payment-signature") },
      ),
    );

    for (const response of [firstResponse, secondResponse]) {
      assert.equal(response.status, 200);
      assert.match(response.headers.get("payment-response") ?? "", /\S/u);
    }
  } finally {
    Module._load = originalLoad;
  }

  assert.deepEqual(phases, ["after-handler", "after-handler"]);
  assert.deepEqual(
    settlements.map((settlement) => settlement.requestRef),
    ["request-api-42", "request-api-43"],
  );
});

test("cancels an active observation when a later protected handler throws", async () => {
  const configuration = readRiskScanX402Configuration(configuredEnvironment());
  assert.notEqual(configuration, null);

  const settlements = [];
  const deferred = createDeferredSettlement();
  const settlingFacilitator = createSettlingLocalFacilitator((context) =>
    deferred.settle(context),
  );
  const handler = await createRiskScanProtectedHandler(configuration, {
    facilitatorClient: settlingFacilitator.client,
    onVerifiedSettlement: (settlement) => settlements.push(settlement),
  });
  const firstRequest = await createSignedRequest(handler);
  const firstResponse = handler(firstRequest);

  await deferred.waitFor(1);
  const originalLoad = Module._load;
  Module._load = function loadRiskScanQuickWithProtectedFault(
    request,
    parent,
    isMain,
  ) {
    const loaded = originalLoad.call(this, request, parent, isMain);

    return request === "@tool402/core"
      ? {
          ...loaded,
          assessRiskScanQuick(input) {
            if (input.requestRef === "request-api-43") {
              throw new Error("protected Quick fault");
            }

            return loaded.assessRiskScanQuick(input);
          },
        }
      : loaded;
  };

  try {
    await assert.rejects(
      () =>
        handler(
          createRequest(
            { ...validQuickInput(), requestRef: "request-api-43" },
            { "payment-signature": firstRequest.headers.get("payment-signature") },
          ),
        ),
      /protected Quick fault/u,
    );
  } finally {
    Module._load = originalLoad;
  }

  deferred.release(0);
  const resolvedFirstResponse = await firstResponse;

  assert.equal(settlements.length, 0);
  assert.equal(resolvedFirstResponse.status, 200);
  assert.match(resolvedFirstResponse.headers.get("payment-response") ?? "", /\S/u);
});
