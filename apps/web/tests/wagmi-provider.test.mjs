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

implementedConfigTest("starts server-neutral with one MetaMask connector", () => {
  const config = api.getTool402WagmiConfig();
  assert.equal(config.state.status, "disconnected");
  assert.equal(config.state.current, null);
  assert.equal(config.state.connections.size, 0);
  const connectors = getConnectors(config);
  assert.equal(connectors.length, 1);
  assert.equal(connectors[0]?.type, "metaMask");
  assert.equal(connectors[0]?.id, "metaMaskSDK");
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
        http: (url) => ({ url }),
      };
      if (specifier === "wagmi/connectors") return { metaMask: () => ({ type: "metaMask" }) };
      throw new Error(`unexpected config import: ${specifier}`);
    },
  }, { filename: configPath });
  module.exports.getTool402WagmiConfig();
  return options;
}

implementedConfigTest("uses SSR cookie persistence and the MetaMask connector", async () => {
  const options = await captureConfigOptions();
  assert.equal(options?.ssr, true);
  assert.equal(options?.storage?.configuredStorage, true);
  assert.equal(options?.storage?.storage?.kind, "cookieStorage");
  assert.equal(options?.connectors?.length, 1);
  assert.equal(options?.connectors?.[0]?.type, "metaMask");
  assert.equal(options?.transports?.[296]?.url, "https://testnet.hashio.io/api");
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
  const module = { exports: {} };
  class QueryClient {}
  let queryClient;
  let config;
  runInNewContext(outputText, {
    exports: module.exports,
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
          return { WagmiProvider: (props) => { wagmiCalls.push(props); return props.children; } };
        case "@tanstack/react-query":
          return {
            QueryClient,
            QueryClientProvider: (props) => { queryCalls.push(props); return props.children; },
          };
        case "../../lib/wallet/wagmi-config":
          return { getTool402WagmiConfig: () => ({ name: "tool402-config" }) };
        default:
          throw new Error(`unexpected provider import: ${specifier}`);
      }
    },
  }, { filename: providersPath });
  return { WalletProviders: module.exports.WalletProviders, QueryClient, queryCalls, wagmiCalls };
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
  assert.equal(harness.queryCalls.length, 2);
  assert.equal(harness.queryCalls[0]?.client instanceof harness.QueryClient, true);
  assert.equal(harness.queryCalls[0]?.client, harness.queryCalls[1]?.client);
});

implementedProviderTest("mounts the client provider once from the root layout", async () => {
  const layout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

  assert.match(layout, /<WalletProviders><ApplicationShell>\{children\}<\/ApplicationShell><\/WalletProviders>/u);
  assert.doesNotMatch(layout, /from\s+["']next\/headers["']/u);
});

implementedProviderTest("lets Wagmi restore cookie persistence after client mount", async () => {
  const providers = await readFile(providersUrl, "utf8");

  assert.match(providers, /<WagmiProvider\s+config=\{config\}>/u);
  assert.doesNotMatch(providers, /initialState=/u);
});
