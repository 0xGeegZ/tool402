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

async function loadHook(hooks) {
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
      if (specifier === "react") return { useRef: (initial) => ({ current: initial }) };
      if (specifier === "wagmi") return hooks;
      assert.fail(`unexpected hook import: ${specifier}`);
    },
  }, { filename: hookPath });
  return module.exports;
}

function harness({ connection, connectors, connectError, switchError } = {}) {
  const calls = { connect: [], disconnect: [], switchChain: [] };
  const metaMask = { id: "metaMask", rdns: "io.metamask" };
  let current = connection ?? { status: "disconnected", address: undefined, chainId: undefined, connector: undefined };
  return {
    calls,
    metaMask,
    hooks: {
      ProviderNotFoundError,
      useConnection: () => current,
      useConnectors: () => connectors ?? [metaMask],
      useConnect: () => ({ error: connectError, mutateAsync: async (input) => { calls.connect.push(input); } }),
      useDisconnect: () => ({ mutateAsync: async (input) => {
        calls.disconnect.push(input);
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
  assert.deepEqual(instance.calls, { connect: [], disconnect: [], switchChain: [] });
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

test("removes the legacy wallet store and mounts only the shared Wagmi provider", async () => {
  const [hook, layout] = await Promise.all([
    readFile(join(appRoot, hookPath), "utf8"),
    readFile(join(appRoot, layoutPath), "utf8"),
  ]);

  assert.match(hook, /from\s+["']wagmi["']/u);
  assert.doesNotMatch(hook, /(?:useState|useEffect|accountsChanged|chainChanged|eip6963|window\.ethereum)/u);
  assert.match(layout, /<WalletProviders>/u);
  assert.doesNotMatch(layout, /WalletSessionProvider|wallet-session/u);
  for (const path of legacyPaths) assert.equal(existsSync(join(appRoot, path)), false, `legacy wallet path remains: ${path}`);
});
