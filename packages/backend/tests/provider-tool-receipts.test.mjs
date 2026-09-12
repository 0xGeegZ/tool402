import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../convex/provider_tool_receipts.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;

const assetA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const assetB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const candidateA = "0.0.123-1735689600-123456789";
const candidateB = "0.0.124-1735689600-123456789";
const transactionHashA = `0x${"1".repeat(64)}`;
const transactionHashB = `0x${"2".repeat(64)}`;

function binding(overrides = {}) {
  return {
    offeringId: "offerings:A",
    offeringPublicId: "offering_a",
    attemptId: "externalPrepareCommandAttempts:A",
    candidateTransactionId: candidateA,
    evmTransactionHash: transactionHashA,
    assetEvmAddress: assetA,
    ...overrides,
  };
}

function database(rows = []) {
  const writes = [];
  return {
    rows,
    writes,
    ctx: {
      db: {
        query(table) {
          assert.equal(table, "providerToolReceiptBindings");
          return {
            withIndex(index, select) {
              const filters = [];
              const range = { eq(field, value) { filters.push([field, value]); return range; } };
              select(range);
              return {
                async take(limit) {
                  assert.equal(limit, 2);
                  return rows.filter((row) => filters.every(([field, value]) => row[field] === value)).slice(0, limit);
                },
              };
            },
          };
        },
        async insert(table, document) {
          assert.equal(table, "providerToolReceiptBindings");
          const stored = { _id: `providerToolReceiptBindings:${rows.length}`, _creationTime: 1, ...structuredClone(document) };
          rows.push(stored);
          writes.push(stored);
          return stored._id;
        },
      },
    },
  };
}

test("requires the provider receipt-binding source module before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test("declares the canonical EVM transaction-hash reservation index", () => {
  const schema = readFileSync(new URL("../convex/schema.ts", import.meta.url), "utf8");
  assert.match(
    schema,
    /by_network_and_evm_transaction_hash"\s*,\s*\["network",\s*"evmTransactionHash"\]/u,
  );
});

test.before(async () => {
  if (sourceExists) await import(sourceUrl.href);
});

implementedTest("claims a new receipt once and accepts only its exact same-offering replay", async () => {
  const { claimAtsReceiptBinding } = await import(sourceUrl.href);
  const db = database();
  const attached = binding({ candidateTransactionId: "0.0.123@1735689600.123456789" });
  assert.equal(await claimAtsReceiptBinding(db.ctx, attached), "CLAIMED");
  assert.equal(await claimAtsReceiptBinding(db.ctx, attached), "REPLAYED");
  assert.equal(db.writes.length, 1);
});

implementedTest("rejects cross-offering transaction or asset claims without a partial write", async () => {
  const { claimAtsReceiptBinding } = await import(sourceUrl.href);
  for (const contender of [
    binding({ offeringId: "offerings:B", offeringPublicId: "offering_b", attemptId: "externalPrepareCommandAttempts:B" }),
    binding({ offeringId: "offerings:B", offeringPublicId: "offering_b", attemptId: "externalPrepareCommandAttempts:B", candidateTransactionId: candidateB, assetEvmAddress: assetB }),
    binding({ offeringId: "offerings:B", offeringPublicId: "offering_b", attemptId: "externalPrepareCommandAttempts:B", assetEvmAddress: assetB }),
    binding({ offeringId: "offerings:B", offeringPublicId: "offering_b", attemptId: "externalPrepareCommandAttempts:B", candidateTransactionId: candidateB, evmTransactionHash: transactionHashB }),
  ]) {
    const db = database();
    await claimAtsReceiptBinding(db.ctx, binding());
    const before = structuredClone(db.rows);
    await assert.rejects(claimAtsReceiptBinding(db.ctx, contender), RangeError);
    assert.deepEqual(db.rows, before);
  }
});
