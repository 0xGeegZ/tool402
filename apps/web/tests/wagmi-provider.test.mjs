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

test("requires the declared W01 Wagmi configuration module", () => {
  assert.equal(configExists, true, `missing W01 Wagmi configuration: ${configPath}`);
});

test("requires the declared W01 client provider module", () => {
  assert.equal(providersExist, true, `missing W01 client provider: ${providersPath}`);
});

test.before(async () => {
  if (configExists) {
    api = await import(configUrl.href);
    ({ getConnectors } = await import("wagmi/actions"));
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
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      switch (specifier) {
        case "react":
          return { useState: (create) => [create()] };
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
  assert.equal(harness.WalletProviders({ children: "shell" }), "shell");
  assert.equal(harness.wagmiCalls.length, 1);
  assert.equal(harness.wagmiCalls[0]?.config, api.tool402WagmiConfig);
  assert.equal(harness.queryCalls.length, 1);
  assert.equal(harness.queryCalls[0]?.client instanceof harness.QueryClient, true);
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
  const containsProvider = (node) => {
    if (node === null || typeof node !== "object") return false;
    if (node.type === WalletProviders) return true;
    const children = node.props?.children;
    return Array.isArray(children) ? children.some(containsProvider) : containsProvider(children);
  };
  assert.equal(containsProvider(root), true);
});
