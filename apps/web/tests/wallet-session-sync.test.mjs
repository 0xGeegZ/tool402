import assert from "node:assert/strict";
import test from "node:test";

const providerModuleUrl = new URL(
  "../src/lib/wallet/metamask-provider.ts",
  import.meta.url,
);

function createEventProvider({ on, removeListener } = {}) {
  const registrations = [];
  const removals = [];
  let requests = 0;
  const provider = {
    request() {
      requests += 1;
      throw new Error("session-change events must not request the provider");
    },
  };
  if (on !== undefined) {
    provider.on = on;
  }
  if (removeListener !== undefined) {
    provider.removeListener = removeListener;
  }
  return { provider, registrations, removals, requestCount: () => requests };
}

test("watches only cleanup-capable native session events without trusting payloads or requesting", async () => {
  const api = await import(providerModuleUrl.href);
  assert.equal(typeof api.watchWalletSessionChanges, "function");

  const fake = createEventProvider();
  fake.provider.on = (event, listener) => {
    fake.registrations.push({ event, listener });
  };
  fake.provider.removeListener = (event, listener) => {
    fake.removals.push({ event, listener });
  };
  const callbackArguments = [];

  const cleanup = api.watchWalletSessionChanges(fake.provider, (...arguments_) => {
    callbackArguments.push(arguments_);
  });

  assert.deepEqual(
    fake.registrations.map(({ event }) => event),
    ["accountsChanged", "chainChanged"],
  );
  assert.equal(fake.registrations[0].listener, fake.registrations[1].listener);

  fake.registrations[0].listener(["0xuntrusted"]);
  fake.registrations[1].listener("0x1");
  assert.deepEqual(callbackArguments, [[], []]);
  assert.equal(fake.requestCount(), 0);

  cleanup();
  cleanup();
  assert.deepEqual(
    fake.removals.map(({ event, listener }) => ({ event, listener })),
    fake.registrations.map(({ event, listener }) => ({ event, listener })),
  );

  fake.registrations[0].listener(["0xstill-untrusted"]);
  fake.registrations[1].listener("0x128");
  assert.deepEqual(callbackArguments, [[], []]);
  assert.equal(fake.requestCount(), 0);
});

test("does not subscribe when either native event capability is missing", async () => {
  const api = await import(providerModuleUrl.href);
  assert.equal(typeof api.watchWalletSessionChanges, "function");

  for (const [name, capabilities] of [
    ["neither method", {}],
    ["on only", { on() {} }],
    ["removeListener only", { removeListener() {} }],
  ]) {
    const nativeCalls = [];
    const fake = createEventProvider({
      on:
        capabilities.on === undefined
          ? undefined
          : (...arguments_) => nativeCalls.push({ method: "on", arguments_ }),
      removeListener:
        capabilities.removeListener === undefined
          ? undefined
          : (...arguments_) =>
              nativeCalls.push({ method: "removeListener", arguments_ }),
    });
    let changes = 0;

    const cleanup = api.watchWalletSessionChanges(fake.provider, () => {
      changes += 1;
    });
    cleanup();
    cleanup();

    assert.deepEqual(fake.registrations, []);
    assert.deepEqual(fake.removals, []);
    assert.deepEqual(nativeCalls, [], `${name} is a no-subscription outcome`);
    assert.equal(changes, 0);
    assert.equal(fake.requestCount(), 0);
  }
});
