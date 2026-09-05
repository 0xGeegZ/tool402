import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = new URL("../src/riskscan-tool-challenge.ts", import.meta.url);

test("keeps challenge observation to the fixed unsigned request and metadata presence check", async () => {
  const text = await readFile(source, "utf8");
  assert.match(text, /method:\s*"POST"/u);
  assert.match(text, /content-type":\s*"application\/json"/u);
  for (const forbidden of [
    /authorization|x-payment|payment-signature|x402|wallet|signer|account|process\.env|backend/iu,
    /setTimeout|setInterval|retry|import\s*\(|child_process|\.json\s*\(|\.text\s*\(|\.arrayBuffer\s*\(|\.blob\s*\(|\.formData\s*\(/u,
    /result|receipt|facilitator|network|price|settlement|verification|finality/iu,
  ]) assert.doesNotMatch(text, forbidden);
});
