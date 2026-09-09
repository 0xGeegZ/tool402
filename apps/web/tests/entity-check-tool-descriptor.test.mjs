import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sourceUrl = new URL(
  "../src/lib/entity-check-tool-descriptor.ts",
  import.meta.url,
);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let buildEntityCheckToolDescriptor;
let buildToolDirectory;

const baselineLimitation =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";

const configuredEnvironment = {
  ENTITYCHECK_X402_PAY_TO: `0x${"2".repeat(40)}`,
  ENTITYCHECK_X402_FACILITATOR_URL:
    "https://facilitator.invalid/controlled-private-path",
  ENTITYCHECK_X402_NETWORK: "eip155:84532",
  ENTITYCHECK_X402_PRICE: "$0.02",
};

const configuredHederaEnvironment = {
  ENTITYCHECK_X402_PAY_TO: "0.0.3333",
  ENTITYCHECK_X402_FACILITATOR_URL:
    "https://facilitator.invalid/controlled-private-path",
  ENTITYCHECK_X402_NETWORK: "hedera:testnet",
  ENTITYCHECK_X402_HEDERA_ASSET: "0.0.429274",
  ENTITYCHECK_X402_HEDERA_AMOUNT: "20000",
};

export const expectedEntityCheckDescriptor = {
  id: "entitycheck.fr",
  name: "EntityCheck France",
  request: {
    method: "POST",
    path: "/api/entitycheck",
    contentType: "application/json",
  },
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
  limitations: [baselineLimitation],
};

test("requires the declared EntityCheck descriptor module before GREEN", () => {
  assert.equal(
    sourceExists,
    true,
    `missing declared source module: ${sourcePath}`,
  );
});

test.before(() => {
  if (!sourceExists) return;
  ({
    buildEntityCheckToolDescriptor,
  } = require("../src/lib/entity-check-tool-descriptor.ts"));
  ({ buildToolDirectory } = require("../src/lib/tool-directory.ts"));
});

implementedTest(
  "describes the exact EntityCheck descriptor with a fail-closed configuration summary",
  () => {
    assert.deepEqual(buildEntityCheckToolDescriptor({}), {
      ...expectedEntityCheckDescriptor,
      configuration: { state: "configuration_required" },
    });
    const malformed = {
      ENTITYCHECK_X402_PAY_TO: ["", "recipient", `0x${"2".repeat(39)}`],
      ENTITYCHECK_X402_FACILITATOR_URL: [
        "",
        "http://facilitator.invalid",
        "https://user:secret@facilitator.invalid",
      ],
      ENTITYCHECK_X402_NETWORK: ["", "eip155:0", "eip155:01", "other:1"],
      ENTITYCHECK_X402_PRICE: ["", "$0", "0.02", "$-1"],
    };
    for (const [key, values] of Object.entries(malformed)) {
      for (const value of [undefined, ...values]) {
        assert.deepEqual(
          buildEntityCheckToolDescriptor({
            ...configuredEnvironment,
            [key]: value,
          }).configuration,
          { state: "configuration_required" },
          `${key}=${String(value)}`,
        );
      }
    }
    assert.deepEqual(
      buildEntityCheckToolDescriptor({
        ...configuredEnvironment,
        RISKSCAN_X402_PRICE: "$9",
      }).configuration,
      {
        state: "locally_configured",
        protocol: "x402",
        network: "eip155:84532",
        price: "$0.02",
      },
    );
  },
);

implementedTest(
  "summarises only parsed protocol, network, and price for the EVM and native Hedera families",
  () => {
    assert.deepEqual(
      buildEntityCheckToolDescriptor({
        ...configuredEnvironment,
        ENTITYCHECK_X402_PRICE: " $1.50 ",
      }).configuration,
      {
        state: "locally_configured",
        protocol: "x402",
        network: "eip155:84532",
        price: "$1.50",
      },
    );
    assert.deepEqual(
      buildEntityCheckToolDescriptor(configuredHederaEnvironment).configuration,
      {
        state: "locally_configured",
        protocol: "x402",
        network: "hedera:testnet",
        asset: "0.0.429274",
        amount: "20000",
      },
    );
  },
);

implementedTest(
  "never serialises a private environment value and reads only its own prefix",
  () => {
    const privateEnvironment = {
      ...configuredEnvironment,
      ENTITYCHECK_REGISTRY_BASE_URL:
        "https://registry.invalid/controlled-private-path",
      ENTITYCHECK_SANCTIONS_URL:
        "https://sanctions.invalid/controlled-private-path",
      CREDENTIAL: "controlled-credential-secret",
      RISKSCAN_X402_PAY_TO: `0x${"1".repeat(40)}`,
    };
    const body = JSON.stringify(
      buildEntityCheckToolDescriptor(privateEnvironment),
    );
    for (const secret of [
      privateEnvironment.ENTITYCHECK_X402_PAY_TO,
      privateEnvironment.ENTITYCHECK_X402_FACILITATOR_URL,
      privateEnvironment.ENTITYCHECK_REGISTRY_BASE_URL,
      privateEnvironment.ENTITYCHECK_SANCTIONS_URL,
      privateEnvironment.CREDENTIAL,
      privateEnvironment.RISKSCAN_X402_PAY_TO,
    ]) {
      assert.equal(body.includes(secret), false, secret);
    }

    const reads = [];
    const environment = new Proxy(Object.freeze({ ...configuredEnvironment }), {
      get(target, key) {
        reads.push(key);
        return target[key];
      },
    });
    buildEntityCheckToolDescriptor(environment);
    assert.deepEqual(reads, Object.keys(configuredEnvironment));
  },
);

implementedTest(
  "mounts as the second directory entry after the unchanged RiskScan descriptor",
  () => {
    const directory = buildToolDirectory({ ...configuredEnvironment });
    assert.equal(directory.tools.length, 2);
    assert.equal(directory.tools[0].id, "riskscan.quick");
    assert.deepEqual(
      directory.tools[1],
      buildEntityCheckToolDescriptor(configuredEnvironment),
    );
    assert.deepEqual(directory.tools[0].payment, {
      state: "configuration_required",
    });
  },
);
