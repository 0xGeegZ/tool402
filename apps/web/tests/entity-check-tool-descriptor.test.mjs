import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const descriptorUrl = new URL("../src/lib/entity-check-tool-descriptor.ts", import.meta.url);
const missingDescriptor = existsSync(descriptorUrl) ? [] : [descriptorUrl.pathname];
const implementedTest = missingDescriptor.length === 0 ? test : test.skip;

let buildEntityCheckToolDescriptor;

const configuredEvmEnvironment = {
  ENTITYCHECK_X402_PAY_TO: `0x${"1".repeat(40)}`,
  ENTITYCHECK_X402_FACILITATOR_URL: "https://facilitator.invalid/controlled-private-path",
  ENTITYCHECK_X402_NETWORK: "eip155:84532",
  ENTITYCHECK_X402_PRICE: "$0.01",
};

const configuredHederaEnvironment = {
  ENTITYCHECK_X402_PAY_TO: "0.0.1111",
  ENTITYCHECK_X402_FACILITATOR_URL: "https://facilitator.invalid/controlled-private-path",
  ENTITYCHECK_X402_NETWORK: "hedera:testnet",
  ENTITYCHECK_X402_HEDERA_ASSET: "0.0.429274",
  ENTITYCHECK_X402_HEDERA_AMOUNT: "10000",
};

function expectedDescriptor(configuration) {
  return {
    id: "entitycheck.fr",
    name: "EntityCheck France",
    request: { method: "POST", path: "/api/entitycheck", contentType: "application/json" },
    input: {
      type: "object",
      required: ["requestRef", "jurisdiction", "query"],
      properties: {
        requestRef: { type: "string", minLength: 1, maxLength: 96 },
        jurisdiction: { type: "string", enum: ["FR"] },
        query: { type: "string", minLength: 1, maxLength: 160 },
        registrationNumber: { type: "string", pattern: "^[0-9]{9}$" },
      },
      additionalProperties: false,
    },
    result: {
      dispositions: ["found", "ambiguous", "not_found"],
      sanctionsScreen: ["clear", "hit", "not_screened"],
    },
    sources: ["FR_RECHERCHE_ENTREPRISES", "OFAC_SDN"],
    limitations: [
      "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.",
    ],
    configuration,
  };
}

test("requires the declared EntityCheck descriptor module before GREEN", () => {
  assert.deepEqual(
    missingDescriptor,
    [],
    `missing declared EntityCheck descriptor module(s): ${missingDescriptor.join(", ")}`,
  );
});

test.before(async () => {
  if (missingDescriptor.length === 0) {
    ({ buildEntityCheckToolDescriptor } = await import(descriptorUrl.href));
  }
});

implementedTest("describes the exact bounded France capability with a fail-closed configuration summary", () => {
  assert.deepEqual(
    buildEntityCheckToolDescriptor({}),
    expectedDescriptor({ state: "configuration_required" }),
  );
});

implementedTest("fails closed for missing or malformed EntityCheck x402 configuration", () => {
  const malformed = {
    ENTITYCHECK_X402_PAY_TO: ["", "recipient", `0x${"1".repeat(39)}`],
    ENTITYCHECK_X402_FACILITATOR_URL: ["", "http://facilitator.invalid", "https://user:secret@facilitator.invalid"],
    ENTITYCHECK_X402_NETWORK: ["", "eip155:0", "eip155:01", "other:1"],
    ENTITYCHECK_X402_PRICE: ["", "$0", "0.01", "$-1"],
  };

  for (const [key, values] of Object.entries(malformed)) {
    for (const value of [undefined, ...values]) {
      assert.deepEqual(
        buildEntityCheckToolDescriptor({ ...configuredEvmEnvironment, [key]: value }),
        expectedDescriptor({ state: "configuration_required" }),
      );
    }
  }
});

implementedTest("serializes only the parsed EVM configuration summary", () => {
  assert.deepEqual(
    buildEntityCheckToolDescriptor({
      ...configuredEvmEnvironment,
      ENTITYCHECK_X402_NETWORK: " eip155:11155111 ",
      ENTITYCHECK_X402_PRICE: " $1.25 ",
    }),
    expectedDescriptor({
      state: "locally_configured",
      protocol: "x402",
      network: "eip155:11155111",
      price: "$1.25",
    }),
  );
});

implementedTest("serializes only the parsed native Hedera configuration summary", () => {
  assert.deepEqual(
    buildEntityCheckToolDescriptor(configuredHederaEnvironment),
    expectedDescriptor({
      state: "locally_configured",
      protocol: "x402",
      network: "hedera:testnet",
      asset: "0.0.429274",
      amount: "10000",
    }),
  );
});

implementedTest("fails closed for missing or malformed native Hedera payment configuration", () => {
  for (const [description, overrides] of [
    ["missing asset", { ENTITYCHECK_X402_HEDERA_ASSET: undefined }],
    ["malformed asset", { ENTITYCHECK_X402_HEDERA_ASSET: "not-an-asset" }],
    ["missing amount", { ENTITYCHECK_X402_HEDERA_AMOUNT: undefined }],
    ["malformed amount", { ENTITYCHECK_X402_HEDERA_AMOUNT: "not-an-amount" }],
  ]) {
    assert.deepEqual(
      buildEntityCheckToolDescriptor({ ...configuredHederaEnvironment, ...overrides }),
      expectedDescriptor({ state: "configuration_required" }),
      description,
    );
  }
});

implementedTest("never serializes controlled private EntityCheck environment values", () => {
  const privateValues = {
    CREDENTIAL: "controlled-credential-secret",
    PAYMENT_SIGNATURE: "controlled-payment-header",
    PAYMENT_PAYLOAD: "controlled-payment-payload",
    WALLET: "controlled-wallet-material",
    ACCOUNT: "controlled-account-material",
    TRANSACTION: "controlled-transaction-reference",
    RECEIPT: "controlled-receipt-reference",
    EVIDENCE: "controlled-evidence-reference",
    RESULT: "controlled-result-content",
  };
  const privateEnvironment = {
    ...configuredEvmEnvironment,
    ...privateValues,
  };
  const body = JSON.stringify(buildEntityCheckToolDescriptor(Object.freeze(privateEnvironment)));

  for (const value of [
    ...Object.values(privateValues),
    privateEnvironment.ENTITYCHECK_X402_PAY_TO,
    privateEnvironment.ENTITYCHECK_X402_FACILITATOR_URL,
  ]) {
    assert.equal(body.includes(value), false);
  }
});

implementedTest("constructs fresh descriptors without network, clock, random, or loader calls", (t) => {
  const forbidden = () => { throw new Error("external or state-changing operation is forbidden"); };
  const Module = require("node:module");
  t.mock.method(Module, "_load", forbidden);
  for (const name of ["fetch", "Date", "setTimeout", "setInterval", "setImmediate"]) {
    t.mock.method(globalThis, name, forbidden);
  }
  t.mock.method(Math, "random", forbidden);

  const first = buildEntityCheckToolDescriptor(Object.freeze(configuredEvmEnvironment));
  first.input.required.push("unexpected");
  assert.deepEqual(
    buildEntityCheckToolDescriptor({}),
    expectedDescriptor({ state: "configuration_required" }),
  );
});
