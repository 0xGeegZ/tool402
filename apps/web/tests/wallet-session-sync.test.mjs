import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const providerModuleUrl = new URL(
  "../src/lib/wallet/metamask-provider.ts",
  import.meta.url,
);
const walletIslandUrl = new URL(
  "../src/components/wallet/wallet-connect.tsx",
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

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

function visibleText(node) {
  if (Array.isArray(node)) return node.map(visibleText).join(" ");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node && typeof node === "object" && "props" in node
    ? visibleText(node.props.children)
    : "";
}

async function walletIslandHarness(provider) {
  const stateSlots = [];
  const refSlots = [];
  const effectSlots = [];
  let cursor = 0;
  const providerApi = await import(providerModuleUrl.href);
  const walletStateApi = await import("../src/lib/wallet/wallet-state.ts");
  const imports = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in stateSlots)) {
          stateSlots[index] = typeof initial === "function" ? initial() : initial;
        }
        return [stateSlots[index], (value) => {
          stateSlots[index] = typeof value === "function" ? value(stateSlots[index]) : value;
        }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in refSlots)) refSlots[index] = { current: initial };
        return refSlots[index];
      },
      useEffect(effect, dependencies) {
        const index = cursor++;
        const previous = effectSlots[index];
        const changed =
          previous === undefined ||
          dependencies.length !== previous.dependencies.length ||
          dependencies.some((dependency, dependencyIndex) =>
            dependency !== previous.dependencies[dependencyIndex],
          );
        if (changed) {
          previous?.cleanup?.();
          effectSlots[index] = { dependencies, effect, cleanup: null, pending: true };
        }
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "../../lib/wallet/metamask-provider.ts": {
      ...providerApi,
      discoverMetaMaskProvider: async () => ({ kind: "provider", provider }),
    },
    "../../lib/wallet/metamask-provider": {
      ...providerApi,
      discoverMetaMaskProvider: async () => ({ kind: "provider", provider }),
    },
    "../../lib/wallet/wallet-state.ts": walletStateApi,
    "../../lib/wallet/wallet-state": walletStateApi,
    "../ui/badge": { Badge: "Badge" },
    "../ui/button": { Button: "Button" },
  };
  const { outputText } = typescript.transpileModule(await readFile(walletIslandUrl, "utf8"), {
    fileName: fileURLToPath(walletIslandUrl),
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    window: {
      ethereum: provider,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true; },
    },
    require(specifier) {
      assert.ok(Object.hasOwn(imports, specifier), `unexpected wallet island import: ${specifier}`);
      return imports[specifier];
    },
  }, { filename: fileURLToPath(walletIslandUrl) });

  return {
    render(props = {}) {
      cursor = 0;
      const tree = module.exports.WalletIsland(props);
      for (const effect of effectSlots) {
        if (effect?.pending) {
          effect.pending = false;
          effect.cleanup = effect.effect() ?? null;
        }
      }
      return tree;
    },
  };
}

function deferredProvider() {
  const listeners = [];
  const requests = [];
  const chainIds = ["0x128", "0x128", "0x1"];
  let resolveAccounts;
  let accountRequest;
  const provider = {
    isMetaMask: true,
    on(event, listener) {
      listeners.push({ event, listener });
    },
    removeListener() {},
    async request({ method }) {
      requests.push(method);
      switch (method) {
        case "eth_requestAccounts":
          return ["0xc89f87052c3e080b4a9b021d4930055031ef378e"];
        case "eth_chainId":
          return chainIds.shift();
        case "eth_accounts":
          accountRequest?.();
          return new Promise((resolve) => {
            resolveAccounts = resolve;
          });
        default:
          throw new Error(`unexpected provider method: ${method}`);
      }
    },
  };
  return {
    provider,
    emit(event) {
      listeners.find((entry) => entry.event === event)?.listener();
    },
    async waitForAccountRead() {
      await new Promise((resolve) => {
        accountRequest = resolve;
      });
    },
    resolveAccounts() {
      resolveAccounts(["0xc89f87052c3e080b4a9b021d4930055031ef378e"]);
    },
    requests,
  };
}

async function flushMicrotasks() {
  for (let index = 0; index < 16; index += 1) {
    await Promise.resolve();
  }
}

test("keeps the newest session event state when an older account read resolves late", async () => {
  const fake = deferredProvider();
  const harness = await walletIslandHarness(fake.provider);

  const connect = elements(harness.render()).find(
    (element) => element.type === "Button" && visibleText(element) === "Connect MetaMask",
  );
  assert.notEqual(connect, undefined);
  await connect.props.onClick();
  harness.render();

  fake.emit("accountsChanged");
  await fake.waitForAccountRead();
  fake.emit("chainChanged");
  await flushMicrotasks();
  assert.match(visibleText(harness.render()), /not Hedera Testnet/u);

  fake.resolveAccounts();
  await flushMicrotasks();

  const text = visibleText(harness.render());
  assert.match(text, /not Hedera Testnet/u);
  assert.doesNotMatch(text, /Connected as 0xc89f87052c3e080b4a9b021d4930055031ef378e/u);
  assert.deepEqual(fake.requests, [
    "eth_requestAccounts",
    "eth_chainId",
    "eth_chainId",
    "eth_accounts",
    "eth_chainId",
  ]);
});

test("invalidates a pending session read when the subscription effect cleans up", async () => {
  const fake = deferredProvider();
  const harness = await walletIslandHarness(fake.provider);

  const connect = elements(harness.render()).find(
    (element) => element.type === "Button" && visibleText(element) === "Connect MetaMask",
  );
  assert.notEqual(connect, undefined);
  await connect.props.onClick();
  harness.render();

  fake.emit("accountsChanged");
  await fake.waitForAccountRead();
  const afterCleanup = harness.render({
    approvedIssuerAddress: "0x0000000000000000000000000000000000000402",
  });
  assert.match(visibleText(afterCleanup), /Waiting for MetaMask/u);

  fake.resolveAccounts();
  await flushMicrotasks();

  const text = visibleText(harness.render({
    approvedIssuerAddress: "0x0000000000000000000000000000000000000402",
  }));
  assert.match(text, /Waiting for MetaMask/u);
  assert.doesNotMatch(text, /Connected as 0xc89f87052c3e080b4a9b021d4930055031ef378e/u);
});
