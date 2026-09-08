import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const sourceUrl = new URL("../src/lib/wallet/wallet-state.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const connectedAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

test("requires the declared wallet-state source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("exposes exactly the closed wallet-state union", () => {
  assert.deepEqual(api.walletStateKinds, [
    "disconnected",
    "connecting",
    "no_provider",
    "multiple_providers",
    "wrong_chain",
    "not_issuer",
    "connected",
  ]);

  for (const kind of api.walletStateKinds) {
    assert.equal(api.isWalletStateKind(kind), true);
  }
  for (const kind of ["idle", "failed", "authorized", "complete", ""]) {
    assert.equal(api.isWalletStateKind(kind), false);
  }
});

implementedTest("keeps the issuer comparison advisory and opt-in", () => {
  assert.equal(api.isIssuerAdvisory(connectedAddress, undefined), false);
  assert.equal(api.isIssuerAdvisory(connectedAddress, connectedAddress), false);
  assert.equal(
    api.isIssuerAdvisory(connectedAddress, "0x0000000000000000000000000000000000000402"),
    true,
  );
  assert.equal(api.isIssuerAdvisory(connectedAddress.toUpperCase(), connectedAddress), true);
});
