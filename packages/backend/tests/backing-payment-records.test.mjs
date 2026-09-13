import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalizeRequirements } from "@tool402/core";
import { keccak256 } from "viem";

const recordsUrl = new URL("../convex/backing_payment_records.ts", import.meta.url);
const receiptReaderUrl = new URL("../src/ats/hedera-funding-receipt-reader.ts", import.meta.url);

test("declares the durable backing-payment writer and bounded Hedera receipt reader", () => {
  assert.equal(existsSync(fileURLToPath(recordsUrl)), true);
  assert.equal(existsSync(fileURLToPath(receiptReaderUrl)), true);
});

test("confirms only a hash-bound payment receipt matching the admitted signer, target, and tinybar value", async () => {
  const { confirmBackingPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const transactionHash = `0x${"ab".repeat(32)}`;
  const parameters = { offeringPublicId: "riskscan_revenue_note_demo", units: "10", tinybars: "1000000000", purchaseIntentId: "AbCdEfGhIjKlMnOpQrStUw" };
  const hash = keccak256(new TextEncoder().encode(canonicalizeRequirements(parameters))).slice(2);
  const calls = [];
  const ctx = {
    runQuery: async () => ({ expectedTarget: signer, canonicalParametersHash: hash }),
    runMutation: async (_reference, input) => { calls.push(input); return { status: input.outcome, transactionHash: input.transactionHash, tinybars: input.tinybars }; },
  };
  const result = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n }));
  assert.deepEqual(result, { status: "CONFIRMED", transactionHash, tinybars: "1000000000" });
  assert.deepEqual(calls[0].outcome, "CONFIRMED");
  const rejected = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => ({ from: signer, to: "0x1111111111111111111111111111111111111111", value: 10_000_000_000_000_000_000n }));
  assert.equal(rejected.status, "REJECTED");
});

test("reads only matching successful Hedera EVM transaction and receipt documents", async () => {
  const { createHederaFundingReceiptReader } = await import(receiptReaderUrl.href);
  const hash = `0x${"cd".repeat(32)}`;
  const from = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  let count = 0;
  const reader = createHederaFundingReceiptReader(async (_url, init) => {
    count += 1;
    const method = JSON.parse(init.body).method;
    const result = method === "eth_getTransactionByHash"
      ? { hash, chainId: "0x128", from, to: from, value: "0x2540be400" }
      : { transactionHash: hash, status: "0x1" };
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.deepEqual(await reader(hash), { hash, chainId: 296, from, to: from, value: 10_000_000_000n, status: "0x1" });
  assert.equal(count, 2);
});
