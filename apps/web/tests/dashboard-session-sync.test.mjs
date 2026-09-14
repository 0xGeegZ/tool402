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
const dashboardLayoutUrl = new URL(
  "../src/app/dashboard/layout.tsx",
  import.meta.url,
);
const implementedTest = existsSync(fileURLToPath(sourceUrl)) ? test : test.skip;

test("mounts the dashboard session synchronizer from the server-validated dashboard layout", async () => {
  assert.equal(
    existsSync(fileURLToPath(sourceUrl)),
    true,
    `missing S40 sign-out synchronizer: ${fileURLToPath(sourceUrl)}`,
  );
  const [layout, navigation] = await Promise.all([
    readFile(dashboardLayoutUrl, "utf8"),
    readFile(navigationUrl, "utf8"),
  ]);
  assert.match(layout, /import\s*\{\s*DashboardSessionSync\s*\}\s*from\s*["'][^"']*dashboard-session-sync["']/u);
  assert.equal((layout.match(/<DashboardSessionSync\s+address=\{session\.address\}\s+issuedAt=\{session\.issuedAt\}\s*>/gu) ?? []).length, 1);
  assert.doesNotMatch(navigation, /\bDashboardSessionSync\b/u);
});

async function loadSynchronizer({
  responseStatus = 204,
  reject = false,
  deferLogout = false,
  locks,
  wallet = {
    connection: { status: "disconnected", account: undefined, chainId: undefined, connector: undefined },
    resolved: true,
  },
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
  const states = [];
  const effects = [];
  const connectionEffects = [];
  const requests = [];
  const navigations = [];
  let resolveLogout;
  let cursor = 0;
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in references)) references[index] = { current: initial };
      return references[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => {
        states[index] = typeof value === "function" ? value(states[index]) : value;
      }];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = effects[index];
      const changed = previous === undefined
        || dependencies.length !== previous.dependencies.length
        || dependencies.some((dependency, dependencyIndex) => dependency !== previous.dependencies[dependencyIndex]);
      if (changed) effects[index] = { dependencies, effect, pending: true };
    },
    useCallback(callback) {
      return callback;
    },
  };
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    navigator: locks === undefined ? undefined : { locks },
    fetch: async (...arguments_) => {
      requests.push(arguments_);
      if (deferLogout) return new Promise((resolve) => { resolveLogout = () => resolve({ status: responseStatus }); });
      if (reject) throw new Error("network unavailable");
      return { status: responseStatus };
    },
    require(specifier) {
      switch (specifier) {
        case "react":
          return react;
        case "react/jsx-runtime":
          return jsxRuntime;
        case "wagmi":
          return { useConnectionEffect: (handlers) => connectionEffects.push(handlers) };
        case "next/navigation":
          return { useRouter: () => ({ replace: (href) => navigations.push(["replace", href]), refresh: () => navigations.push(["refresh"]) }) };
        case "../wallet/use-tool402-wallet":
          return { useTool402Wallet: () => wallet };
        case "../ui/button":
          return { Button: ({ children, ...props }) => jsxRuntime.jsx("button", { ...props, children }) };
        default:
          throw new Error(`unexpected synchronizer import: ${specifier}`);
      }
    },
  }, { filename: fileURLToPath(sourceUrl) });

  return {
    serializeDashboardSessionMutation: module.exports.serializeDashboardSessionMutation,
    requests,
    navigations,
    disconnect() {
      connectionEffects.at(-1)?.onDisconnect?.();
    },
    resolveLogout() {
      resolveLogout?.();
    },
    setWallet(next) {
      Object.assign(wallet, next);
    },
    render(address, issuedAt = "2026-09-14T10:00:00.000Z") {
      cursor = 0;
      const tree = module.exports.DashboardSessionSync({ address, issuedAt, children: "dashboard content" });
      for (const effect of effects) {
        if (effect?.pending) {
          effect.pending = false;
          effect.effect();
        }
      }
      return tree;
    },
  };
}

function exclusiveLocks() {
  let tail = Promise.resolve();
  return {
    request(_name, _options, callback) {
      const result = tail.then(callback);
      tail = result.catch(() => undefined);
      return result;
    },
  };
}

async function flushMicrotasks() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

function visibleText(node) {
  if (Array.isArray(node)) return node.map(visibleText).join(" ");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node && typeof node === "object" && "props" in node ? visibleText(node.props.children) : "";
}

function assertLogout(harness, destination = "/sign-in") {
  assert.equal(harness.requests.length, 1);
  const [url, init] = harness.requests[0];
  assert.equal(url, "/api/auth/logout");
  assert.equal(init.method, "POST");
  assert.equal(init.credentials, "same-origin");
  assert.equal(init.headers["content-type"], "application/json");
  assert.equal(init.body, '{"address":"0xc89f87052c3e080b4a9b021d4930055031ef378e","issuedAt":"2026-09-14T10:00:00.000Z"}');
  assert.deepEqual(harness.navigations, [["replace", destination]]);
}

implementedTest("waits for passive wallet restoration before comparing the dashboard session", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const harness = await loadSynchronizer();

  harness.setWallet({ connection: { status: "reconnecting", account: undefined, chainId: undefined, connector: undefined }, resolved: false });
  harness.render(address);
  await flushMicrotasks();
  assert.equal(harness.requests.length, 0);

  harness.setWallet({ connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" } }, resolved: true });
  harness.render(address);
  await flushMicrotasks();
  assert.equal(harness.requests.length, 0);
});

implementedTest("serializes a stale logout before the next dashboard sign-in mutation", async () => {
  const harness = await loadSynchronizer({ locks: exclusiveLocks() });
  const ordering = [];
  let finishLogout;
  const logoutFinished = new Promise((resolve) => { finishLogout = resolve; });

  const logout = harness.serializeDashboardSessionMutation(async () => {
    ordering.push("logout started");
    await logoutFinished;
    ordering.push("logout finished");
  });
  await flushMicrotasks();
  const signIn = harness.serializeDashboardSessionMutation(async () => {
    ordering.push("sign-in started");
    ordering.push("sign-in finished");
  });
  await flushMicrotasks();

  assert.deepEqual(ordering, ["logout started"]);
  finishLogout();
  await Promise.all([logout, signIn]);
  assert.deepEqual(ordering, ["logout started", "logout finished", "sign-in started", "sign-in finished"]);
});

implementedTest("keeps the signed session while its initial wallet restoration is unresolved", async () => {
  const harness = await loadSynchronizer({ wallet: { connection: { status: "reconnecting", account: undefined, chainId: undefined, connector: undefined }, resolved: false } });

  const tree = harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();

  assert.equal(harness.requests.length, 0);
  assert.equal(visibleText(tree), "dashboard content");
});

implementedTest("logs out after the selected MetaMask account changes", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const harness = await loadSynchronizer({ wallet: { connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" } }, resolved: true } });

  harness.render(address);
  await flushMicrotasks();
  assert.equal(harness.requests.length, 0);

  harness.setWallet({ connection: { status: "connected", account: "0x0000000000000000000000000000000000000402", chainId: 296, connector: { id: "metaMask" } } });
  harness.render(address);
  await flushMicrotasks();

  assertLogout(harness, "/sign-in/account-changed");
});

implementedTest("redirects after a successful logout even when the wallet recovers before it completes", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const harness = await loadSynchronizer({ deferLogout: true, wallet: { connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" }, generation: 1 }, resolved: true } });

  harness.render(address);
  harness.setWallet({ connection: { status: "connected", account: "0x0000000000000000000000000000000000000402", chainId: 296, connector: { id: "metaMask" }, generation: 2 } });
  harness.render(address);
  await flushMicrotasks();
  assert.equal(harness.requests.length, 1);

  harness.setWallet({ connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" }, generation: 3 } });
  harness.render(address);
  harness.resolveLogout();
  await flushMicrotasks();

  assert.deepEqual(harness.navigations, [["replace", "/sign-in"]]);
});

implementedTest("redirects to sign-in when the active account remains different after logout changes generation", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const switchedAddress = "0x0000000000000000000000000000000000000402";
  const harness = await loadSynchronizer({ deferLogout: true, wallet: { connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" }, generation: 1 }, resolved: true } });

  harness.render(address);
  harness.setWallet({ connection: { status: "connected", account: switchedAddress, chainId: 296, connector: { id: "metaMask" }, generation: 2 } });
  harness.render(address);
  await flushMicrotasks();
  harness.setWallet({ connection: { status: "connected", account: switchedAddress, chainId: 296, connector: { id: "metaMask" }, generation: 3 } });
  harness.resolveLogout();
  await flushMicrotasks();

  assert.deepEqual(harness.navigations, [["replace", "/sign-in/account-changed"]]);
});

implementedTest("refreshes the server session when a stale logout reports a concurrent session", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const switchedAddress = "0x0000000000000000000000000000000000000402";
  const harness = await loadSynchronizer({ responseStatus: 409, wallet: { connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" }, generation: 1 }, resolved: true } });

  harness.render(address);
  harness.setWallet({ connection: { status: "connected", account: switchedAddress, chainId: 296, connector: { id: "metaMask" }, generation: 2 } });
  harness.render(address);
  await flushMicrotasks();

  assert.deepEqual(harness.navigations, [["refresh"]]);
});

implementedTest("refreshes a concurrent dashboard session even after the wallet recovers", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const harness = await loadSynchronizer({ responseStatus: 409, wallet: { connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" }, generation: 1 }, resolved: true } });

  harness.render(address);
  harness.setWallet({ connection: { status: "connected", account: address, chainId: 1, connector: { id: "metaMask" }, generation: 2 } });
  harness.render(address);
  await flushMicrotasks();

  assert.deepEqual(harness.navigations, [["refresh"]]);
});

implementedTest("preserves a server session when passive restoration completes without a wallet", async () => {
  const harness = await loadSynchronizer({ wallet: { connection: { status: "disconnected", account: undefined, chainId: undefined, connector: undefined }, resolved: true } });

  const tree = harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();

  assert.equal(harness.requests.length, 0);
  assert.equal(visibleText(tree), "dashboard content");
});

implementedTest("starts only one logout when Wagmi reports an explicit disconnect", async () => {
  const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const harness = await loadSynchronizer({ wallet: { connection: { status: "connected", account: address, chainId: 296, connector: { id: "metaMask" } }, resolved: true } });

  harness.render(address);
  harness.setWallet({ connection: { status: "disconnected", account: undefined, chainId: undefined, connector: undefined }, resolved: true });
  harness.render(address);
  harness.disconnect();
  harness.disconnect();
  await flushMicrotasks();

  assertLogout(harness);
});

implementedTest("logs out a restored dashboard session on the wrong chain", async () => {
  const harness = await loadSynchronizer({ wallet: { connection: { status: "connected", account: "0xc89f87052c3e080b4a9b021d4930055031ef378e", chainId: 1, connector: { id: "metaMask" } }, resolved: true } });

  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();

  assertLogout(harness);
});

implementedTest("does not navigate when active-account logout is rejected or unavailable", async () => {
  for (const failure of [{ responseStatus: 401 }, { reject: true }]) {
    const harness = await loadSynchronizer({ ...failure, wallet: { connection: { status: "connected", account: "0x0000000000000000000000000000000000000402", chainId: 296, connector: { id: "metaMask" } }, resolved: true } });
    harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
    await flushMicrotasks();

    assert.equal(harness.requests.length, 1);
    assert.deepEqual(harness.navigations, []);
    assert.match(visibleText(harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e")), /could not be ended safely/u);
  }
});

implementedTest("offers an explicit retry after logout fails without restoring dashboard content", async () => {
  const harness = await loadSynchronizer({ responseStatus: 401, wallet: { connection: { status: "connected", account: "0x0000000000000000000000000000000000000402", chainId: 296, connector: { id: "metaMask" } }, resolved: true } });
  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();
  const tree = harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  const retry = [tree].flatMap((node) => node?.props?.children ?? []).find((node) => node?.props?.children === "Retry ending dashboard session");
  assert.ok(retry);
  retry.props.onClick();
  await flushMicrotasks();
  assert.equal(harness.requests.length, 2);
  assert.deepEqual(harness.navigations, []);
});

implementedTest("keeps sign-out synchronization inside the accepted local boundary", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /^"use client";/u);
  assert.match(source, /import\s*\{\s*useTool402Wallet\s*\}\s*from\s*["']\.\.\/wallet\/use-tool402-wallet["']/u);
  assert.match(source, /import\s*\{\s*useConnectionEffect\s*\}\s*from\s*["']wagmi["']/u);
  assert.match(source, /useConnectionEffect\(\{\s*onDisconnect\(\)\s*\{\s*if\s*\(hasMatchedSessionWallet\.current\)\s*endSession\(\);/u);
  assert.match(source, /const\s*\{\s*connection,\s*resolved\s*\}\s*=\s*useTool402Wallet\(\)/u);
  assert.match(source, /if\s*\(\s*!resolved\s*\)\s*return;/u);
  assert.match(source, /connection\.account\s*===\s*address/u);
  assert.match(source, /connection\.chainId\s*===\s*296/u);
  assert.match(source, /fetch\(["']\/api\/auth\/logout["']/u);
  assert.match(source, /method:\s*["']POST["']/u);
  assert.match(source, /credentials:\s*["']same-origin["']/u);
  assert.match(source, /import\s*\{\s*useRouter\s*\}\s*from\s*["']next\/navigation["']/u);
  assert.match(source, /router\.replace\(/u);
  assert.match(source, /["']\/sign-in\/account-changed["']/u);
  assert.match(source, /role=["']alert["']/u);
  assert.match(source, /could not be ended safely/u);
  assert.doesNotMatch(source, /document\.cookie|localStorage|sessionStorage|indexedDB|provider\.request|personal_sign|eth_requestAccounts|eth_sendTransaction|setTimeout|setInterval|console|discoverMetaMaskProvider|readCurrentSession|watchWalletSessionChanges|useWalletSession/u);
});
