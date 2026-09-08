import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const paymentModuleSpecifier = "../src/riskscan-tool-payment.ts";
let paymentModule;
let paymentModuleError;
try {
  require.resolve(paymentModuleSpecifier);
  paymentModule = require(paymentModuleSpecifier);
} catch (error) {
  paymentModuleError = error;
}
const createRiskScanQuickPaymentAgent = paymentModule?.createRiskScanQuickPaymentAgent;
const paymentTest = paymentModuleError === undefined ? test : test.skip;

test("resolves the declared Agent payment module before functional contracts run", () => {
  if (paymentModuleError !== undefined) throw paymentModuleError;
  assert.equal(typeof createRiskScanQuickPaymentAgent, "function");
});

const base = new URL("http://service.test/example");
const input = {
  requestRef: "request-payment-42",
  subjectRef: "service:tool402",
  context: "caller disclosure review",
  declarations: { identity: true, pricing: true, limitations: true, evidence: true },
};
const policy = {
  network: "hedera:testnet",
  asset: "0.0.429274",
  maximumAmount: "10000",
};
const expectedAssessment = {
  requestRef: "request-payment-42",
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
};

const nativePayment = {
  state: "locally_configured",
  protocol: "x402",
  network: "hedera:testnet",
  asset: "0.0.429274",
  amount: "10000",
};

function directory(payment = nativePayment) {
  return {
    version: "v1",
    tools: [{
      id: "riskscan.quick",
      name: "RiskScan Quick",
      request: { method: "POST", path: "/api/riskscan", contentType: "application/json" },
      input: {
        type: "object",
        required: ["requestRef", "subjectRef", "context", "declarations"],
        properties: {
          requestRef: { type: "string", minLength: 1, maxLength: 96 },
          subjectRef: { type: "string", minLength: 1, maxLength: 160 },
          context: { type: "string", minLength: 1, maxLength: 280 },
          declarations: {
            type: "object",
            additionalProperties: false,
            required: ["identity", "pricing", "limitations", "evidence"],
            properties: {
              identity: { type: "boolean" },
              pricing: { type: "boolean" },
              limitations: { type: "boolean" },
              evidence: { type: "boolean" },
            },
          },
        },
      },
      limitations: ["quick_assessment_only", "caller_declarations_are_not_external_verification"],
      payment,
    }],
  };
}

function requirements(overrides = {}) {
  return {
    scheme: "exact",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
    payTo: "0.0.1002",
    maxTimeoutSeconds: 60,
    extra: {},
    ...overrides,
  };
}

function paymentRequired(overrides = {}) {
  return {
    x402Version: 2,
    resource: { url: "http://service.test/api/riskscan" },
    accepts: [requirements()],
    ...overrides,
  };
}

function paymentResponse(status, headers = {}, body = undefined) {
  const values = new Headers(headers);
  return {
    status,
    headers: { get(name) { return values.get(name); } },
    async json() {
      if (body instanceof Error) throw body;
      return body;
    },
  };
}

function createDependencies(overrides = {}) {
  const calls = {
    directory: [],
    request: [],
    factory: [],
    signer: 0,
    decode: 0,
    payload: 0,
    encode: 0,
    settlement: 0,
  };
  const signer = {
    accountId: "0.0.1001",
    async createPartiallySignedTransferTransaction() {
      calls.signer += 1;
      return "partially-signed-transaction";
    },
  };
  const payload = {
    x402Version: 2,
    accepted: requirements(),
    payload: { transaction: "encoded-transaction" },
  };
  const queuedResponses = [...(overrides.responses ?? [
    paymentResponse(402, { "payment-required": "required-header" }),
    paymentResponse(200, { "payment-response": "settled-header" }, expectedAssessment),
  ])];
  const paymentClient = {
    getPaymentRequiredResponse(getHeader) {
      calls.decode += 1;
      if (getHeader("payment-required") !== "required-header") {
        throw new Error("payment-required header is absent or changed");
      }
      return paymentRequired();
    },
    async createPaymentPayload(required) {
      calls.payload += 1;
      assert.deepEqual(required, paymentRequired());
      await signer.createPartiallySignedTransferTransaction(required.accepts[0]);
      return payload;
    },
    encodePaymentSignatureHeader(value) {
      calls.encode += 1;
      assert.equal(value, payload);
      return { "payment-signature": "signed-header" };
    },
    getPaymentSettleResponse(getHeader) {
      calls.settlement += 1;
      if (getHeader("payment-response") !== "settled-header") {
        throw new Error("payment-response header is absent or changed");
      }
      return { success: true, network: "hedera:testnet", transaction: "settlement-payment-42" };
    },
    ...overrides.paymentClient,
  };
  const directoryFetcher = overrides.directoryFetcher ?? (async (target, init) => {
    calls.directory.push([new URL(target), structuredClone(init)]);
    return Response.json(directory(overrides.directoryPayment));
  });
  const requestSender = overrides.requestSender ?? (async (target, init) => {
    calls.request.push([new URL(target), structuredClone(init)]);
    const next = queuedResponses.shift();
    if (next instanceof Error) throw next;
    if (next === undefined) throw new Error("unexpected extra request");
    return next;
  });
  const paymentClientFactory = overrides.paymentClientFactory ?? ((providedSigner, snapshot) => {
    calls.factory.push([providedSigner, snapshot]);
    return paymentClient;
  });
  const dependencies = {
    signer,
    directoryFetcher,
    requestSender,
    paymentClientFactory,
    ...overrides.dependencies,
  };
  return { calls, dependencies, signer, paymentClient };
}

function createHarness(overrides = {}) {
  const setup = createDependencies(overrides);
  return { ...setup, agent: createRiskScanQuickPaymentAgent(setup.dependencies) };
}

function assertOneDirectoryGet(calls) {
  assert.deepEqual(calls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
}

function assertNoPaymentAttempt(calls) {
  assert.equal(calls.request.length, 0);
  assert.equal(calls.factory.length, 0);
  assert.equal(calls.signer, 0);
  assert.equal(calls.payload, 0);
  assert.equal(calls.encode, 0);
  assert.equal(calls.settlement, 0);
}

paymentTest("discovers once, freezes the accepted policy, then sends one unsigned request and one signed retry", async () => {
  const harness = createHarness();
  const result = await harness.agent.pay(base, input, policy);

  assert.deepEqual(result, {
    kind: "paid",
    settlementRef: "settlement-payment-42",
    assessment: expectedAssessment,
  });
  assertOneDirectoryGet(harness.calls.directory);
  assert.deepEqual(harness.calls.request, [
    [
      new URL("http://service.test/api/riskscan"),
      {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(input),
        credentials: "omit",
        redirect: "error",
      },
    ],
    [
      new URL("http://service.test/api/riskscan"),
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "payment-signature": "signed-header",
        },
        body: JSON.stringify(input),
        credentials: "omit",
        redirect: "error",
      },
    ],
  ]);
  assert.equal(harness.calls.factory.length, 1);
  assert.equal(harness.calls.factory[0][0], harness.signer);
  assert.notEqual(harness.calls.factory[0][1], policy);
  assert.equal(Object.isFrozen(harness.calls.factory[0][1]), true);
  assert.deepEqual(harness.calls.factory[0][1], policy);
  assert.deepEqual(Object.keys(harness.calls.factory[0][1]).sort(), ["asset", "maximumAmount", "network"]);
  assert.deepEqual(harness.calls, {
    directory: harness.calls.directory,
    request: harness.calls.request,
    factory: harness.calls.factory,
    signer: 1,
    decode: 1,
    payload: 1,
    encode: 1,
    settlement: 1,
  });
});

paymentTest("rejects malformed construction dependencies synchronously without global-fetch fallback or other I/O", () => {
  const cases = [
    ["absent signer", { signer: undefined }],
    ["signer without the payment-signing method", { signer: { accountId: "0.0.1001" } }],
    ["non-function directory fetcher", { directoryFetcher: null }],
    ["non-function request sender", { requestSender: {} }],
    ["non-function payment client factory", { paymentClientFactory: 42 }],
  ];

  let globalFetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    globalFetchCalls += 1;
    throw new Error("global fetch must remain unused during dependency validation");
  };

  try {
    for (const [description, invalid] of cases) {
      const setup = createDependencies({ dependencies: invalid });
      assert.throws(
        () => createRiskScanQuickPaymentAgent(setup.dependencies),
        undefined,
        description,
      );
      assert.deepEqual(setup.calls, {
        directory: [], request: [], factory: [], signer: 0, decode: 0, payload: 0, encode: 0, settlement: 0,
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(globalFetchCalls, 0);
});

paymentTest("rejects invalid input before any directory, client, signer, or request access", async () => {
  const harness = createHarness();
  const result = await harness.agent.pay(base, { ...input, context: "   " }, policy);

  assert.deepEqual(result, { kind: "input_invalid" });
  assert.deepEqual(harness.calls, {
    directory: [], request: [], factory: [], signer: 0, decode: 0, payload: 0, encode: 0, settlement: 0,
  });
});

paymentTest("returns each discovery outcome without constructing a payment client or sending a request", async () => {
  const cases = [
    [
      async () => { throw new Error("directory offline"); },
      { kind: "directory_unavailable" },
    ],
    [
      async () => Response.json({ version: "v1", tools: [] }),
      { kind: "directory_invalid" },
    ],
  ];

  for (const [directoryFetcher, expected] of cases) {
    const harness = createHarness({ directoryFetcher });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, expected);
    assertNoPaymentAttempt(harness.calls);
  }
});

paymentTest("declines an over-budget quote after exactly one directory GET without signing or retrying", async () => {
  const harness = createHarness();
  const result = await harness.agent.pay(base, input, { ...policy, maximumAmount: "9999" });

  assert.deepEqual(result, { kind: "quote_declined", reason: "amount_exceeds_maximum" });
  assertOneDirectoryGet(harness.calls.directory);
  assertNoPaymentAttempt(harness.calls);
});

paymentTest("declines malformed canonical policy snapshots after exactly one directory GET without a payment attempt", async () => {
  const malformedPolicies = [
    { ...policy, network: "hedera:mainnet" },
    { ...policy, asset: "0.0.0429274" },
    { ...policy, maximumAmount: "01" },
  ];

  for (const malformedPolicy of malformedPolicies) {
    const harness = createHarness();
    const result = await harness.agent.pay(base, input, malformedPolicy);

    assert.deepEqual(result, { kind: "quote_declined", reason: "invalid_policy" });
    assertOneDirectoryGet(harness.calls.directory);
    assertNoPaymentAttempt(harness.calls);
  }
});

paymentTest("maps initial transport, unavailable, and unexpected responses without a payment payload", async () => {
  const cases = [
    [new Error("initial transport failed"), { kind: "transport_failure" }],
    [paymentResponse(503), { kind: "unavailable" }],
    [paymentResponse(200), { kind: "unexpected_response" }],
  ];

  for (const [firstResponse, expected] of cases) {
    const harness = createHarness({ responses: [firstResponse] });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, expected);
    assert.equal(harness.calls.request.length, 1);
    assert.equal(harness.calls.payload, 0);
    assert.equal(harness.calls.encode, 0);
    assert.equal(harness.calls.signer, 0);
  }
});

paymentTest("rejects absent, malformed, or changed x402 challenges before payload creation or retry", async () => {
  const changedRequirements = [
    [paymentRequired({ x402Version: 1 }), "wrong x402 version"],
    [paymentRequired({ accepts: [requirements({ scheme: "upto" })] }), "wrong scheme"],
    [paymentRequired({ accepts: [requirements({ network: "hedera:mainnet" })] }), "wrong network"],
    [paymentRequired({ accepts: [requirements({ asset: "0.0.429275" })] }), "wrong asset"],
    [paymentRequired({ accepts: [requirements({ amount: "9999" })] }), "wrong atomic amount"],
  ];

  for (const [required, description] of changedRequirements) {
    const harness = createHarness({
      paymentClient: {
        getPaymentRequiredResponse() { return required; },
      },
    });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, { kind: "challenge_invalid" }, description);
    assert.equal(harness.calls.request.length, 1);
    assert.equal(harness.calls.factory.length, 1);
    assert.equal(harness.calls.payload, 0);
    assert.equal(harness.calls.encode, 0);
    assert.equal(harness.calls.signer, 0);
  }

  const malformed = createHarness({
    responses: [paymentResponse(402)],
  });
  const malformedResult = await malformed.agent.pay(base, input, policy);
  assert.deepEqual(malformedResult, { kind: "challenge_invalid" });
  assert.equal(malformed.calls.request.length, 1);
  assert.equal(malformed.calls.payload, 0);
  assert.equal(malformed.calls.encode, 0);
  assert.equal(malformed.calls.signer, 0);
});

paymentTest("maps client construction and payload creation failures to a closed payment failure without a signed retry", async () => {
  const factoryFailure = createHarness({
    paymentClientFactory() { throw new Error("factory failure"); },
  });
  const factoryResult = await factoryFailure.agent.pay(base, input, policy);
  assert.deepEqual(factoryResult, { kind: "payment_failed", reason: "payment_payload_rejected" });
  assert.equal(factoryFailure.calls.request.length, 1);
  assert.equal(factoryFailure.calls.signer, 0);

  for (const paymentClient of [
    {
      async createPaymentPayload() { throw new Error("payload failure"); },
    },
    {
      encodePaymentSignatureHeader() { throw new Error("header failure"); },
    },
  ]) {
    const harness = createHarness({ paymentClient });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, { kind: "payment_failed", reason: "payment_payload_rejected" });
    assert.equal(harness.calls.request.length, 1);
    assert.equal(harness.calls.signer, 0);
  }
});

paymentTest("maps signed retry transport and status failures without a settlement reference", async () => {
  const cases = [
    [
      [paymentResponse(402, { "payment-required": "required-header" }), new Error("retry transport failed")],
      { kind: "transport_failure" },
    ],
    [
      [paymentResponse(402, { "payment-required": "required-header" }), paymentResponse(503)],
      { kind: "unavailable" },
    ],
    [
      [paymentResponse(402, { "payment-required": "required-header" }), paymentResponse(400)],
      { kind: "unexpected_response" },
    ],
  ];

  for (const [responses, expected] of cases) {
    const harness = createHarness({ responses });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, expected);
    assert.equal(harness.calls.request.length, 2);
    assert.equal(harness.calls.settlement, 0);
    assert.equal(Object.hasOwn(result, "settlementRef"), false);
  }
});

paymentTest("requires a successful matching settlement and an exact deterministic assessment before reporting paid", async () => {
  const settlementCases = [
    [{ success: false, network: "hedera:testnet", transaction: "settlement-payment-42" }, expectedAssessment],
    [{ success: true, network: "hedera:mainnet", transaction: "settlement-payment-42" }, expectedAssessment],
    [{ success: true, network: "hedera:testnet", transaction: "   " }, expectedAssessment],
    [{ success: true, network: "hedera:testnet", transaction: 42 }, expectedAssessment],
  ];

  for (const [settlement, body] of settlementCases) {
    const harness = createHarness({
      paymentClient: { getPaymentSettleResponse() { return settlement; } },
      responses: [
        paymentResponse(402, { "payment-required": "required-header" }),
        paymentResponse(200, { "payment-response": "settled-header" }, body),
      ],
    });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, { kind: "payment_failed", reason: "settlement_rejected" });
    assert.equal(Object.hasOwn(result, "settlementRef"), false);
  }

  const invalidBodies = [
    new Error("malformed paid response"),
    { ...expectedAssessment, requestRef: "other-request" },
    { ...expectedAssessment, subjectRef: "service:other" },
    { ...expectedAssessment, context: "other context" },
    { ...expectedAssessment, disposition: "needs_disclosure" },
    { ...expectedAssessment, reasons: ["changed nonempty reason", ...expectedAssessment.reasons.slice(1)] },
    { ...expectedAssessment, reasons: [...expectedAssessment.reasons].reverse() },
    { ...expectedAssessment, limitations: ["changed nonempty limitation"] },
    { ...expectedAssessment, reasons: [] },
    { ...expectedAssessment, limitations: [] },
  ];

  for (const body of invalidBodies) {
    const harness = createHarness({
      responses: [
        paymentResponse(402, { "payment-required": "required-header" }),
        paymentResponse(200, { "payment-response": "settled-header" }, body),
      ],
    });
    const result = await harness.agent.pay(base, input, policy);
    assert.deepEqual(result, { kind: "payment_failed", reason: "payment_response_invalid" });
    assert.equal(Object.hasOwn(result, "settlementRef"), false);
  }

  const malformedSettlementHeader = createHarness({
    paymentClient: { getPaymentSettleResponse() { throw new Error("malformed settlement header"); } },
  });
  const malformedSettlementResult = await malformedSettlementHeader.agent.pay(base, input, policy);
  assert.deepEqual(malformedSettlementResult, { kind: "payment_failed", reason: "payment_response_invalid" });
  assert.equal(Object.hasOwn(malformedSettlementResult, "settlementRef"), false);
});
