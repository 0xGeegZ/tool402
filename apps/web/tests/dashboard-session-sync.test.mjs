import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const sourceUrl = new URL(
  "../src/components/auth/dashboard-session-sync.tsx",
  import.meta.url,
);
const navigationUrl = new URL(
  "../src/components/auth/dashboard-navigation.tsx",
  import.meta.url,
);
const implementedTest = existsSync(fileURLToPath(sourceUrl)) ? test : test.skip;

test("mounts the dashboard session synchronizer only from the authenticated navigation boundary", async () => {
  assert.equal(
    existsSync(fileURLToPath(sourceUrl)),
    true,
    `missing S40 sign-out synchronizer: ${fileURLToPath(sourceUrl)}`,
  );
  const navigation = await readFile(navigationUrl, "utf8");
  assert.match(navigation, /import\s*\{\s*DashboardSessionSync\s*\}\s*from\s*["'][^"']*dashboard-session-sync["']/u);
  assert.equal((navigation.match(/<DashboardSessionSync\s+address=\{session\.address\}\s*\/>/gu) ?? []).length, 1);
  assert.match(navigation, /session\s*===\s*null\s*\?\s*null\s*:\s*<DashboardSessionSync\s+address=\{session\.address\}\s*\/>/u);
});

async function loadSynchronizer({
  responseStatus = 204,
  reject = false,
  connections = [{ kind: "disconnected" }],
} = {}) {
  const { outputText } = typescript.transpileModule(await readFile(sourceUrl, "utf8"), {
    fileName: fileURLToPath(sourceUrl),
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  const references = [];
  const effects = [];
  const requests = [];
  const navigations = [];
  const listeners = [];
  const provider = {};
  const wallet = { state: { kind: "disconnected" } };
  let cursor = 0;
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in references)) references[index] = { current: initial };
      return references[index];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = effects[index];
      const changed = previous === undefined
        || dependencies.length !== previous.dependencies.length
        || dependencies.some((dependency, dependencyIndex) => dependency !== previous.dependencies[dependencyIndex]);
      if (changed) effects[index] = { dependencies, effect, pending: true };
    },
  };
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    window: {},
    fetch: async (...arguments_) => {
      requests.push(arguments_);
      if (reject) throw new Error("network unavailable");
      return { status: responseStatus };
    },
    require(specifier) {
      switch (specifier) {
        case "react":
          return react;
        case "react/jsx-runtime":
          return jsxRuntime;
        case "next/navigation":
          return {
            useRouter: () => ({
              replace: (href) => navigations.push(["replace", href]),
              refresh: () => navigations.push(["refresh"]),
            }),
          };
        case "../wallet/wallet-session":
          return { useWalletSession: () => wallet };
        case "../../lib/wallet/metamask-provider":
          return {
            discoverMetaMaskProvider: async () => ({ kind: "provider", provider }),
            watchWalletSessionChanges: (_provider, listener) => {
              listeners.push(listener);
              return () => {};
            },
          };
        case "../../lib/wallet/wallet-state":
          return {
            readCurrentSession: async () => ({
              state: connections.shift() ?? { kind: "disconnected" },
              provider,
            }),
          };
        default:
          throw new Error(`unexpected synchronizer import: ${specifier}`);
      }
    },
  }, { filename: fileURLToPath(sourceUrl) });

  return {
    requests,
    navigations,
    listeners,
    render(address, state = wallet.state) {
      wallet.state = state;
      cursor = 0;
      assert.equal(module.exports.DashboardSessionSync({ address }), null);
      for (const effect of effects) {
        if (effect?.pending) {
          effect.pending = false;
          effect.effect();
        }
      }
    },
  };
}

async function flushMicrotasks() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

implementedTest("logs out a restored dashboard session without a selected account", async () => {
  const harness = await loadSynchronizer();

  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();

  assert.deepEqual(harness.requests.map(([url, init]) => [url, { ...init }]), [["/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }]]);
  assert.deepEqual(harness.navigations, [["replace", "/sign-in"], ["refresh"]]);

  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();
  assert.equal(harness.requests.length, 1);
});

implementedTest("logs out after the selected MetaMask account changes", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const harness = await loadSynchronizer({
    connections: [
      { kind: "connected", address },
      { kind: "connected", address: "0x0000000000000000000000000000000000000402" },
    ],
  });

  harness.render(address);
  await flushMicrotasks();
  assert.equal(harness.requests.length, 0);
  assert.equal(harness.listeners.length, 1);

  harness.listeners[0]();
  await flushMicrotasks();

  assert.deepEqual(harness.requests.map(([url, init]) => [url, { ...init }]), [["/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }]]);
  assert.deepEqual(harness.navigations, [["replace", "/sign-in"], ["refresh"]]);
});

implementedTest("does not navigate when active-account logout is rejected or unavailable", async () => {
  for (const failure of [{ responseStatus: 401 }, { reject: true }]) {
    const harness = await loadSynchronizer({ ...failure, connections: [{ kind: "disconnected" }] });
    harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
    await flushMicrotasks();

    assert.equal(harness.requests.length, 1);
    assert.deepEqual(harness.navigations, []);
  }
});

implementedTest("keeps sign-out synchronization inside the accepted local boundary", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /^"use client";/u);
  assert.match(source, /discoverMetaMaskProvider\(window\)/u);
  assert.match(source, /readCurrentSession\(/u);
  assert.match(source, /watchWalletSessionChanges\(/u);
  assert.match(source, /state\.address\s*===\s*address/u);
  assert.match(source, /fetch\(["']\/api\/auth\/logout["']/u);
  assert.match(source, /method:\s*["']POST["']/u);
  assert.match(source, /credentials:\s*["']same-origin["']/u);
  assert.match(source, /router\.replace\(["']\/sign-in["']\)/u);
  assert.match(source, /router\.refresh\(\)/u);
  assert.doesNotMatch(source, /document\.cookie|localStorage|sessionStorage|indexedDB|provider\.request|personal_sign|eth_requestAccounts|eth_sendTransaction|setTimeout|setInterval|console/u);
});
