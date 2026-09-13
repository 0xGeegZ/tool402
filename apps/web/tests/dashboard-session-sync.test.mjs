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
  assert.equal((layout.match(/<DashboardSessionSync\s+address=\{session\.address\}\s*>/gu) ?? []).length, 1);
  assert.doesNotMatch(navigation, /\bDashboardSessionSync\b/u);
});

async function loadSynchronizer({
  responseStatus = 204,
  reject = false,
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
  const requests = [];
  const navigations = [];
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
  };
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    window: {
      location: {
        replace: (href) => navigations.push(["replace", href]),
      },
    },
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
        case "../wallet/use-tool402-wallet":
          return { useTool402Wallet: () => wallet };
        default:
          throw new Error(`unexpected synchronizer import: ${specifier}`);
      }
    },
  }, { filename: fileURLToPath(sourceUrl) });

  return {
    requests,
    navigations,
    setWallet(next) {
      Object.assign(wallet, next);
    },
    render(address) {
      cursor = 0;
      const tree = module.exports.DashboardSessionSync({ address, children: "dashboard content" });
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

async function flushMicrotasks() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

function visibleText(node) {
  if (Array.isArray(node)) return node.map(visibleText).join(" ");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node && typeof node === "object" && "props" in node ? visibleText(node.props.children) : "";
}

function assertLogout(harness) {
  assert.deepEqual(harness.requests.map(([url, init]) => [url, { ...init }]), [["/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }]]);
  assert.deepEqual(harness.navigations, [["replace", "/sign-in"]]);
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

implementedTest("logs out a restored dashboard session without a selected account", async () => {
  const harness = await loadSynchronizer();

  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();

  assertLogout(harness);

  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
  await flushMicrotasks();
  assert.equal(harness.requests.length, 1);
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

  assertLogout(harness);
});

implementedTest("logs out a restored dashboard session without a MetaMask account", async () => {
  const harness = await loadSynchronizer({ wallet: { connection: { status: "disconnected", account: undefined, chainId: undefined, connector: undefined }, resolved: true } });

  harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
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
    const harness = await loadSynchronizer({ ...failure });
    harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e");
    await flushMicrotasks();

    assert.equal(harness.requests.length, 1);
    assert.deepEqual(harness.navigations, []);
    assert.match(visibleText(harness.render("0xc89f87052c3e080b4a9b021d4930055031ef378e")), /could not be ended safely/u);
  }
});

implementedTest("keeps sign-out synchronization inside the accepted local boundary", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /^"use client";/u);
  assert.match(source, /import\s*\{\s*useTool402Wallet\s*\}\s*from\s*["']\.\.\/wallet\/use-tool402-wallet["']/u);
  assert.match(source, /const\s*\{\s*connection,\s*resolved\s*\}\s*=\s*useTool402Wallet\(\)/u);
  assert.match(source, /if\s*\(\s*!resolved\s*\)\s*return;/u);
  assert.match(source, /connection\.account\s*===\s*address/u);
  assert.match(source, /connection\.chainId\s*===\s*296/u);
  assert.match(source, /fetch\(["']\/api\/auth\/logout["']/u);
  assert.match(source, /method:\s*["']POST["']/u);
  assert.match(source, /credentials:\s*["']same-origin["']/u);
  assert.match(source, /window\.location\.replace\(["']\/sign-in["']\)/u);
  assert.match(source, /role=["']alert["']/u);
  assert.match(source, /could not be ended safely/u);
  assert.doesNotMatch(source, /useRouter|router\.|document\.cookie|localStorage|sessionStorage|indexedDB|provider\.request|personal_sign|eth_requestAccounts|eth_sendTransaction|setTimeout|setInterval|console|discoverMetaMaskProvider|readCurrentSession|watchWalletSessionChanges|useWalletSession/u);
});
