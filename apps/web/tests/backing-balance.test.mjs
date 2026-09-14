import assert from "node:assert/strict";
import test from "node:test";

const sourceUrl = new URL("../src/components/backing/backing-balance.ts", import.meta.url);
const request = { method: "eth_sendTransaction", params: [{ from: "0x1111111111111111111111111111111111111111", to: "0x2222222222222222222222222222222222222222", value: "0x64" }] };

test("requires the transfer value plus estimated fee before a backing send", async () => {
  const { assessFundingBalance } = await import(sourceUrl.href);
  const methods = [];
  const insufficient = await assessFundingBalance({ request: async ({ method }) => {
    methods.push(method);
    return method === "eth_getBalance" ? "0x6e" : method === "eth_estimateGas" ? "0x5" : "0x3";
  } }, request);
  assert.equal(insufficient, "INSUFFICIENT");
  assert.deepEqual([...methods].sort(), ["eth_estimateGas", "eth_gasPrice", "eth_getBalance"]);
  const sufficient = await assessFundingBalance({ request: async ({ method }) => method === "eth_getBalance" ? "0x73" : method === "eth_estimateGas" ? "0x5" : "0x3" }, request);
  assert.equal(sufficient, "SUFFICIENT");
  const unavailable = await assessFundingBalance({ request: async () => { throw new Error("unavailable"); } }, request);
  assert.equal(unavailable, "UNAVAILABLE");
});
