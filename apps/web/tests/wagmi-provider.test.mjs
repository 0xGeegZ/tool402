import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { JSDOM } from "jsdom";
import React, { StrictMode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";
import { connect, disconnect, getConnectors as getWagmiConnectors } from "wagmi/actions";
import { useConnection } from "wagmi";

const configUrl = new URL("../src/lib/wallet/wagmi-config.ts", import.meta.url);
const configPath = fileURLToPath(configUrl);
const configExists = existsSync(configPath);
const providersUrl = new URL("../src/components/wallet/wallet-providers.tsx", import.meta.url);
const providersPath = fileURLToPath(providersUrl);
const providersExist = existsSync(providersPath);
const dashboardSessionSyncUrl = new URL("../src/components/auth/dashboard-session-sync.tsx", import.meta.url);
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

function moduleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

async function transpiledModule(url, replacements = []) {
  let { outputText } = typescript.transpileModule(await readFile(url, "utf8"), {
    fileName: fileURLToPath(url),
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.ESNext,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  for (const [from, to] of replacements) outputText = outputText.split(from).join(to);
  return moduleUrl(outputText);
}

const browserTestImports = await Promise.all([
  "wagmi",
  "@tanstack/react-query",
  "react",
  "react/jsx-runtime",
].map(async (specifier) => [`"${specifier}"`, `"${await import.meta.resolve(specifier)}"`]));

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div></body></html>", { url: "http://localhost:3000" });
  const properties = ["window", "document", "navigator", "HTMLElement", "Event", "CustomEvent", "IS_REACT_ACT_ENVIRONMENT"];
  const previous = new Map(properties.map((property) => [property, Object.getOwnPropertyDescriptor(globalThis, property)]));
  for (const [property, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    Object.defineProperty(globalThis, property, { configurable: true, writable: true, value });
  }
  return () => {
    for (const property of properties) {
      const descriptor = previous.get(property);
      if (descriptor === undefined) delete globalThis[property];
      else Object.defineProperty(globalThis, property, descriptor);
    }
    dom.window.close();
  };
}

function deferredMetaMask(address) {
  const listeners = new Map();
  const accountRequests = [];
  const explicitAccountRequests = [];
  const calls = [];
  let accounts = [address];
  let chainId = "0x128";
  let holdAccounts = true;
  let holdExplicitAccounts = true;
  const provider = {
    isMetaMask: true,
    async request({ method }) {
      calls.push(method);
      if (method === "eth_accounts") {
        if (!holdAccounts) return accounts;
        return await new Promise((resolve) => accountRequests.push(resolve));
      }
      if (method === "eth_chainId") return chainId;
      if (method === "wallet_requestPermissions") return [];
      if (method === "eth_requestAccounts") {
        if (!holdExplicitAccounts) return accounts;
        return await new Promise((resolve) => explicitAccountRequests.push(resolve));
      }
      if (method === "wallet_revokePermissions") return null;
      throw new Error(`unexpected provider request: ${method}`);
    },
    on(event, listener) {
      const values = listeners.get(event) ?? new Set();
      values.add(listener);
      listeners.set(event, values);
    },
    removeListener(event, listener) {
      listeners.get(event)?.delete(listener);
    },
  };
  return {
    calls,
    provider,
    get pendingAccountRequests() {
      return accountRequests.length;
    },
    get pendingExplicitAccountRequests() {
      return explicitAccountRequests.length;
    },
    resolveAccounts() {
      holdAccounts = false;
      for (const resolve of accountRequests.splice(0)) resolve(accounts);
    },
    resolveExplicitAccounts() {
      holdExplicitAccounts = false;
      for (const resolve of explicitAccountRequests.splice(0)) resolve(accounts);
    },
    emit(event, value) {
      for (const listener of listeners.get(event) ?? []) listener(value);
    },
    setAccounts(next) {
      accounts = next;
    },
    setChainId(next) {
      chainId = next;
    },
  };
}

async function flushReact() {
  await act(async () => {
    for (let index = 0; index < 12; index += 1) await Promise.resolve();
  });
}

async function until(predicate) {
  for (let index = 0; index < 80; index += 1) {
    await flushReact();
    if (predicate()) return;
  }
  assert.fail("condition did not settle");
}

implementedProviderTest("uses real React and Wagmi lifecycle state for passive restore, wallet changes, and explicit disconnect", async () => {
  const restoreDom = installDom();
  try {
    const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
    const changedAddress = "0x0000000000000000000000000000000000000402";
    const metaMask = deferredMetaMask(address);
    Object.defineProperty(window, "ethereum", { configurable: true, value: metaMask.provider });

    const configModule = await import(await transpiledModule(configUrl, browserTestImports));
    const config = configModule.getTool402WagmiConfig();
    const providersModule = await import(await transpiledModule(providersUrl, [
      ...browserTestImports,
      ["\"../../lib/wallet/wagmi-config\"", `"${moduleUrl("export const getTool402WagmiConfig = () => globalThis.__tool402WagmiTestConfig;")}"`],
    ]));
    globalThis.__tool402WagmiTestConfig = config;

    const observations = [];
    function Probe() {
      const connection = useConnection();
      observations.push({
        account: connection.address?.toLowerCase(),
        chainId: connection.chainId,
        restoring: providersModule.usePassiveWalletRestore(),
        status: connection.status,
      });
      return null;
    }
    const root = createRoot(document.getElementById("root"));
    await act(async () => {
      root.render(React.createElement(StrictMode, null, React.createElement(providersModule.WalletProviders, null, React.createElement(Probe))));
    });
    await until(() => metaMask.pendingAccountRequests > 0);

    assert.equal(observations.some((entry) => entry.restoring === true), true);
    assert.equal(metaMask.calls.includes("eth_requestAccounts"), false);
    await act(async () => { metaMask.resolveAccounts(); });
    await until(() => observations.some((entry) => entry.restoring === false && entry.account === address));

    await act(async () => { await disconnect(config, { connector: getWagmiConnectors(config)[0] }); });
    await until(() => observations.at(-1)?.status === "disconnected");
    let pendingConnection;
    await act(async () => {
      pendingConnection = connect(config, { connector: getWagmiConnectors(config)[0] });
      await Promise.resolve();
    });
    await until(() => metaMask.pendingExplicitAccountRequests > 0 && observations.at(-1)?.status === "connecting");
    await act(async () => {
      metaMask.resolveExplicitAccounts();
      await pendingConnection;
    });
    await until(() => observations.at(-1)?.account === address);
    const explicitRequestCount = metaMask.calls.filter((method) => method === "eth_requestAccounts").length;

    metaMask.setAccounts([changedAddress]);
    await act(async () => { metaMask.emit("accountsChanged", [changedAddress]); });
    await until(() => observations.some((entry) => entry.account === changedAddress));

    metaMask.setChainId("0x1");
    await act(async () => { metaMask.emit("chainChanged", "0x1"); });
    await until(() => observations.some((entry) => entry.chainId === 1));

    await act(async () => { await disconnect(config, { connector: getWagmiConnectors(config)[0] }); });
    await until(() => observations.at(-1)?.status === "disconnected");
    await act(async () => { root.unmount(); });

    const refreshedRoot = createRoot(document.getElementById("root"));
    await act(async () => {
      refreshedRoot.render(React.createElement(providersModule.WalletProviders, null, React.createElement(Probe)));
    });
    await until(() => observations.at(-1)?.restoring === false);
    assert.equal(observations.at(-1)?.status, "disconnected");
    assert.equal(metaMask.calls.filter((method) => method === "eth_requestAccounts").length, explicitRequestCount);
    await act(async () => { refreshedRoot.unmount(); });
  } finally {
    delete globalThis.__tool402WagmiTestConfig;
    restoreDom();
  }
});

function journeyMetaMask(address) {
  const listeners = new Map();
  let accounts = [];
  const provider = {
    isMetaMask: true,
    async request({ method }) {
      if (method === "eth_accounts") return accounts;
      if (method === "eth_chainId") return "0x128";
      if (method === "wallet_requestPermissions") return [];
      if (method === "eth_requestAccounts") {
        accounts = [address];
        return accounts;
      }
      if (method === "personal_sign") return `0x${"11".repeat(65)}`;
      if (method === "wallet_revokePermissions") return null;
      throw new Error(`unexpected provider request: ${method}`);
    },
    on(event, listener) {
      const values = listeners.get(event) ?? new Set();
      values.add(listener);
      listeners.set(event, values);
    },
    removeListener(event, listener) {
      listeners.get(event)?.delete(listener);
    },
  };
  return {
    provider,
    switchAccount(next) {
      accounts = [next];
      for (const listener of listeners.get("accountsChanged") ?? []) listener(accounts);
    },
  };
}

async function journeyComponents(config) {
  const configStub = moduleUrl("export const getTool402WagmiConfig = () => globalThis.__tool402WagmiTestConfig;");
  const providers = await transpiledModule(providersUrl, [
    ...browserTestImports,
    ["\"../../lib/wallet/wagmi-config\"", `"${configStub}"`],
  ]);
  const hook = await transpiledModule(new URL("../src/components/wallet/use-tool402-wallet.ts", import.meta.url), [
    ...browserTestImports,
    ["\"./wallet-providers\"", `"${providers}"`],
  ]);
  const button = moduleUrl(`import React from ${JSON.stringify(await import.meta.resolve("react"))}; export function Button({ children, ...props }) { return React.createElement("button", props, children); }`);
  const navigation = moduleUrl("export const useRouter = () => globalThis.__tool402WalletJourneyRouter;");
  const demo = moduleUrl("export const dashboardTourHref = () => \"/dashboard\";");
  const synchronizer = await transpiledModule(dashboardSessionSyncUrl, [
    ...browserTestImports,
    ["\"../wallet/use-tool402-wallet\"", `"${hook}"`],
    ["\"../ui/button\"", `"${button}"`],
    ["\"next/navigation\"", `"${navigation}"`],
  ]);
  const signIn = await transpiledModule(new URL("../src/components/auth/metamask-dashboard-sign-in.tsx", import.meta.url), [
    ...browserTestImports,
    ["\"../wallet/use-tool402-wallet\"", `"${hook}"`],
    ["\"../ui/button\"", `"${button}"`],
    ["\"../demo/demo-tour-navigation\"", `"${demo}"`],
    ["\"./dashboard-session-sync\"", `"${synchronizer}"`],
    ["\"next/navigation\"", `"${navigation}"`],
  ]);
  globalThis.__tool402WagmiTestConfig = config;
  return {
    ...(await import(providers)),
    ...(await import(synchronizer)),
    ...(await import(signIn)),
  };
}

function buttonByText(text) {
  return [...document.querySelectorAll("button")].find((button) => button.textContent === text);
}

implementedProviderTest("runs a deterministic mock-wallet journey from connect through sign-in, refresh, and account change", async () => {
  const restoreDom = installDom();
  const originalFetch = globalThis.fetch;
  try {
    const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
    const switchedAddress = "0x0000000000000000000000000000000000000402";
    const wallet = journeyMetaMask(address);
    const routes = [];
    const fetches = [];
    Object.defineProperty(window, "ethereum", { configurable: true, value: wallet.provider });
    globalThis.__tool402WalletJourneyRouter = { replace: (route) => routes.push(route), refresh() {} };
    globalThis.fetch = async (path, init) => {
      fetches.push([path, init]);
      if (path === "/api/auth/metamask/challenge") {
        return { ok: true, async json() { return { message: "Tool402 sign-in", challenge: "challenge", expiresAt: "2026-09-14T12:05:00.000Z" }; } };
      }
      if (path === "/api/auth/metamask/verify") {
        return { ok: true, async json() { return { outcome: "authenticated", sessionIssuedAt: "2026-09-14T12:00:00.000Z" }; } };
      }
      if (path === "/api/auth/logout") return { status: 204 };
      throw new Error(`unexpected route: ${path}`);
    };

    const configModule = await import(await transpiledModule(configUrl, browserTestImports));
    const config = configModule.getTool402WagmiConfig();
    await config.storage.setItem("tool402:wallet-journey", { restored: true });
    assert.deepEqual(await configModule.getTool402WagmiConfig().storage.getItem("tool402:wallet-journey"), { restored: true });
    const components = await journeyComponents(config);
    const root = createRoot(document.getElementById("root"));
    await act(async () => {
      root.render(React.createElement(components.WalletProviders, null, React.createElement(components.MetaMaskDashboardSignIn)));
    });
    await until(() => buttonByText("Connect MetaMask")?.disabled === false);
    await act(async () => { buttonByText("Connect MetaMask").click(); });
    await until(() => buttonByText("Sign and open dashboard")?.disabled === false);
    await act(async () => { buttonByText("Sign and open dashboard").click(); });
    await until(() => routes.includes("/dashboard"));
    assert.deepEqual(fetches.map(([path]) => path), ["/api/auth/metamask/challenge", "/api/auth/metamask/verify"]);

    await act(async () => { root.unmount(); });
    const refreshedConfig = configModule.getTool402WagmiConfig();
    const refreshedComponents = await journeyComponents(refreshedConfig);
    const refreshedRoot = createRoot(document.getElementById("root"));
    const refreshedObservations = [];
    function RefreshedProbe({ children }) {
      const connection = useConnection();
      refreshedObservations.push({
        account: connection.address?.toLowerCase(),
        restoring: refreshedComponents.usePassiveWalletRestore(),
        status: connection.status,
      });
      return children;
    }
    await act(async () => {
      refreshedRoot.render(React.createElement(refreshedComponents.WalletProviders, null, React.createElement(RefreshedProbe, null, React.createElement(refreshedComponents.DashboardSessionSync, {
        address,
        issuedAt: "2026-09-14T12:00:00.000Z",
      }, "signed dashboard"))));
    });
    await until(() => refreshedObservations.some((entry) => entry.restoring === false && entry.status === "connected" && entry.account === address));
    await until(() => document.body.textContent.includes("signed dashboard"));
    await act(async () => { wallet.switchAccount(switchedAddress); });
    await until(() => routes.includes("/sign-in/account-changed"));
    assert.equal(fetches.at(-1)?.[0], "/api/auth/logout");
    await act(async () => { refreshedRoot.unmount(); });
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.__tool402WalletJourneyRouter;
    delete globalThis.__tool402WagmiTestConfig;
    restoreDom();
  }
});
