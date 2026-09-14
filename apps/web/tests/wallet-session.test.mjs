import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import typescript from "typescript";
import { ProviderNotFoundError } from "wagmi";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const hookPath = "src/components/wallet/use-tool402-wallet.ts";
const layoutPath = "src/app/layout.tsx";
const legacyPaths = [
  "src/components/wallet/wallet-session.tsx",
  "src/lib/wallet/metamask-provider.ts",
  "src/lib/wallet/wallet-state.ts",
];
const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

async function loadHook(hooks, hydrated = true) {
  const source = await readFile(join(appRoot, hookPath), "utf8");
  const { outputText } = typescript.transpileModule(source, {
    fileName: hookPath,
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier === "react") return { useEffect: () => {}, useRef: (initial) => ({ current: initial }) };
      if (specifier === "wagmi") return hooks;
      if (specifier === "./wallet-providers") return { useWalletHydrated: () => hydrated };
      assert.fail(`unexpected hook import: ${specifier}`);
    },
  }, { filename: hookPath });
  return module.exports;
}

function harness({ connection, connectors, connectError, switchError, disconnectNeverResolves = false } = {}) {
  const calls = { connect: [], disconnect: [], switchChain: [], removeStorage: [] };
  const metaMask = { id: "metaMask", rdns: "io.metamask" };
  let current = connection ?? { status: "disconnected", address: undefined, chainId: undefined, connector: undefined };
  return {
    calls,
    metaMask,
    hooks: {
      ProviderNotFoundError,
      useConfig: () => ({ storage: { removeItem: async (key) => { calls.removeStorage.push(key); } } }),
      useConnection: () => current,
      useConnectors: () => connectors ?? [metaMask],
      useConnect: () => ({ error: connectError, mutateAsync: async (input) => { calls.connect.push(input); } }),
      useDisconnect: () => ({ mutateAsync: async (input) => {
        calls.disconnect.push(input);
        if (disconnectNeverResolves) return await new Promise(() => {});
        current = { status: "disconnected", address: undefined, chainId: undefined, connector: undefined };
      } }),
      useSwitchChain: () => ({ error: switchError, mutateAsync: async (input) => { calls.switchChain.push(input); } }),
    },
  };
}

test("derives display state from Wagmi without connecting during passive restoration", async () => {
  const instance = harness({ connection: { status: "reconnecting", address: undefined, chainId: undefined, connector: undefined } });
  const { useTool402Wallet } = await loadHook(instance.hooks);
  const wallet = useTool402Wallet();

  assert.deepEqual({ ...wallet.state }, { kind: "resolving" });
  assert.equal(wallet.resolved, false);
  assert.deepEqual(instance.calls, { connect: [], disconnect: [], switchChain: [], removeStorage: [] });
});

test("clears the reconnect target before a broken provider can stall disconnect", async () => {
  const instance = harness({ connection: { status: "connecting", address: undefined, chainId: undefined, connector: undefined }, disconnectNeverResolves: true });
  const { useTool402Wallet } = await loadHook(instance.hooks);

  void useTool402Wallet().cancelConnection();
  await Promise.resolve();
  assert.deepEqual(instance.calls.removeStorage, ["recentConnectorId"]);
});

test("selects the Wagmi-discovered MetaMask connector rather than another injected wallet", async () => {
  const fallbackMetaMask = { id: "metaMask" };
  const discoveredMetaMask = { id: "io.metamask" };
  const instance = harness({ connectors: [fallbackMetaMask, { id: "rabby", rdns: "io.rabby" }, discoveredMetaMask] });
  const { isTool402MetaMaskConnector, useTool402Wallet } = await loadHook(instance.hooks);
  const wallet = useTool402Wallet();

  assert.equal(isTool402MetaMaskConnector(discoveredMetaMask), true);
  assert.equal(isTool402MetaMaskConnector({ id: "rabby", rdns: "io.rabby" }), false);
  await wallet.connect();
  assert.equal(instance.calls.connect.length, 1);
  assert.equal(instance.calls.connect[0]?.connector, discoveredMetaMask);
});

test("holds the UI in a resolving state until Wagmi persistence hydrates", async () => {
  const instance = harness({ connection: { status: "connecting", address: undefined, chainId: undefined, connector: undefined } });
  const { useTool402Wallet } = await loadHook(instance.hooks, false);
  const wallet = useTool402Wallet();

  assert.deepEqual({ ...wallet.state }, { kind: "resolving" });
  assert.equal(wallet.resolved, false);
});

test("cancels a connection attempt and clears its persisted reconnect target", async () => {
  const instance = harness({ connection: { status: "connecting", address: undefined, chainId: undefined, connector: undefined } });
  const { useTool402Wallet } = await loadHook(instance.hooks);
  const wallet = useTool402Wallet();

  await wallet.cancelConnection();
  assert.equal(instance.calls.disconnect.length, 1);
  assert.equal(instance.calls.disconnect[0], undefined);
  assert.deepEqual(instance.calls.removeStorage, ["recentConnectorId"]);
});

test("centralizes the eligible Tool402 wallet connection invariant", async () => {
  const instance = harness({ connection: { status: "connected", address, chainId: 296, connector: { id: "io.metamask" } } });
  const { connectedTool402Wallet, useTool402Wallet } = await loadHook(instance.hooks);
  const wallet = useTool402Wallet();

  const connected = connectedTool402Wallet(wallet.connection, wallet.resolved);
  assert.equal(connected?.generation, 0);
  assert.equal(connected?.status, "connected");
  assert.equal(connected?.account, address);
  assert.equal(connected?.chainId, 296);
  assert.equal(connected?.connector.id, "io.metamask");
  assert.equal(connectedTool402Wallet(wallet.connection, false), null);
});

test("uses only explicit Wagmi mutations and normalizes the connected identity", async () => {
  const instance = harness({
    connection: { status: "connected", address: address.toUpperCase(), chainId: 296, connector: { id: "metaMask" } },
  });
  const { useTool402Wallet } = await loadHook(instance.hooks);
  const wallet = useTool402Wallet();

  assert.deepEqual({ ...wallet.state }, { kind: "connected", address });
  await wallet.switchToHedera();
  await wallet.disconnect();
  assert.equal(instance.calls.switchChain.length, 1);
  assert.equal(instance.calls.switchChain[0]?.chainId, 296);
  assert.equal(instance.calls.disconnect.length, 1);
  assert.equal(instance.calls.disconnect[0]?.connector?.id, "metaMask");
});

test("reports a missing provider or rejected Wagmi operation without a fallback provider store", async () => {
  const unavailable = harness({ connectError: new ProviderNotFoundError() });
  const rejected = harness({ connectError: Object.assign(new Error("rejected"), { code: 4001 }) });
  const unavailableApi = await loadHook(unavailable.hooks);
  const rejectedApi = await loadHook(rejected.hooks);

  assert.deepEqual({ ...unavailableApi.useTool402Wallet().state }, { kind: "no_provider" });
  assert.deepEqual({ ...rejectedApi.useTool402Wallet().state }, { kind: "request_failed", operation: "connect" });
  assert.equal(rejectedApi.useTool402Wallet().connectErrorCode, "4001");
});

test("keeps a valid connected wallet authoritative over stale Wagmi mutation errors", async () => {
  const staleConnectError = Object.assign(new Error("old rejection"), { code: 4001 });
  const staleSwitchError = Object.assign(new Error("old switch rejection"), { code: 4001 });
  const instance = harness({
    connection: { status: "connected", address, chainId: 296, connector: { id: "metaMask" } },
    connectError: staleConnectError,
    switchError: staleSwitchError,
  });
  const { useTool402Wallet } = await loadHook(instance.hooks);

  assert.deepEqual({ ...useTool402Wallet().state }, { kind: "connected", address });
});

test("removes the legacy wallet store and mounts only the shared Wagmi provider", async () => {
  const [hook, layout] = await Promise.all([
    readFile(join(appRoot, hookPath), "utf8"),
    readFile(join(appRoot, layoutPath), "utf8"),
  ]);

  assert.match(hook, /from\s+["']wagmi["']/u);
  assert.doesNotMatch(hook, /(?:useState|accountsChanged|chainChanged|eip6963|window\.ethereum)/u);
  assert.match(layout, /<WalletProviders>/u);
  assert.doesNotMatch(layout, /WalletSessionProvider|wallet-session/u);
  for (const path of legacyPaths) assert.equal(existsSync(join(appRoot, path)), false, `legacy wallet path remains: ${path}`);
});
