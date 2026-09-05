import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = new URL("../src/riskscan-tool-directory.ts", import.meta.url);

test("keeps discovery free of execution, payment, secrets, and retry boundaries", async () => {
  const text = await readFile(source, "utf8");
  for (const forbidden of [
    /fetch\s*\([^,)]*\)/u, /body\s*:/u,
    /authorization|payment-required|x-payment/u, /@x402\//u,
    /@hashgraph\/sdk|@x402\/hedera|(?:from|require\()\s*["'][^"']*hedera/iu,
    /privatekey|private-key|signer|wallet|account|process\.env|backend/iu,
    /fetchwith(?:receipt|payment)|payment(?:fetch|request)|createpayment|paywith/iu,
    /client\.(?:for(?:mainnet|testnet)|setoperator)|live.?client|httpfacilitatorclient/iu,
    /setTimeout|setInterval|retry|import\s*\(/u,
  ]) {
    assert.doesNotMatch(text, forbidden);
  }
});
