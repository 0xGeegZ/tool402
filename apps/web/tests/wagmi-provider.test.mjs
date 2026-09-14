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
  assert.deepEqual(
    api.tool402WagmiConfig.chains.map((chain) => chain.id),
    [296],
  );
  assert.equal(api.tool402HederaTestnet.id, 296);
  assert.equal(api.tool402HederaTestnet.name, "Hedera Testnet");
});

implementedConfigTest("starts server-neutral with one injected MetaMask connector", () => {
  assert.equal(api.tool402WagmiConfig.state.status, "disconnected");
  assert.equal(api.tool402WagmiConfig.state.current, null);
  assert.equal(api.tool402WagmiConfig.state.connections.size, 0);
  const connectors = getConnectors(api.tool402WagmiConfig);
  assert.equal(connectors.length, 1);
  assert.equal(connectors[0]?.type, "injected");
  assert.equal(connectors[0]?.id, "metaMask");
});

implementedConfigTest("uses the configured Hashio transport for its public client", () => {
  const client = getPublicClient(api.tool402WagmiConfig);
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
        injected: (value) => ({ type: "injected", ...value }),
        http: (url) => ({ url }),
      };
      throw new Error(`unexpected config import: ${specifier}`);
    },
  }, { filename: configPath });
  return options;
}

implementedConfigTest("uses client-side persistence and explicitly targets MetaMask", async () => {
  const options = await captureConfigOptions();
  assert.equal(options?.ssr, false);
  assert.equal(options?.connectors?.length, 1);
  assert.equal(options?.connectors?.[0]?.type, "injected");
  assert.equal(options?.connectors?.[0]?.target, "metaMask");
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
              queryClient ??= create();
              return [queryClient];
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
          return api;
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
  assert.equal(harness.wagmiCalls[0]?.config, api.tool402WagmiConfig);
  assert.equal(harness.wagmiCalls[1]?.config, api.tool402WagmiConfig);
  assert.equal(harness.queryCalls.length, 2);
  assert.equal(harness.queryCalls[0]?.client instanceof harness.QueryClient, true);
  assert.equal(harness.queryCalls[0]?.client, harness.queryCalls[1]?.client);
});

implementedProviderTest("mounts the client provider once from the root layout", async () => {
  const layoutUrl = new URL("../src/app/layout.tsx", import.meta.url);
  const layoutPath = fileURLToPath(layoutUrl);
  const { outputText } = typescript.transpileModule(await readFile(layoutUrl, "utf8"), {
    fileName: layoutPath,
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS, jsx: typescript.JsxEmit.ReactJSX },
  });
  const { WalletProviders } = await loadProviders();
  const module = { exports: {} };
  const passthrough = ({ children }) => children;
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      if (specifier === "react/jsx-runtime") return jsxRuntime;
      if (specifier === "react") return { Suspense: passthrough };
      if (specifier === "next/link") return passthrough;
      if (specifier === "nuqs/adapters/next/app") return { NuqsAdapter: passthrough };
      if (specifier === "../components/wallet/wallet-providers") return { WalletProviders };
      return { DashboardNavigation: passthrough, DemoTourBar: passthrough, LocalNavigation: passthrough, Logo: passthrough, WalletIsland: passthrough };
    },
  }, { filename: layoutPath });
  const root = module.exports.default({ children: "route" });
  const countProviders = (node) => {
    if (node === null || typeof node !== "object") return 0;
    const self = node.type === WalletProviders ? 1 : 0;
    const children = node.props?.children;
    return self + (Array.isArray(children) ? children.reduce((total, child) => total + countProviders(child), 0) : countProviders(children));
  };
  assert.equal(countProviders(root), 1);
});
