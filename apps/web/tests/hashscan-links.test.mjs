import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const moduleUrl = new URL("../src/lib/hashscan-links.ts", import.meta.url);

test("makes testnet HashScan links only for exact canonical identifiers", async () => {
  assert.equal(existsSync(fileURLToPath(moduleUrl)), true, "HashScan utility must exist");

  const { hashscanContractUrl, hashscanTransactionUrl } = await import(moduleUrl.href);
  const hash = "0x" + "ab".repeat(32);
  const address = "0x" + "cd".repeat(20);

  assert.equal(hashscanTransactionUrl(hash), "https://hashscan.io/testnet/transaction/" + hash);
  assert.equal(hashscanContractUrl(address), "https://hashscan.io/testnet/contract/" + address);
  for (const value of [undefined, "", "0xABC", "0x" + "AB".repeat(32), "javascript:alert(1)", "https://example.test"]) {
    assert.equal(hashscanTransactionUrl(value), null);
  }
  for (const value of [undefined, "", "0xABC", "0x" + "CD".repeat(20), "0.0.123", "https://example.test"]) {
    assert.equal(hashscanContractUrl(value), null);
  }
});
