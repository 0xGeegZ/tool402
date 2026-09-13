import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const configUrl = new URL("../src/lib/wallet/wagmi-config.ts", import.meta.url);
const configPath = fileURLToPath(configUrl);
const configExists = existsSync(configPath);
const implementedTest = configExists ? test : test.skip;
let api;

test("requires the declared W01 Wagmi configuration module", () => {
  assert.equal(configExists, true, `missing W01 Wagmi configuration: ${configPath}`);
});

test.before(async () => {
  if (configExists) {
    api = await import(configUrl.href);
  }
});

implementedTest("configures the one supported Hedera Testnet chain", () => {
  assert.deepEqual(
    api.tool402WagmiConfig.chains.map((chain) => chain.id),
    [296],
  );
  assert.equal(api.tool402HederaTestnet.id, 296);
  assert.equal(api.tool402HederaTestnet.name, "Hedera Testnet");
});

implementedTest("does not preselect a connected account in the server-neutral state", () => {
  assert.equal(api.tool402WagmiConfig.state.current, undefined);
  assert.equal(api.tool402WagmiConfig.state.status, "disconnected");
});
