import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { canonicalizeRequirements } from "@tool402/core";
import { keccak256 } from "viem";

const recordsUrl = new URL("../convex/backing_payment_records.ts", import.meta.url);
const storeUrl = new URL("../convex/backing_payment_store.ts", import.meta.url);
const receiptReaderUrl = new URL("../src/ats/hedera-funding-receipt-reader.ts", import.meta.url);
const claimsUrl = new URL("../convex/backing_payment_claims.ts", import.meta.url);

test("declares the durable backing-payment writer and bounded Hedera receipt reader", () => {
  assert.equal(existsSync(fileURLToPath(recordsUrl)), true);
  assert.equal(existsSync(fileURLToPath(receiptReaderUrl)), true);
});

test("declares one durable transaction-hash claim store before a funding hash can be attached", () => {
  assert.equal(existsSync(fileURLToPath(claimsUrl)), true);
});

test("admits one durable hash claim exactly once per attempt and preserves terminal state", async () => {
  const { resolveBackingPaymentClaim } = await import(storeUrl.href);
  const attemptA = "attempt-A";
  const attemptB = "attempt-B";
  const hashA = `0x${"aa".repeat(32)}`;
  const hashB = `0x${"bb".repeat(32)}`;
  const input = { attemptId: attemptA, transactionHash: hashA, tinybars: "10", outcome: "SUBMITTED" };
  const claim = { attemptId: attemptA, transactionHash: hashA, tinybars: "10", state: "SUBMITTED" };
  assert.equal(resolveBackingPaymentClaim(claim, claim, input), "SUBMITTED", "same hash / attempt is idempotent");
  assert.equal(resolveBackingPaymentClaim(undefined, claim, { ...input, transactionHash: hashB }), null, "different hash for one attempt is rejected");
  assert.equal(resolveBackingPaymentClaim({ ...claim, attemptId: attemptA }, undefined, { ...input, attemptId: attemptB }), null, "one hash cannot satisfy another attempt");
  assert.equal(resolveBackingPaymentClaim({ ...claim, state: "OUTCOME_UNKNOWN" }, { ...claim, state: "OUTCOME_UNKNOWN" }, input), "OUTCOME_UNKNOWN", "a retry cannot downgrade unknown evidence");
  assert.equal(resolveBackingPaymentClaim({ ...claim, state: "CONFIRMED" }, { ...claim, state: "CONFIRMED" }, input), "CONFIRMED", "terminal confirmation is immutable");
});

test("keeps the shared ATS prepare attempt PREPARED while the dedicated backing claim changes state", async () => {
  const source = await readFile(storeUrl, "utf8");
  assert.match(source, /ctx\.db\.patch\(claim\._id, \{ transactionHash: args\.transactionHash, state: next \}\)/u);
  assert.doesNotMatch(source, /ctx\.db\.patch\(row\._id, \{ state: next \}\)/u);
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
  const result = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n, status: "0x1" }));
  assert.deepEqual(result, { status: "CONFIRMED", transactionHash, tinybars: "1000000000" });
  assert.deepEqual(calls.map((call) => call.outcome), ["SUBMITTED", "CONFIRMED"]);
  const rejected = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => ({ from: signer, to: "0x1111111111111111111111111111111111111111", value: 10_000_000_000_000_000_000n, status: "0x1" }));
  assert.equal(rejected.status, "REJECTED");
});

test("persists a submitted hash before observation and later re-verifies it without another wallet transfer", async () => {
  const { confirmBackingPaymentForTest, reverifyBackerPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const transactionHash = `0x${"ef".repeat(32)}`;
  const parameters = { offeringPublicId: "riskscan_revenue_note_demo", units: "10", tinybars: "1000000000", purchaseIntentId: "AbCdEfGhIjKlMnOpQrStUw" };
  const canonicalParametersHash = keccak256(new TextEncoder().encode(canonicalizeRequirements(parameters))).slice(2);
  const writes = [];
  const context = { expectedTarget: signer, canonicalParametersHash };
  const ctx = {
    runQuery: async () => context,
    runMutation: async (_reference, input) => { writes.push(input); return { status: input.outcome, transactionHash: input.transactionHash, tinybars: input.tinybars }; },
  };
  const submitted = await confirmBackingPaymentForTest(ctx, { attemptPublicId: "ZyXwVuTsRqPoNmLkJiHgFw", canonicalSignerAddress: signer, transactionHash, parameters }, async () => null);
  assert.equal(submitted.status, "OUTCOME_UNKNOWN");
  context.attemptPublicId = "ZyXwVuTsRqPoNmLkJiHgFw";
  context.transactionHash = transactionHash;
  context.tinybars = "1000000000";
  context.state = "OUTCOME_UNKNOWN";
  const confirmed = await reverifyBackerPaymentForTest(ctx, { canonicalSignerAddress: signer }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n, status: "0x1" }));
  assert.equal(confirmed.status, "CONFIRMED");
  const rejected = await reverifyBackerPaymentForTest({ ...ctx, runQuery: async () => ({ ...context, state: "OUTCOME_UNKNOWN" }) }, { canonicalSignerAddress: signer }, async () => ({ from: signer, to: signer, value: 10_000_000_000_000_000_000n, status: "0x0" }));
  assert.equal(rejected.status, "REJECTED");
  assert.deepEqual(writes.map((write) => write.outcome), ["SUBMITTED", "OUTCOME_UNKNOWN", "CONFIRMED", "REJECTED"]);
});

test("returns a durable pre-send reservation on reload without reading a receipt or enabling another send", async () => {
  const { reverifyBackerPaymentForTest } = await import(recordsUrl.href);
  const signer = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  let reads = 0;
  let queries = 0;
  const result = await reverifyBackerPaymentForTest({ runQuery: async () => (++queries === 1 ? null : { status: "PREPARED", transactionHash: null, tinybars: "1000000000" }) }, { canonicalSignerAddress: signer }, async () => { reads += 1; return null; });
  assert.deepEqual(result, { status: "PREPARED", transactionHash: null, tinybars: "1000000000" });
  assert.equal(reads, 0);
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

test("keeps an unavailable receipt non-terminal and recognizes a failed EVM receipt as terminal", async () => {
  const { createHederaFundingReceiptReader } = await import(receiptReaderUrl.href);
  const hash = `0x${"de".repeat(32)}`;
  const from = "0x834c6e958c608eabb461d887c2eb0bef75a48734";
  const reader = createHederaFundingReceiptReader(async (_url, init) => {
    const method = JSON.parse(init.body).method;
    const result = method === "eth_getTransactionByHash" ? { hash, chainId: "0x128", from, to: from, value: "0x1" } : { transactionHash: hash, status: "0x0" };
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200, headers: { "content-type": "application/json" } });
  });
  assert.equal((await reader(hash))?.status, "0x0");
});
