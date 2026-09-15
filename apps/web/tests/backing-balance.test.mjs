import assert from "node:assert/strict";
import test from "node:test";

const sourceUrl = new URL("../src/components/backing/backing-balance.ts", import.meta.url);
const request = { account: "0x1111111111111111111111111111111111111111", to: "0x2222222222222222222222222222222222222222", value: 100n };

test("requires the transfer value plus estimated fee before a backing send", async () => {
  const { assessFundingBalance } = await import(sourceUrl.href);
  const methods = [];
  const insufficient = await assessFundingBalance({
    getBalance: async () => { methods.push("getBalance"); return 110n; },
    estimateGas: async () => { methods.push("estimateGas"); return 5n; },
    getGasPrice: async () => { methods.push("getGasPrice"); return 3n; },
  }, request);
  assert.equal(insufficient, "INSUFFICIENT");
  assert.deepEqual([...methods].sort(), ["estimateGas", "getBalance", "getGasPrice"]);
  const sufficient = await assessFundingBalance({ getBalance: async () => 115n, estimateGas: async () => 5n, getGasPrice: async () => 3n }, request);
  assert.equal(sufficient, "SUFFICIENT");
  const unavailable = await assessFundingBalance({ getBalance: async () => { throw new Error("unavailable"); }, estimateGas: async () => 5n, getGasPrice: async () => 3n }, request);
  assert.equal(unavailable, "UNAVAILABLE");
});
