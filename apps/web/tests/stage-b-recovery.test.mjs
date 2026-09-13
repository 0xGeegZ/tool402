import assert from "node:assert/strict";
import test from "node:test";

import {
  createStageBRecoveryScope,
  persistStageBRecovery,
  readStageBRecovery,
} from "../src/components/provider/deploy/stage-b-recovery.ts";

const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const hash = `0x${"1".repeat(64)}`;
const attempt = "CCCCCCCCCCCCCCCCCCCCCg";

test("recovers a returned hash only for its original wallet, tool, and prepared attempt", () => {
  const previousWindow = globalThis.window;
  const stored = new Map();
  globalThis.window = { localStorage: {
    getItem(key) { return stored.get(key) ?? null; },
    setItem(key, value) { stored.set(key, value); },
    removeItem(key) { stored.delete(key); },
  } };
  try {
    const original = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    const otherTool = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", preparedAttemptPublicId: attempt });
    const otherAccount = createStageBRecoveryScope({ address: `0x${"2".repeat(40)}`, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    assert.ok(original && otherTool && otherAccount);

    persistStageBRecovery(original, hash);

    assert.equal(readStageBRecovery(original), hash);
    assert.equal(readStageBRecovery(otherTool), null);
    assert.equal(readStageBRecovery(otherAccount), null);
  } finally {
    globalThis.window = previousWindow;
  }
});
