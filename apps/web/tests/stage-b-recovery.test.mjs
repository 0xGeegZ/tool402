import assert from "node:assert/strict";
import test from "node:test";

import {
  createStageBRecoveryScope,
  beginStageBRecovery,
  persistStageBRecovery,
  reconcileStageBRecovery,
  readStageBRecovery,
  releaseStageBRecoveryReservation,
  stageBRecoveryStatus,
} from "../src/components/provider/deploy/stage-b-recovery.ts";

const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const hash = `0x${"1".repeat(64)}`;
const attempt = "CCCCCCCCCCCCCCCCCCCCCg";

function serialLocks() {
  const tails = new Map();
  return {
    async request(name, _options, callback) {
      const previous = tails.get(name) ?? Promise.resolve();
      let unlock;
      const tail = new Promise((resolve) => { unlock = resolve; });
      tails.set(name, previous.then(() => tail));
      await previous;
      try { return await callback(); } finally { unlock(); }
    },
  };
}

function installStore() {
  const previousWindow = globalThis.window;
  const previousNavigator = globalThis.navigator;
  const stored = new Map();
  globalThis.window = { localStorage: {
    getItem(key) { return stored.get(key) ?? null; },
    setItem(key, value) { stored.set(key, value); },
    removeItem(key) { stored.delete(key); },
  } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: serialLocks() } });
  return { stored, restore() { globalThis.window = previousWindow; Object.defineProperty(globalThis, "navigator", { configurable: true, value: previousNavigator }); } };
}

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
    if (claim.kind === "claimed") assert.equal(await persistStageBRecovery(original, claim.claimId, hash), true);

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
    assert.equal(await persistStageBRecovery(scope, "other", hash), false);
    assert.equal(await releaseStageBRecoveryReservation(scope, "other"), false);
    assert.equal(stageBRecoveryStatus(scope), "existing");
    assert.equal(await releaseStageBRecoveryReservation(scope, first.claimId), true);
    assert.equal(stageBRecoveryStatus(scope), "clear");
  } finally {
    globalThis.window = previousWindow;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: previousNavigator });
  }
});

test("retains a corroborated hash on the original hashless reservation without replacing its claim", async () => {
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
    const reservation = await beginStageBRecovery(scope);
    assert.equal(reservation.kind, "claimed");
    const competingHash = `0x${"2".repeat(64)}`;
    const [reconciliation, competingReconciliation] = await Promise.all([
      reconcileStageBRecovery(scope, hash),
      reconcileStageBRecovery(scope, competingHash),
    ]);
    assert.deepEqual(reconciliation, { kind: "reconciled" });
    assert.deepEqual(competingReconciliation, { kind: "conflict" });
    assert.equal(readStageBRecovery(scope), hash);
    assert.equal(stageBRecoveryStatus(scope), "existing");
    if (reservation.kind === "claimed") {
      assert.equal(await persistStageBRecovery(scope, reservation.claimId, competingHash), false);
      assert.equal(await persistStageBRecovery(scope, reservation.claimId, hash), true);
    }
  } finally {
    globalThis.window = previousWindow;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: previousNavigator });
  }
});

test("serializes reconcile, persist, and release so a retained hash cannot be deleted", async () => {
  const store = installStore();
  try {
    const scope = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    assert.ok(scope);
    const claim = await beginStageBRecovery(scope);
    assert.equal(claim.kind, "claimed");
    if (claim.kind !== "claimed") return;
    const [reconciled, released] = await Promise.all([
      reconcileStageBRecovery(scope, hash),
      releaseStageBRecoveryReservation(scope, claim.claimId),
    ]);
    assert.deepEqual(reconciled, { kind: "reconciled" });
    assert.equal(released, false);
    assert.equal(readStageBRecovery(scope), hash);
    assert.equal(await persistStageBRecovery(scope, claim.claimId, hash), true);
    assert.deepEqual(await beginStageBRecovery(scope), { kind: "existing" });
  } finally { store.restore(); }
});

test("reconciles valid legacy records without clearing evidence or accepting a conflicting hash", async () => {
  const store = installStore();
  try {
    const scope = createStageBRecoveryScope({ address, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: attempt });
    assert.ok(scope);
    const recoveryKey = `tool402:ats-create-recovery:v1:${scope.address}:296:${scope.toolPublicId}:${scope.preparedAttemptPublicId}`;
    store.stored.set(recoveryKey, JSON.stringify({ version: 1, scope }));
    assert.deepEqual(await reconcileStageBRecovery(scope, hash), { kind: "reconciled" });
    assert.equal(readStageBRecovery(scope), hash);
    assert.deepEqual(await reconcileStageBRecovery(scope, `0x${"2".repeat(64)}`), { kind: "conflict" });
  } finally { store.restore(); }
});
