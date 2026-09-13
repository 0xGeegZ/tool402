import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { PrivateKey } = require("@x402/hedera");
const moduleUrl = new URL("../src/riskscan-hedera-payer-key.ts", import.meta.url);

test("parses a raw ECDSA payer key without changing its public identity", async () => {
  const { parseRiskScanHederaPayerPrivateKey } = await import(moduleUrl.href);
  const original = PrivateKey.generateECDSA();

  const parsed = parseRiskScanHederaPayerPrivateKey(PrivateKey, original.toStringRaw());

  assert.equal(parsed.publicKey.toStringRaw(), original.publicKey.toStringRaw());
});
