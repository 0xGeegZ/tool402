import assert from "node:assert/strict";
import test from "node:test";

import {
  createStageBRecoveryScope,
  beginStageBRecovery,
  persistStageBRecovery,
  readStageBRecovery,
  releaseStageBRecoveryReservation,
  stageBRecoveryStatus,
} from "../src/components/provider/deploy/stage-b-recovery.ts";

const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const hash = `0x${"1".repeat(64)}`;
const attempt = "CCCCCCCCCCCCCCCCCCCCCg";

test("recovers a returned hash only for its original wallet, tool, and prepared attempt", async () => {
  const previousWindow = globalThis.window;
  const previousNavigator = globalThis.navigator;
  const stored = new Map();
  globalThis.window = { localStorage: {
    getItem(key) { return stored.get(key) ?? null; },
    setItem(key, value) { stored.set(key, value); },
    removeItem(key) { stored.delete(key); },
  } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request(_name, _options, callback) { return callback(); } } } });
  try {
    const original = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    const otherTool = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", preparedAttemptPublicId: attempt });
    const otherAccount = createStageBRecoveryScope({ address: `0x${"2".repeat(40)}`, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    assert.ok(original && otherTool && otherAccount);

    const claim = await beginStageBRecovery(original);
    assert.equal(claim.kind, "claimed");
    if (claim.kind === "claimed") assert.equal(persistStageBRecovery(original, claim.claimId, hash), true);

    assert.equal(readStageBRecovery(original), hash);
    assert.equal(readStageBRecovery(otherTool), null);
    assert.equal(readStageBRecovery(otherAccount), null);
  } finally {
    globalThis.window = previousWindow;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: previousNavigator });
  }
});

test("keeps an ambiguous reservation locked and releases only the rejecting caller's reservation", async () => {
  const previousWindow = globalThis.window;
  const previousNavigator = globalThis.navigator;
  const stored = new Map();
  globalThis.window = { localStorage: {
    getItem(key) { return stored.get(key) ?? null; },
    setItem(key, value) { stored.set(key, value); },
    removeItem(key) { stored.delete(key); },
  } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request(_name, _options, callback) { return callback(); } } } });
  try {
    const scope = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    assert.ok(scope);
    const first = await beginStageBRecovery(scope);
    assert.equal(first.kind, "claimed");
    if (first.kind !== "claimed") return;
    assert.deepEqual(await beginStageBRecovery(scope), { kind: "existing" });
    assert.equal(persistStageBRecovery(scope, "other", hash), false);
    assert.equal(releaseStageBRecoveryReservation(scope, "other"), false);
    assert.equal(stageBRecoveryStatus(scope), "existing");
    assert.equal(releaseStageBRecoveryReservation(scope, first.claimId), true);
    assert.equal(stageBRecoveryStatus(scope), "clear");
  } finally {
    globalThis.window = previousWindow;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: previousNavigator });
  }
});
