import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sessionPath = "src/components/wallet/wallet-session.tsx";
const wagmiHookPath = "src/components/wallet/use-tool402-wallet.ts";
const islandPath = "src/components/wallet/wallet-connect.tsx";
const layoutPath = "src/app/layout.tsx";
const signingPath = "src/components/provider/deploy/deploy-stage-signing.tsx";
const sessionExists = existsSync(join(appRoot, sessionPath));
const wagmiHookExists = existsSync(join(appRoot, wagmiHookPath));
const implementedTest = sessionExists ? test : test.skip;

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

function visibleText(node) {
  if (Array.isArray(node)) return node.map(visibleText).join(" ");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node && typeof node === "object" && "props" in node ? visibleText(node.props.children) : "";
}

async function loadClientModule(path, imports) {
  const { outputText } = typescript.transpileModule(await readAppFile(path), {
    fileName: path,
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      assert.ok(Object.hasOwn(imports, specifier), `unexpected import in ${path}: ${specifier}`);
      return imports[specifier];
    },
  }, { filename: path });
  return module.exports;
}

function reactMock(contextValue) {
  const context = { Provider: "WalletSessionContext.Provider", value: contextValue };
  return {
    createContext() {
      return context;
    },
    useContext(target) {
      assert.equal(target, context);
      return context.value;
    },
    useState(initial) {
      return [typeof initial === "function" ? initial() : initial, () => {}];
    },
    useRef(initial) {
      return { current: initial };
    },
    useEffect() {},
  };
}

async function loadWagmiHook(hooks) {
  assert.equal(wagmiHookExists, true, `missing declared source path: ${wagmiHookPath}`);
  return loadClientModule(wagmiHookPath, { wagmi: hooks });
}

function wagmiHarness(options = {}) {
  const calls = { connection: 0, connectors: 0, connect: [], disconnect: [], switchChain: [] };
  const metaMask = { id: "metaMask", type: "injected" };
  const connection = options.connection ?? {
    status: "disconnected",
    address: undefined,
    chainId: undefined,
    connector: undefined,
  };
  const currentConnector = options.currentConnector ?? connection.connector ?? metaMask;
  return {
    calls,
    metaMask,
    hooks: {
      useConnection() {
        calls.connection += 1;
        return connection;
      },
      useConnectors() {
        calls.connectors += 1;
        return options.connectors ?? [metaMask];
      },
      useConnect() {
        return {
          error: options.connectError,
          mutateAsync: async (values) => {
            calls.connect.push(values);
            if (options.connectMutationError) throw options.connectMutationError;
          },
        };
      },
      useDisconnect() {
        return {
          mutateAsync: async (values) => {
            calls.disconnect.push(values);
          },
        };
      },
      useSwitchChain() {
        return {
          error: options.switchError,
          mutateAsync: async (values) => {
            calls.switchChain.push(values);
            if (options.switchMutationError) throw options.switchMutationError;
          },
        };
      },
    },
    currentConnector,
  };
}

const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

test("requires the declared UI-S26 session module", () => {
  assert.equal(sessionExists, true, `missing declared source path: ${sessionPath}`);
});

test("derives connection display state solely from Wagmi values", async () => {
  const { deriveTool402WalletState } = await loadWagmiHook(wagmiHarness().hooks);

  assert.deepEqual(
    deriveTool402WalletState({
      status: "reconnecting",
      address: undefined,
      chainId: undefined,
      connector: undefined,
      hasMetaMaskConnector: true,
    }),
    { kind: "resolving" },
  );
  assert.deepEqual(
    deriveTool402WalletState({
      status: "disconnected",
      address: undefined,
      chainId: 296,
      connector: undefined,
      hasMetaMaskConnector: false,
    }),
    { kind: "no_provider" },
  );
  assert.deepEqual(
    deriveTool402WalletState({
      status: "disconnected",
      address: undefined,
      chainId: 296,
      connector: undefined,
      hasMetaMaskConnector: true,
    }),
    { kind: "disconnected" },
  );
  assert.deepEqual(
    deriveTool402WalletState({
      status: "connected",
      address: "0xC89F87052C3E080B4A9B021D4930055031EF378E",
      chainId: 1,
      connector: { id: "metaMask" },
      hasMetaMaskConnector: true,
    }),
    { kind: "wrong_chain", chainId: 1 },
  );
  assert.deepEqual(
    deriveTool402WalletState({
      status: "connected",
      address: "0xC89F87052C3E080B4A9B021D4930055031EF378E",
      chainId: 296,
      connector: { id: "metaMask" },
      hasMetaMaskConnector: true,
    }),
    { kind: "connected", address },
  );
  assert.deepEqual(
    deriveTool402WalletState({
      status: "disconnected",
      address: undefined,
      chainId: undefined,
      connector: undefined,
      hasMetaMaskConnector: true,
      connectError: new Error("rejected"),
      switchError: undefined,
    }),
    { kind: "request_failed", operation: "connect" },
  );
});

test("uses direct Wagmi hooks and does nothing during a passive reconnect", async () => {
  const harness = wagmiHarness({
    connection: { status: "reconnecting", address: undefined, chainId: undefined, connector: undefined },
  });
  const { useTool402Wallet } = await loadWagmiHook(harness.hooks);
  const wallet = useTool402Wallet();

  assert.deepEqual(wallet.state, { kind: "resolving" });
  assert.equal(harness.calls.connection, 1);
  assert.equal(harness.calls.connectors, 1);
  assert.deepEqual(harness.calls.connect, []);
  assert.deepEqual(harness.calls.switchChain, []);
  assert.deepEqual(harness.calls.disconnect, []);
});

test("uses only explicit MetaMask connect, disconnect, and Hedera switch mutations", async () => {
  const harness = wagmiHarness({
    connection: {
      status: "connected",
      address: "0xC89F87052C3E080B4A9B021D4930055031EF378E",
      chainId: 296,
      connector: { id: "metaMask" },
    },
  });
  const { useTool402Wallet } = await loadWagmiHook(harness.hooks);
  const wallet = useTool402Wallet();

  assert.deepEqual(wallet.state, { kind: "connected", address });
  await wallet.connect();
  await wallet.switchToHedera();
  await wallet.disconnect();
  assert.deepEqual(harness.calls.connect, [{ connector: harness.metaMask }]);
  assert.deepEqual(harness.calls.switchChain, [{ chainId: 296 }]);
  assert.deepEqual(harness.calls.disconnect, [{ connector: harness.currentConnector }]);
});

test("keeps explicit disconnect across a passive remount and exposes connector failures", async () => {
  const disconnected = wagmiHarness();
  const { useTool402Wallet } = await loadWagmiHook(disconnected.hooks);
  const wallet = useTool402Wallet();
  await wallet.disconnect();
  const remounted = useTool402Wallet();
  assert.deepEqual(remounted.state, { kind: "disconnected" });
  assert.deepEqual(disconnected.calls.connect, []);
  assert.deepEqual(disconnected.calls.disconnect, [{ connector: disconnected.currentConnector }]);

  const unavailable = wagmiHarness({ connectors: [] });
  const unavailableApi = await loadWagmiHook(unavailable.hooks);
  assert.deepEqual(unavailableApi.useTool402Wallet().state, { kind: "no_provider" });

  const rejected = wagmiHarness({ connectError: new Error("rejected") });
  const rejectedApi = await loadWagmiHook(rejected.hooks);
  assert.deepEqual(rejectedApi.useTool402Wallet().state, { kind: "request_failed", operation: "connect" });
});

test("owns no connection store or native provider listeners", async () => {
  const source = await readAppFile(wagmiHookPath);

  assert.match(source, /from\s+["']wagmi["']/u);
  for (const hook of ["useConnection", "useConnectors", "useConnect", "useDisconnect", "useSwitchChain"]) {
    assert.match(source, new RegExp(`\\b${hook}\\s*\\(`, "u"));
  }
  assert.doesNotMatch(source, /\b(?:useState|useEffect|useRef|accountsChanged|chainChanged|eip6963)\b/u);
});

implementedTest("exports the fixed session API and throws outside the provider", async () => {
  const source = await readAppFile(sessionPath);

  assert.match(source, /^"use client";/u);
  assert.match(source, /export function WalletSessionProvider\(/u);
  assert.match(source, /export function useWalletSession\(\)/u);
  assert.match(source, /export function connectedWalletSession\(/u);
  assert.match(source, /async function connect\(approvedIssuerAddress\?: string\)/u);
  assert.match(source, /async function switchChain\(\)/u);
  assert.match(source, /function disconnect\(\)/u);
  assert.match(source, /\brecheckAfterSwitch\b/u);
  assert.match(source, /\bwatchWalletSessionChanges\b/u);
  assert.match(source, /\breadCurrentSession\b/u);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/u);

  const walletStateApi = await import("../src/lib/wallet/wallet-state.ts");
  const providerApi = await import("../src/lib/wallet/metamask-provider.ts");
  const api = await loadClientModule(sessionPath, {
    react: reactMock(null),
    "react/jsx-runtime": jsxRuntime,
    "../../lib/wallet/metamask-provider.ts": providerApi,
    "../../lib/wallet/wallet-state.ts": walletStateApi,
  });
  assert.equal(typeof api.WalletSessionProvider, "function");
  assert.throws(() => api.useWalletSession(), /WalletSessionProvider/u);

  const tree = api.WalletSessionProvider({ children: "shell" });
  assert.equal(tree.type, "WalletSessionContext.Provider");
  assert.deepEqual({ ...tree.props.value.state }, { kind: "disconnected" });
  assert.equal(tree.props.value.provider, null);
  for (const method of ["connect", "switchChain", "disconnect"]) {
    assert.equal(typeof tree.props.value[method], "function");
  }
});

implementedTest("discovers MetaMask from explicit connect or one passive initial restoration", async () => {
  const source = await readAppFile(sessionPath);

  assert.equal([...source.matchAll(/discoverMetaMaskProvider\(\s*window\s*\)/gu)].length, 2);
  const connectStart = source.indexOf("async function connect(");
  const connectEnd = source.indexOf("async function switchChain(");
  assert.ok(connectStart !== -1 && connectEnd > connectStart);
  assert.match(source.slice(connectStart, connectEnd), /discoverMetaMaskProvider\(\s*window\s*\)/u);
  const effectStart = source.indexOf("useEffect(");
  const effectEnd = source.indexOf("async function connect(");
  assert.ok(effectStart !== -1 && effectEnd > effectStart);
  assert.match(source.slice(effectStart, effectEnd), /discoverMetaMaskProvider\(\s*window\s*\)/u);
  assert.match(source.slice(effectStart, effectEnd), /readCurrentSession\(/u);
  assert.doesNotMatch(source.slice(effectStart, effectEnd), /eth_requestAccounts|connectWallet|switchChain/u);
});

implementedTest("invalidates late connect and switch results after an explicit disconnect", async () => {
  const source = await readAppFile(sessionPath);
  const connectStart = source.indexOf("async function connect(");
  const switchStart = source.indexOf("async function switchChain(");
  const disconnectStart = source.indexOf("function disconnect()");
  const connect = source.slice(connectStart, switchStart);
  const switchChain = source.slice(switchStart, disconnectStart);

  assert.match(connect, /const generation = sessionReadGenerationRef\.current \+ 1;/u);
  assert.match(connect, /if \(sessionReadGenerationRef\.current !== generation\) return;/u);
  assert.match(switchChain, /const generation = sessionReadGenerationRef\.current \+ 1;/u);
  assert.match(switchChain, /providerRef\.current !== current \|\| sessionReadGenerationRef\.current !== generation/u);
  assert.match(source.slice(disconnectStart), /sessionReadGenerationRef\.current \+= 1;/u);
});

implementedTest("keeps the session provider inside the root Wagmi provider until its consumers migrate", async () => {
  const layout = await readAppFile(layoutPath);

  assert.match(layout, /import\s*\{\s*WalletProviders\s*\}\s+from\s+["']\.\.\/components\/wallet\/wallet-providers["']/u);
  assert.match(layout, /import\s*\{\s*WalletSessionProvider\s*\}\s+from\s+["']\.\.\/components\/wallet\/wallet-session["']/u);
  assert.match(layout, /import\s*\{\s*WalletIsland\s*\}\s+from\s+["']\.\.\/components\/wallet\/wallet-connect["']/u);
  assert.match(layout, /<WalletProviders>\s*<WalletSessionProvider>\s*<div data-ui-shell=["']s00["']/u);
  assert.match(layout, /<\/div>\s*<\/WalletSessionProvider>\s*<\/WalletProviders>\s*<\/body>/u);
  assert.match(layout, /Prepare a tool\s*<\/Link>\s*<WalletIsland \/>/u);
  assert.equal((layout.match(/<WalletIsland \/>/gu) ?? []).length, 1);
});

implementedTest("renders the compact header control from the Wagmi-derived wallet only", async () => {
  const source = await readAppFile(islandPath);

  assert.match(source, /^"use client";/u);
  assert.match(source, /import Link from ["']next\/link["'];/u);
  assert.match(source, /import\s*\{\s*useTool402Wallet\s*\}\s+from\s+["']\.\/use-tool402-wallet["']/u);
  assert.doesNotMatch(source, /wallet-session|wallet-state|metamask-provider/u);
  assert.doesNotMatch(source, /\buseState\b|\buseRef\b|\buseEffect\b/u, "the island holds no local session state");
  assert.doesNotMatch(source, /discoverMetaMaskProvider|connectWallet|readCurrentSession|recheckAfterSwitch/u);
  assert.doesNotMatch(source, /Disconnect/u, "the header renders no disconnect control");
  assert.doesNotMatch(source, /<h2\b/u);

  const expectations = [
    [{ kind: "disconnected" }, { label: "Connect MetaMask", variant: "outline", disabled: false }],
    [{ kind: "resolving" }, { label: "Connecting…", disabled: true }],
    [{ kind: "connecting" }, { label: "Connecting…", disabled: true }],
    [{ kind: "wrong_chain", chainId: 1 }, { label: "Switch to Hedera Testnet", variant: "outline", disabled: false }],
    [{ kind: "no_provider" }, { label: "Retry", variant: "outline", disabled: false }],
    [{ kind: "request_failed", operation: "connect" }, { label: "Retry", variant: "outline", disabled: false }],
    [{ kind: "connected", address }, { badge: true }],
  ];

  for (const [state, expected] of expectations) {
    const calls = [];
    const wallet = {
      state,
      connect: (...arguments_) => calls.push(["connect", ...arguments_]),
      switchToHedera: () => calls.push(["switchToHedera"]),
      disconnect: () => calls.push(["disconnect"]),
    };
    const api = await loadClientModule(islandPath, {
      "react/jsx-runtime": jsxRuntime,
      "next/link": { default: "Link" },
      "next/image": { default: "Image" },
      "../ui/badge": { Badge: "Badge" },
      "../ui/button": { Button: "Button" },
      "./use-tool402-wallet": { useTool402Wallet: () => wallet },
    });
    const tree = api.WalletIsland({});
    const buttons = elements(tree).filter((element) => element.type === "Button");
    const badges = elements(tree).filter((element) => element.type === "Badge");
    const live = elements(tree).find((element) => element.props["aria-live"] === "polite");

    assert.ok(live, `${state.kind} renders a polite live region`);
    assert.match(live.props.className, /\bsr-only\b/u);
    assert.ok(visibleText(live).length > 0);

    if (expected.badge) {
      assert.equal(buttons.length, 0, `${state.kind} renders no button`);
      assert.equal(badges.length, 1);
      assert.equal(badges[0].props.variant, "secondary");
      assert.equal(badges[0].props.title, address);
      assert.equal(visibleText(badges[0]), "0xc89f…378e");
      const dashboardLinks = elements(tree).filter((element) => element.type === "Link");
      assert.equal(dashboardLinks.length, 1, `${state.kind} renders one dashboard link`);
      assert.equal(dashboardLinks[0].props.href, "/dashboard");
      assert.equal(dashboardLinks[0].props.prefetch, false, `${state.kind} evaluates dashboard access on click`);
      assert.match(dashboardLinks[0].props.className, /\btouch-target\b/u);
      continue;
    }

    assert.equal(badges.length, 0, `${state.kind} renders no badge`);
    assert.equal(buttons.length, 1, `${state.kind} renders one control`);
    const [button] = buttons;
    assert.equal(visibleText(button).trim(), expected.label);
    assert.equal(button.props.size, "sm");
    if (state.kind === "disconnected") {
      const icons = elements(button).filter((element) => element.type === "Image");
      assert.equal(icons.length, 1, "the disconnected control carries the MetaMask icon");
      assert.equal(icons[0].props.src, "/brand/metamask-fox.svg");
      assert.equal(icons[0].props.alt, "");
      assert.equal(icons[0].props["aria-hidden"], "true");
      assert.match(button.props.className, /\bgap-2\b/u);
    }
    if (expected.disabled) {
      assert.equal(button.props.disabled, true);
      assert.equal(button.props["aria-disabled"], "true");
    } else {
      assert.equal(button.props.variant, expected.variant);
      button.props.onClick();
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], state.kind === "wrong_chain" ? "switchToHedera" : "connect");
      assert.equal(calls[0].length, 1, "the header selects no account or authority itself");
    }
  }
});

implementedTest("reads the shared session in the signing stage instead of mounting a wallet block", async () => {
  const signing = await readAppFile(signingPath);

  assert.doesNotMatch(signing, /WalletIsland/u);
  assert.match(signing, /import\s*\{[^}]*\buseWalletSession\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/wallet-session["']/u);
  assert.equal((signing.match(/useWalletSession\(\)/gu) ?? []).length, 1);
  assert.match(signing, /data-ui=["']provider-deploy-connect["']/u);
  assert.match(signing, /wallet\.state\.kind === "disconnected"/u);
  assert.match(signing, /wallet\.state\.kind === "no_provider"/u);
  assert.match(signing, /wallet\.state\.kind === "multiple_providers"/u);
  assert.match(signing, /void wallet\.connect\(\)/u);
  assert.doesNotMatch(signing, /approved issuer|issuer-specific/u);
  assert.doesNotMatch(signing, /approvedIssuerAddress/u, "the wizard passes no approved issuer address");
  assert.match(signing, /connectedWalletSession\(wallet\)/u);
  assert.equal((signing.match(/<SignatureDialog\b/gu) ?? []).length, 1);
});
