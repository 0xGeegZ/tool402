import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = new URL("../src/riskscan-tool-directory.ts", import.meta.url);

test("keeps discovery free of execution, payment, secrets, and retry boundaries", async () => {
  const text = await readFile(source, "utf8");
  for (const forbidden of [
    /fetch\s*\([^,)]*\)/u, /body\s*:/u,
    /authorization|payment-required|x-payment/u, /@x402\//u,
    /wallet|signer|account|process\.env|backend/u, /setTimeout|setInterval|retry|import\s*\(/u,
  ]) {
    assert.doesNotMatch(text, forbidden);
  }
});
