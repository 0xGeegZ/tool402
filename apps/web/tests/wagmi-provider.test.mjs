import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const configUrl = new URL("../src/lib/wallet/wagmi-config.ts", import.meta.url);
const configPath = fileURLToPath(configUrl);
const configExists = existsSync(configPath);
const providersUrl = new URL("../src/components/wallet/wallet-providers.tsx", import.meta.url);
const providersPath = fileURLToPath(providersUrl);
const providersExist = existsSync(providersPath);
const implementedConfigTest = configExists ? test : test.skip;
const implementedProviderTest = configExists && providersExist ? test : test.skip;
let api;
let getConnectors;
let getPublicClient;

test("requires the declared W01 Wagmi configuration module", () => {
  assert.equal(configExists, true, `missing W01 Wagmi configuration: ${configPath}`);
});

test("requires the declared W01 client provider module", () => {
  assert.equal(providersExist, true, `missing W01 client provider: ${providersPath}`);
});

test.before(async () => {
  if (configExists) {
    api = await import(configUrl.href);
    ({ getConnectors, getPublicClient } = await import("wagmi/actions"));
  }
});

implementedConfigTest("configures the one supported Hedera Testnet chain", () => {
  const config = api.getTool402WagmiConfig();
  assert.deepEqual(
    config.chains.map((chain) => chain.id),
    [296],
  );
  assert.equal(api.tool402HederaTestnet.id, 296);
  assert.equal(api.tool402HederaTestnet.name, "Hedera Testnet");
});

implementedConfigTest("starts server-neutral with one injected MetaMask connector", () => {
  const config = api.getTool402WagmiConfig();
  assert.equal(config.state.status, "disconnected");
  assert.equal(config.state.current, null);
  assert.equal(config.state.connections.size, 0);
  const connectors = getConnectors(config);
  assert.equal(connectors.length, 1);
  assert.equal(connectors[0]?.type, "injected");
  assert.equal(connectors[0]?.id, "metaMask");
});

implementedConfigTest("uses the configured Hashio transport for its public client", () => {
  const client = getPublicClient(api.getTool402WagmiConfig());
  assert.equal(client?.transport.url, "https://testnet.hashio.io/api");
});

async function captureConfigOptions() {
  const { outputText } = typescript.transpileModule(await readFile(configUrl, "utf8"), {
    fileName: configPath,
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  let options;
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      if (specifier === "wagmi") return {
        createConfig: (value) => { options = value; return value; },
        createStorage: (value) => ({ ...value, configuredStorage: true }),
        cookieStorage: { kind: "cookieStorage" },
        injected: (value) => ({ type: "injected", ...value }),
        http: (url) => ({ url }),
      };
      throw new Error(`unexpected config import: ${specifier}`);
    },
  }, { filename: configPath });
  module.exports.getTool402WagmiConfig();
  return options;
}

implementedConfigTest("uses SSR cookie persistence and explicitly targets MetaMask", async () => {
  const options = await captureConfigOptions();
  assert.equal(options?.ssr, true);
  assert.equal(options?.storage?.configuredStorage, true);
  assert.equal(typeof options?.storage?.storage?.getItem, "function");
  assert.equal(options?.connectors?.length, 1);
  assert.equal(options?.connectors?.[0]?.type, "injected");
  assert.equal(options?.connectors?.[0]?.target, "metaMask");
  assert.equal(options?.transports?.[296]?.url, "https://testnet.hashio.io/api");
});

implementedConfigTest("migrates an existing Wagmi local session into cookie persistence", async () => {
  const source = await readFile(configUrl, "utf8");

  assert.match(source, /cookieStorage\.getItem\(key\)\s*\?\?\s*readLegacyWalletStorage\(key\)/u);
  assert.match(source, /cookieStorage\.setItem\(key, value\);\s*removeLegacyWalletStorage\(key\);/u);
  assert.match(source, /cookieStorage\.removeItem\(key\);\s*removeLegacyWalletStorage\(key\);/u);
});

async function loadProviders() {
  const { outputText } = typescript.transpileModule(await readFile(providersUrl, "utf8"), {
    fileName: providersPath,
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  const wagmiCalls = [];
  const queryCalls = [];
  const reconnectCalls = [];
  const metaMask = { id: "io.metamask", rdns: "io.metamask" };
  const rabby = { id: "io.rabby", rdns: "io.rabby" };
  const module = { exports: {} };
  class QueryClient {}
  let queryClient;
  let config;
  runInNewContext(outputText, {
    exports: module.exports,
    window: {
      setTimeout(callback) { callback(); return 1; },
      clearTimeout() {},
    },
    require(specifier) {
      switch (specifier) {
        case "react":
          return {
            createContext: (value) => ({ Provider: ({ children }) => children, value }),
            useContext: (context) => context.value,
            useEffect: (effect) => { effect(); },
            useState: (create) => {
              const value = typeof create === "function" ? create() : create;
              if (typeof value === "boolean") return [value, () => {}];
              if (value instanceof QueryClient) {
                queryClient ??= value;
                return [queryClient];
              }
              config ??= value;
              return [config];
            },
          };
        case "react/jsx-runtime":
          return jsxRuntime;
        case "wagmi":
          return {
            WagmiProvider: (props) => { wagmiCalls.push(props); return props.children; },
            useConnectors: () => [rabby, metaMask],
            useReconnect: () => ({ mutateAsync: async (input) => { reconnectCalls.push(input); } }),
          };
        case "@tanstack/react-query":
          return {
            QueryClient,
            QueryClientProvider: (props) => { queryCalls.push(props); return props.children; },
          };
        case "../../lib/wallet/wagmi-config":
          return {
            getTool402WagmiConfig: () => ({
              name: "tool402-config",
              connectors: [rabby, metaMask],
            }),
          };
        default:
          throw new Error(`unexpected provider import: ${specifier}`);
      }
    },
  }, { filename: providersPath });
  return { WalletProviders: module.exports.WalletProviders, QueryClient, queryCalls, reconnectCalls, wagmiCalls };
}

implementedProviderTest("mounts one Wagmi config around one browser QueryClient", async () => {
  const harness = await loadProviders();
  const render = (node) =>
    node !== null && typeof node === "object" && typeof node.type === "function"
      ? render(node.type(node.props))
      : node;
  assert.equal(render(harness.WalletProviders({ children: "shell" })), "shell");
  assert.equal(render(harness.WalletProviders({ children: "shell" })), "shell");
  assert.equal(harness.wagmiCalls.length, 2);
  assert.equal(harness.wagmiCalls[0]?.config?.name, "tool402-config");
  assert.equal(harness.wagmiCalls[1]?.config?.name, "tool402-config");
  assert.equal(harness.reconnectCalls.length, 2);
  assert.deepEqual(harness.reconnectCalls[0]?.connectors, [{ id: "io.metamask", rdns: "io.metamask" }]);
  assert.equal(harness.queryCalls.length, 2);
  assert.equal(harness.queryCalls[0]?.client instanceof harness.QueryClient, true);
  assert.equal(harness.queryCalls[0]?.client, harness.queryCalls[1]?.client);
});

implementedProviderTest("mounts the client provider once from the root layout", async () => {
  const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(layout, /cookieToInitialState\(|\bcookies\(\)|export const instant = false;/u);
  assert.match(layout, /<WalletProviders><ApplicationShell>\{children\}<\/ApplicationShell><\/WalletProviders>/u);
});

implementedProviderTest("uses the Wagmi reconnect lifecycle without a bespoke timeout", async () => {
  const providers = await readFile(providersUrl, "utf8");

  assert.match(providers, /useReconnect/u);
  assert.match(providers, /const metaMaskConnectors = connectors\.filter\(isMetaMaskConnector\);/u);
  assert.match(providers, /reconnectAsync\(\{ connectors: metaMaskConnectors \}\)/u);
  assert.match(providers, /connector\.rdns === metaMaskRdns/u);
  assert.doesNotMatch(providers, /Promise\.race|passiveReconnect(?:Delay|Timeout)Ms|config\.setState/u);
  assert.match(providers, /<WagmiProvider\s+config=\{config\}\s+reconnectOnMount=\{false\}>/u);
});

implementedProviderTest("keeps restoration pending until the passive reconnect settles", async () => {
  const providers = await readFile(providersUrl, "utf8");

  assert.match(providers, /createContext\(true\)/u);
  assert.match(providers, /const \[isPassiveReconnectPending, setPassiveReconnectPending\] = useState\(true\);/u);
  assert.match(providers, /setPassiveReconnectPending\(false\);/u);
  assert.match(providers, /PassiveWalletRestoreContext\.Provider value=\{isPassiveReconnectPending\}/u);
});
