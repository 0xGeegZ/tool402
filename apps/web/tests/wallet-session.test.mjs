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
const islandPath = "src/components/wallet/wallet-connect.tsx";
const layoutPath = "src/app/layout.tsx";
const signingPath = "src/components/provider/deploy/deploy-stage-signing.tsx";
const sessionExists = existsSync(join(appRoot, sessionPath));
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

const address = "0xc89f87052c3e080b4a9b021d4930055031ef378e";

test("requires the declared UI-S26 session module", () => {
  assert.equal(sessionExists, true, `missing declared source path: ${sessionPath}`);
});

implementedTest("exports the fixed session API and throws outside the provider", async () => {
  const source = await readAppFile(sessionPath);

  assert.match(source, /^"use client";/u);
  assert.match(source, /export function WalletSessionProvider\(/u);
  assert.match(source, /export function useWalletSession\(\)/u);
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
  assert.deepEqual(tree.props.value.state, { kind: "disconnected" });
  assert.equal(tree.props.value.provider, null);
  for (const method of ["connect", "switchChain", "disconnect"]) {
    assert.equal(typeof tree.props.value[method], "function");
  }
});

implementedTest("discovers MetaMask only inside connect and never at load, render, or in an effect", async () => {
  const source = await readAppFile(sessionPath);

  assert.equal([...source.matchAll(/discoverMetaMaskProvider\(\s*window\s*\)/gu)].length, 1);
  const connectStart = source.indexOf("async function connect(");
  const connectEnd = source.indexOf("async function switchChain(");
  assert.ok(connectStart !== -1 && connectEnd > connectStart);
  assert.match(source.slice(connectStart, connectEnd), /discoverMetaMaskProvider\(\s*window\s*\)/u);
  const effectStart = source.indexOf("useEffect(");
  const effectEnd = source.indexOf("async function connect(");
  assert.ok(effectStart !== -1 && effectEnd > effectStart);
  assert.doesNotMatch(source.slice(effectStart, effectEnd), /discoverMetaMaskProvider/u);
});

implementedTest("wraps the shell in the session provider and renders the control after the navigation", async () => {
  const layout = await readAppFile(layoutPath);

  assert.match(layout, /import\s*\{\s*WalletSessionProvider\s*\}\s+from\s+["']\.\.\/components\/wallet\/wallet-session["']/u);
  assert.match(layout, /import\s*\{\s*WalletIsland\s*\}\s+from\s+["']\.\.\/components\/wallet\/wallet-connect["']/u);
  assert.match(layout, /<WalletSessionProvider>\s*<div data-ui-shell=["']s00["']/u);
  assert.match(layout, /<\/div>\s*<\/WalletSessionProvider>\s*<\/body>/u);
  assert.match(layout, /<LocalNavigation \/>\s*<WalletIsland \/>/u);
  assert.equal((layout.match(/<WalletIsland \/>/gu) ?? []).length, 1);
});

implementedTest("renders the compact header control per session kind from the shared session only", async () => {
  const source = await readAppFile(islandPath);

  assert.match(source, /^"use client";/u);
  assert.match(source, /import\s*\{\s*useWalletSession\s*\}\s+from\s+["']\.\/wallet-session["']/u);
  assert.doesNotMatch(source, /\buseState\b|\buseRef\b|\buseEffect\b/u, "the island holds no local session state");
  assert.doesNotMatch(source, /discoverMetaMaskProvider|connectWallet|readCurrentSession|recheckAfterSwitch/u);
  assert.doesNotMatch(source, /Disconnect/u, "the header renders no disconnect control");
  assert.doesNotMatch(source, /<h2\b/u);

  const expectations = [
    [{ kind: "disconnected" }, { label: "Connect MetaMask", variant: "outline", disabled: false }],
    [{ kind: "connecting" }, { label: "Connecting…", disabled: true }],
    [{ kind: "wrong_chain", chainId: "0x1" }, { label: "Switch to Hedera Testnet", variant: "outline", disabled: false }],
    [{ kind: "no_provider" }, { label: "Retry", variant: "outline", disabled: false }],
    [{ kind: "multiple_providers" }, { label: "Retry", variant: "outline", disabled: false }],
    [{ kind: "connected", address }, { badge: true }],
    [{ kind: "not_issuer", address, approvedIssuerAddress: "0x0000000000000000000000000000000000000402" }, { badge: true }],
  ];

  for (const [state, expected] of expectations) {
    const calls = [];
    const session = {
      state,
      provider: null,
      connect: (...arguments_) => calls.push(["connect", ...arguments_]),
      switchChain: () => calls.push(["switchChain"]),
      disconnect: () => calls.push(["disconnect"]),
    };
    const api = await loadClientModule(islandPath, {
      "react/jsx-runtime": jsxRuntime,
      "../ui/badge": { Badge: "Badge" },
      "../ui/button": { Button: "Button" },
      "./wallet-session": { useWalletSession: () => session },
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
      continue;
    }

    assert.equal(badges.length, 0, `${state.kind} renders no badge`);
    assert.equal(buttons.length, 1, `${state.kind} renders one control`);
    const [button] = buttons;
    assert.equal(visibleText(button), expected.label);
    assert.equal(button.props.size, "sm");
    if (expected.disabled) {
      assert.equal(button.props.disabled, true);
      assert.equal(button.props["aria-disabled"], "true");
    } else {
      assert.equal(button.props.variant, expected.variant);
      button.props.onClick();
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], state.kind === "wrong_chain" ? "switchChain" : "connect");
      assert.equal(calls[0].length, 1, "the header passes no approved issuer address");
    }
  }
});

implementedTest("reads the shared session in the signing stage instead of mounting a wallet block", async () => {
  const signing = await readAppFile(signingPath);

  assert.doesNotMatch(signing, /WalletIsland/u);
  assert.match(signing, /import\s*\{[^}]*\buseWalletSession\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/wallet-session["']/u);
  assert.equal((signing.match(/useWalletSession\(\)/gu) ?? []).length, 1);
  assert.match(signing, /Connect MetaMask from the header to sign\./u);
  assert.match(signing, /Connect MetaMask on Hedera Testnet from the header to enable the first stage/u);
  assert.doesNotMatch(signing, /approvedIssuerAddress/u, "the wizard passes no approved issuer address");
  assert.match(signing, /<SessionReporter\b/u);
  assert.equal((signing.match(/<SignatureDialog\b/gu) ?? []).length, 1);
});
