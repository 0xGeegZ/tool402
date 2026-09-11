import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/lib/provider-directory-configuration.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const implementedTest = existsSync(sourcePath) ? test : test.skip;

test("requires the provider directory configuration reader", () => {
  assert.equal(existsSync(sourcePath), true, `missing provider directory configuration reader: ${sourcePath}`);
});

implementedTest("derives the public RiskScan endpoint and approved clearing account from server configuration", async () => {
  const { readProviderDirectoryConfiguration } = await import(sourceUrl.href);

  for (const [origin, endpoint] of [
    ["https://tool402-preview.vercel.app", "https://tool402-preview.vercel.app/api/riskscan"],
    ["https://localhost:3012", "https://localhost:3012/api/riskscan"],
  ]) {
    assert.deepEqual(readProviderDirectoryConfiguration({
      TOOL402_DASHBOARD_AUTH_ORIGIN: origin,
      TOOL402_CLEARING_ACCOUNT_ID: "0.0.10403477",
    }), {
      x402Endpoint: endpoint,
      clearingAccount: "0.0.10403477",
    });
  }
});

implementedTest("refuses malformed or non-public directory configuration", async () => {
  const { readProviderDirectoryConfiguration } = await import(sourceUrl.href);

  for (const environment of [
    {},
    { TOOL402_DASHBOARD_AUTH_ORIGIN: "http://tool402-preview.vercel.app", TOOL402_CLEARING_ACCOUNT_ID: "0.0.10403477" },
    { TOOL402_DASHBOARD_AUTH_ORIGIN: "https://tool402-preview.vercel.app/admin", TOOL402_CLEARING_ACCOUNT_ID: "0.0.10403477" },
    { TOOL402_DASHBOARD_AUTH_ORIGIN: "https://tool402-preview.vercel.app", TOOL402_CLEARING_ACCOUNT_ID: "0.0.010403477" },
  ]) {
    assert.equal(readProviderDirectoryConfiguration(environment), null);
  }
});
