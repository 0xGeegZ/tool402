import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runInNewContext } from "node:vm";
import { JSDOM } from "jsdom";
import React from "react";
import { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const actionPath = join(appRoot, "src/components/provider/deploy/ats-create-action.tsx");
const stagesPath = join(appRoot, "src/components/provider/deploy/provider-deploy-stages.tsx");
const signingPath = join(appRoot, "src/components/provider/deploy/deploy-stage-signing.tsx");

async function sources() {
  return Promise.all([readFile(actionPath, "utf8"), readFile(stagesPath, "utf8"), readFile(signingPath, "utf8")]);
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

async function actionHarness(stored = new Map(), bridgeOverride, locksOverride) {
  const slots = [];
  let cursor = 0;
  const fetchCalls = [];
  let activeSession = null;
  let generation = 0;
  globalThis.window = {
    localStorage: {
      getItem(key) { return stored.get(key) ?? null; },
      setItem(key, value) { stored.set(key, value); },
      removeItem(key) { stored.delete(key); },
    },
  };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    locks: locksOverride ?? {
      request(_name, _options, callback) { return callback(); },
    },
  } });
  const bridge = bridgeOverride ?? await import("../src/lib/ats/stage-b-browser-provider-bridge.ts");
  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  const imports = {
    react: {
      useRef(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (value) => {
          slots[index] = typeof value === "function" ? value(slots[index]) : value;
        }];
      },
      useEffect(effect) {
        effect();
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "../../../lib/ats/stage-b-browser-provider-bridge.ts": bridge,
    "./stage-b-recovery": recovery,
    "../../ui/button": { Button: "Button" },
    "../../ui/status": { StatusRegion: "StatusRegion" },
    wagmi: {
      usePublicClient: () => activeSession === null ? undefined : ({
        getTransactionReceipt: ({ hash }) => activeSession.getTransactionReceipt
          ? activeSession.getTransactionReceipt({ hash })
          : activeSession.provider.request({ method: "eth_getTransactionReceipt", params: [hash] }),
      }),
      useSendTransaction: () => ({
        mutateAsync: ({ account, to, data, value }) => activeSession.provider.request({
          method: "eth_sendTransaction",
          params: [{ from: account, to, data, value: `0x${value.toString(16)}` }],
        }),
      }),
    },
    "../../wallet/use-tool402-wallet": {
      connectedTool402Wallet: (connection, resolved) => resolved && connection.status === "connected" && connection.account !== undefined && connection.chainId === 296 && connection.connector?.id === "metaMask" ? connection : null,
      useTool402Wallet: () => activeSession === null ? {
        resolved: true,
        connection: { status: "disconnected", account: undefined, chainId: undefined, connector: undefined, generation },
      } : {
        resolved: true,
        connection: { status: "connected", account: activeSession.address, chainId: activeSession.chainId ?? 296, connector: { id: "metaMask" }, generation },
      },
    },
  };
  const { outputText } = typescript.transpileModule(await readFile(actionPath, "utf8"), {
    fileName: actionPath,
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
      assert.ok(Object.hasOwn(imports, specifier), `unexpected action import: ${specifier}`);
      return imports[specifier];
    },
    module,
    fetch(...input) {
      fetchCalls.push(input);
      throw new Error("the regression harness must never use a live fetch");
    },
    Promise,
    Object,
    Error,
    JSON,
    window: {
      localStorage: {
        getItem(key) { return stored.get(key) ?? null; },
        setItem(key, value) { stored.set(key, value); },
        removeItem(key) { stored.delete(key); },
      },
    },
  }, { filename: actionPath });
  return {
    render(props) {
      if (props.session !== undefined && props.session !== activeSession) {
        activeSession = props.session;
        generation += 1;
      }
      cursor = 0;
      module.exports.AtsCreateAction({ preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg", ...props });
      cursor = 0;
      return module.exports.AtsCreateAction({ preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg", ...props });
    },
    fetchCalls() { return fetchCalls; },
    stored() { return new Map(stored); },
  };
}

function lockDelayedOnRequest(targetRequest) {
  let requestCount = 0;
  let markDelayedRequest;
  let releaseDelayedRequest;
  const delayedRequest = new Promise((resolve) => { markDelayedRequest = resolve; });
  const released = new Promise((resolve) => { releaseDelayedRequest = resolve; });
  return {
    locks: {
      async request(_name, _options, callback) {
        requestCount += 1;
        if (requestCount === targetRequest) {
          markDelayedRequest();
          await released;
        }
        return callback();
      },
    },
    delayedRequest,
    release() { releaseDelayedRequest(); },
  };
}

function actionDataModule(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

async function loadMountedAction() {
  const reactUrl = await import.meta.resolve("react");
  const jsxRuntimeUrl = await import.meta.resolve("react/jsx-runtime");
  const bridge = actionDataModule(`
    export const isCanonicalStageBTransactionHash = (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/.test(value);
    export function createStageBBrowserProviderBridge() {
      return {
        async execute() { globalThis.__atsMountedExecuteCalls += 1; throw new Error("a recovery test must not create a transaction"); },
        async recover() { globalThis.__atsMountedRecoverCalls += 1; return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } }; },
      };
    }
  `);
  const wallet = actionDataModule(`
    export function connectedTool402Wallet(connection, resolved) {
      return resolved && connection.status === "connected" && connection.account !== undefined && connection.chainId === 296 && connection.connector?.id === "metaMask" ? connection : null;
    }
    export function useTool402Wallet() { return globalThis.__atsMountedWallet; }
  `);
  const wagmi = actionDataModule(`
    export function usePublicClient() { return { getTransactionReceipt: async () => null }; }
    export function useSendTransaction() { return { mutateAsync: async () => { throw new Error("a recovery test must not send a transaction"); } }; }
  `);
  const button = actionDataModule(`import React from ${JSON.stringify(reactUrl)}; export function Button({ children, ...props }) { return React.createElement("button", props, children); }`);
  const status = actionDataModule(`import React from ${JSON.stringify(reactUrl)}; export function StatusRegion({ children, ...props }) { return React.createElement("div", props, children); }`);
  const recovery = pathToFileURL(join(appRoot, "src/components/provider/deploy/stage-b-recovery.ts")).href;
  let { outputText } = typescript.transpileModule(await readFile(actionPath, "utf8"), {
    fileName: actionPath,
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.ESNext,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  for (const [from, to] of [
    ["\"react\"", JSON.stringify(reactUrl)],
    ["\"react/jsx-runtime\"", JSON.stringify(jsxRuntimeUrl)],
    ["\"wagmi\"", JSON.stringify(wagmi)],
    ["\"../../../lib/ats/stage-b-browser-provider-bridge.ts\"", JSON.stringify(bridge)],
    ["\"../../ui/button\"", JSON.stringify(button)],
    ["\"../../ui/status\"", JSON.stringify(status)],
    ["\"../../wallet/use-tool402-wallet\"", JSON.stringify(wallet)],
    ["\"./stage-b-recovery\"", JSON.stringify(recovery)],
  ]) outputText = outputText.split(from).join(to);
  return { component: await import(actionDataModule(outputText)), recovery: await import(recovery) };
}

function installActionDom(locks) {
  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div></body></html>", { url: "http://localhost:3000" });
  const properties = ["window", "document", "navigator", "HTMLElement", "Event", "CustomEvent", "IS_REACT_ACT_ENVIRONMENT"];
  const previous = new Map(properties.map((property) => [property, Object.getOwnPropertyDescriptor(globalThis, property)]));
  Object.defineProperty(dom.window.navigator, "locks", { configurable: true, value: locks });
  for (const [property, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) Object.defineProperty(globalThis, property, { configurable: true, writable: true, value });
  return () => {
    for (const property of properties) {
      const descriptor = previous.get(property);
      if (descriptor === undefined) delete globalThis[property];
      else Object.defineProperty(globalThis, property, descriptor);
    }
    dom.window.close();
  };
}

function mountedWallet(address, chainId = 296, generation = 1) {
  return {
    resolved: true,
    connection: { status: "connected", account: address, chainId, connector: { id: "metaMask" }, generation },
  };
}

async function flushMountedAction() {
  await act(async () => {
    for (let index = 0; index < 12; index += 1) await Promise.resolve();
  });
}

test("wires the Stage-B action through its isolated local bridge instead of a disabled artifact-only placeholder", async () => {
  const [action, stages, signing] = await sources();

  assert.match(action, /stage-b-browser-provider-bridge/u);
  assert.match(action, /\buseRef\b/u, "one controller must survive render cycles");
  assert.match(action, /\bonClick\b/u, "execution remains an explicit click only");
  assert.match(action, /\bonCandidate\b/u, "the action returns a candidate through a callback only");
  assert.doesNotMatch(action, /Create revenue note — unavailable/u);
  assert.match(stages, /<AtsCreateAction\b[^>]*\bonCandidate=/u);
  assert.match(signing, /\bsetCandidate\b/u, "candidate ownership is browser-session React state");
});

test("keeps Stage-B UI interaction manual and free of automatic attach or signing", async () => {
  const [action, stages, signing] = await sources();
  const combined = `${action}\n${stages}\n${signing}`;

  assert.doesNotMatch(combined, /(?:sessionStorage|indexedDB|document\.cookie|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|setInterval|setTimeout|requestAnimationFrame|process\.env|import\.meta\.env)/u);
  assert.doesNotMatch(action, /(?:external\.attachCandidate|eth_signTypedData_v4|eth_sendTransaction)/u);
  assert.match(action, /<StatusRegion\b[^>]*>\{feedback \?\?/u, "safe feedback must land in a live region that exists before the first click");
  assert.doesNotMatch(action, /\{feedback \? <p/u);
});

test("does not recreate a page-session controller after a returned hash when the provider changes", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const checksummedIssuer = "0xC89f87052c3e080B4A9b021d4930055031EF378E";
  const transactionHash = `0x${"1".repeat(64)}`;
  const calls = [];
  function provider(name) {
    return {
      async request({ method }) {
        calls.push({ name, method });
        if (method === "eth_chainId") return "0x128";
        if (method === "eth_accounts") return [checksummedIssuer];
        if (method === "eth_sendTransaction") return transactionHash;
        if (method === "eth_getTransactionReceipt") return {};
        assert.fail(`unexpected provider request: ${method}`);
      },
    };
  }
  const firstProvider = provider("first");
  const replacementProvider = provider("replacement");
  const harness = await actionHarness();
  const common = {
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("a missing receipt cannot yield a candidate"); },
  };

  const firstTree = harness.render({ ...common, session: { provider: firstProvider, address: issuer } });
  const firstButton = elements(firstTree).find((element) => element.type === "Button");
  assert.equal(firstButton?.props.disabled, false);
  await firstButton.props.onClick();
  assert.equal(calls.filter((call) => call.name === "first" && call.method === "eth_sendTransaction").length, 1);

  const terminalTree = harness.render({ ...common, session: { provider: firstProvider, address: issuer } });
  const terminalButton = elements(terminalTree).find((element) => element.type === "Button");
  assert.equal(terminalButton?.props.disabled, true, "the visible action reflects its controller's post-hash terminal latch");

  const afterHash = harness.render({ ...common, session: { provider: replacementProvider, address: issuer } });
  const replacementButton = elements(afterHash).find((element) => element.type === "Button");
  assert.equal(replacementButton?.props.disabled, true, "a provider/session replacement cannot reset the post-hash latch");
  await replacementButton.props.onClick();
  assert.equal(calls.filter((call) => call.name === "first" && call.method === "eth_sendTransaction").length, 1);
  assert.equal(calls.filter((call) => call.name === "replacement" && call.method === "eth_sendTransaction").length, 0);
});

test("offers an explicit public-hash recovery control before any new transaction", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const calls = [];
  const provider = {
    async request({ method }) {
      calls.push(method);
      assert.fail(`recovery must not request the provider during render: ${method}`);
    },
  };
  const harness = await actionHarness();

  const tree = harness.render({
    session: { provider, address: issuer },
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("rendering recovery must not create a candidate"); },
  });

  const recoveryInput = elements(tree).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  const recoveryButton = elements(tree).find((element) =>
    element.type === "Button" && element.props.children === "Recover candidate from transaction hash",
  );

  assert.ok(recoveryInput, "a reload must offer an explicit public-hash recovery input");
  assert.ok(recoveryButton, "recovery must be an explicit click, not a mount effect");
  assert.deepEqual(calls, []);
});
test("requires the supplied recovery hash to be canonical before enabling its explicit action", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"1".repeat(64)}`;
  const provider = {
    async request({ method }) {
      assert.fail(`invalid recovery input must not request the provider: ${method}`);
    },
  };
  const harness = await actionHarness();
  const props = {
    session: { provider, address: issuer },
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an invalid recovery hash cannot create a candidate"); },
  };

  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(input);
  input.props.onChange({ target: { value: ` ${transactionHash}` } });

  const invalid = harness.render(props);
  const recoveryButton = elements(invalid).find((element) =>
    element.type === "Button" && element.props.children === "Recover candidate from transaction hash",
  );
  assert.equal(recoveryButton?.props.disabled, true, "surrounding whitespace is not canonical input");
});

test("prefills recovery with the MetaMask hash when verification remains unknown", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"1".repeat(64)}`;
  const provider = {
    async request({ method }) {
      if (method === "eth_chainId") return "0x128";
      if (method === "eth_accounts") return [issuer];
      if (method === "eth_sendTransaction") return transactionHash;
      if (method === "eth_getTransactionReceipt") return null;
      assert.fail(`unexpected provider request: ${method}`);
    },
  };
  const harness = await actionHarness();
  const props = {
    session: { provider, address: issuer },
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an unverified transaction must not attach a candidate"); },
  };

  const initialTree = harness.render(props);
  const createButton = elements(initialTree).find((element) =>
    element.type === "Button" && element.props.children === "Create the note in MetaMask",
  );
  assert.ok(createButton);
  await createButton.props.onClick();

  const afterUnknown = harness.render(props);
  const recoveryInput = elements(afterUnknown).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.equal(recoveryInput?.props.value, transactionHash);
});

test("blocks a second MetaMask send after remounting a persisted unknown transaction", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"9".repeat(64)}`;
  const calls = [];
  const provider = {
    async request({ method }) {
      calls.push(method);
      if (method === "eth_sendTransaction") return transactionHash;
      if (method === "eth_getTransactionReceipt") return {};
      assert.fail(`unexpected provider request: ${method}`);
    },
  };
  const persisted = new Map();
  const props = {
    session: { provider, address: issuer },
    preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("unknown evidence cannot attach a candidate"); },
  };
  const first = await actionHarness(persisted);
  const create = elements(first.render(props)).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(create?.props.disabled, false);
  await create.props.onClick();
  assert.equal(calls.filter((method) => method === "eth_sendTransaction").length, 1);

  const remounted = await actionHarness(persisted);
  const restoredTree = remounted.render(props);
  const restoredInput = elements(restoredTree).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(restoredInput);
  restoredInput.props.onChange({ target: { value: "" } });
  const restored = elements(remounted.render(props)).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(restored?.props.disabled, true);
  await restored.props.onClick();
  assert.equal(calls.filter((method) => method === "eth_sendTransaction").length, 1);
});

test("retains an uncorroborated recovery hash for an explicit retry without sending another transaction", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"2".repeat(64)}`;
  const providerCalls = [];
  const provider = {
    async request({ method }) {
      providerCalls.push(method);
      assert.fail(`recovery must not request a wallet operation: ${method}`);
    },
  };
  const harness = await actionHarness();
  const props = {
    session: { provider, address: issuer },
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an uncorroborated hash must not attach a candidate"); },
  };

  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(input);
  input.props.onChange({ target: { value: transactionHash } });

  const first = harness.render(props);
  const firstRecovery = elements(first).find((element) =>
    element.type === "Button" && element.props.children === "Recover candidate from transaction hash",
  );
  assert.equal(firstRecovery?.props.disabled, false);
  await firstRecovery.props.onClick();

  const afterFirst = harness.render(props);
  const retryInput = elements(afterFirst).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  const retry = elements(afterFirst).find((element) =>
    element.type === "Button" && element.props.children === "Recover candidate from transaction hash",
  );
  assert.equal(retryInput?.props.value, transactionHash);
  assert.equal(retry?.props.disabled, false);
  await retry.props.onClick();

  assert.equal(harness.fetchCalls().length, 2);
  assert.deepEqual(providerCalls.filter((method) => method === "eth_sendTransaction"), []);
});

test("persists a manually corroborated recovery before exposing its candidate", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"8".repeat(64)}`;
  const persisted = new Map();
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { return { kind: "submission_unknown" }; },
      async recover(hash) {
        assert.equal(hash, transactionHash);
        return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } };
      },
    }),
  };
  const props = {
    session: { provider: { async request() { assert.fail("manual recovery must not request MetaMask"); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
  };
  const candidates = [];
  const first = await actionHarness(persisted, bridge);
  const initial = first.render({ ...props, onCandidate: (candidate) => candidates.push(candidate) });
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(input);
  input.props.onChange({ target: { value: transactionHash } });
  const armed = first.render({ ...props, onCandidate: (candidate) => candidates.push(candidate) });
  const recover = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  assert.equal(recover?.props.disabled, false);
  await recover.props.onClick();

  assert.equal(candidates.length, 1);
  const remounted = await actionHarness(persisted, bridge);
  const restored = remounted.render({ ...props, onCandidate() { assert.fail("remount must not attach automatically"); } });
  const restoredCreate = elements(restored).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  const restoredInput = elements(restored).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.equal(restoredCreate?.props.disabled, true);
  assert.equal(restoredInput?.props.value, transactionHash);
});

test("retains a corroborated recovery under its original scope without handing it to a replaced controller", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"b".repeat(64)}`;
  const persisted = new Map();
  const delayedLock = lockDelayedOnRequest(2);
  const candidates = [];
  const provider = { async request({ method }) { assert.fail(`recovery must not request MetaMask: ${method}`); } };
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { assert.fail("manual recovery cannot create a transaction"); },
      async recover() { return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } }; },
    }),
  };
  const base = {
    session: { provider, address: issuer },
    selectedTool: false,
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate: (candidate) => candidates.push(candidate),
  };
  const contextA = { ...base, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
  const contextB = { ...base, selectedToolPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" };
  const harness = await actionHarness(persisted, bridge, delayedLock.locks);
  const initial = harness.render(contextA);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(input);
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(contextA);
  const recoveryButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  const recoveryPromise = recoveryButton.props.onClick();
  await delayedLock.delayedRequest;

  const switched = harness.render(contextB);
  const createForB = elements(switched).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(createForB?.props.disabled, false, "context B is not terminal before A's lock is released");
  delayedLock.release();
  await recoveryPromise;

  const afterRelease = harness.render(contextB);
  const createAfterRelease = elements(afterRelease).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  const scopeA = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: contextA.selectedToolPublicId, preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scopeA);
  assert.equal(candidates.length, 0, "an obsolete recovery cannot hand off a candidate");
  assert.equal(createAfterRelease?.props.disabled, false, "A's terminal result cannot relabel B");
  assert.equal(recovery.readStageBRecovery(scopeA), transactionHash, "A's corroborated hash remains recoverable");
});

test("mounts the recovery handoff and keeps an obsolete persisted result out of context B", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"b".repeat(64)}`;
  const delayedLock = lockDelayedOnRequest(2);
  const restoreDom = installActionDom(delayedLock.locks);
  const candidates = [];
  let root;
  try {
    const { createRoot } = await import("react-dom/client");
    globalThis.__atsMountedWallet = mountedWallet(issuer);
    globalThis.__atsMountedExecuteCalls = 0;
    globalThis.__atsMountedRecoverCalls = 0;
    const { component, recovery } = await loadMountedAction();
    root = createRoot(document.getElementById("root"));
    const common = {
      preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
      selectedTool: false,
      stageTwoDone: true,
      hasCandidate: false,
      onCandidate: (candidate) => candidates.push(candidate),
    };
    const render = async (selectedToolPublicId) => {
      await act(async () => {
        root.render(React.createElement(component.AtsCreateAction, { ...common, selectedToolPublicId }));
      });
      await flushMountedAction();
    };
    await render("tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const input = document.querySelector("[data-stage-b-recovery-hash=true]");
    assert.ok(input);
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, transactionHash);
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    await flushMountedAction();
    const recoverButton = [...document.querySelectorAll("button")].find((button) => button.textContent === "Recover candidate from transaction hash");
    assert.equal(recoverButton?.disabled, false);
    await act(async () => { recoverButton.click(); });
    await delayedLock.delayedRequest;

    await render("tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    const createForB = [...document.querySelectorAll("button")].find((button) => button.textContent === "Create the note in MetaMask");
    assert.equal(createForB?.disabled, false);
    delayedLock.release();
    await flushMountedAction();

    const scopeA = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: common.preparedAttemptPublicId });
    assert.ok(scopeA);
    assert.equal(candidates.length, 0);
    assert.equal(globalThis.__atsMountedRecoverCalls, 1);
    assert.equal(globalThis.__atsMountedExecuteCalls, 0);
    assert.equal(recovery.readStageBRecovery(scopeA), transactionHash);
    assert.equal(createForB?.disabled, false);
  } finally {
    if (root !== undefined) await act(async () => { root.unmount(); });
    delete globalThis.__atsMountedWallet;
    delete globalThis.__atsMountedExecuteCalls;
    delete globalThis.__atsMountedRecoverCalls;
    restoreDom();
  }
});

test("suppresses the mounted recovery handoff after unmount while persistence waits", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"d".repeat(64)}`;
  const delayedLock = lockDelayedOnRequest(2);
  const restoreDom = installActionDom(delayedLock.locks);
  const candidates = [];
  let root;
  try {
    const { createRoot } = await import("react-dom/client");
    globalThis.__atsMountedWallet = mountedWallet(issuer);
    globalThis.__atsMountedExecuteCalls = 0;
    globalThis.__atsMountedRecoverCalls = 0;
    const { component, recovery } = await loadMountedAction();
    root = createRoot(document.getElementById("root"));
    const props = {
      preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg",
      selectedTool: false,
      selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      stageTwoDone: true,
      hasCandidate: false,
      onCandidate: (candidate) => candidates.push(candidate),
    };
    await act(async () => { root.render(React.createElement(component.AtsCreateAction, props)); });
    await flushMountedAction();
    const input = document.querySelector("[data-stage-b-recovery-hash=true]");
    assert.ok(input);
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, transactionHash);
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    await flushMountedAction();
    const recoverButton = [...document.querySelectorAll("button")].find((button) => button.textContent === "Recover candidate from transaction hash");
    await act(async () => { recoverButton.click(); });
    await delayedLock.delayedRequest;
    await act(async () => { root.unmount(); });
    root = undefined;
    delayedLock.release();
    for (let index = 0; index < 12; index += 1) await Promise.resolve();

    const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: props.selectedToolPublicId, preparedAttemptPublicId: props.preparedAttemptPublicId });
    assert.ok(scope);
    assert.equal(candidates.length, 0);
    assert.equal(globalThis.__atsMountedExecuteCalls, 0);
    assert.equal(recovery.readStageBRecovery(scope), transactionHash);
  } finally {
    if (root !== undefined) await act(async () => { root.unmount(); });
    delete globalThis.__atsMountedWallet;
    delete globalThis.__atsMountedExecuteCalls;
    delete globalThis.__atsMountedRecoverCalls;
    restoreDom();
  }
});

test("suppresses recovery handoff after independent account and network changes during persistence", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const nextAccount = "0x52908400098527886e0f7030069857d2e4169ee7";
  const transactionHash = `0x${"c".repeat(64)}`;
  const provider = { async request({ method }) { assert.fail(`recovery must not request MetaMask: ${method}`); } };
  const sessionA = { provider, address: issuer };
  const bridge = {
    isCanonicalStageBTransactionHash: () => true,
    createStageBBrowserProviderBridge: () => ({
      async execute() { assert.fail("manual recovery cannot create a transaction"); },
      async recover() { return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: nextAccount } }; },
    }),
  };
  for (const sessionB of [
    { provider, address: nextAccount },
    { provider, address: issuer, chainId: 295 },
  ]) {
    const persisted = new Map();
    const delayedLock = lockDelayedOnRequest(2);
    const candidates = [];
    const props = {
      selectedTool: false,
      selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      stageTwoDone: true,
      hasCandidate: false,
      onCandidate: (candidate) => candidates.push(candidate),
    };
    const harness = await actionHarness(persisted, bridge, delayedLock.locks);
    const initial = harness.render({ ...props, session: sessionA });
    const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
    input.props.onChange({ target: { value: transactionHash } });
    const armed = harness.render({ ...props, session: sessionA });
    const recoveryButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
    const recoveryPromise = recoveryButton.props.onClick();
    await delayedLock.delayedRequest;

    harness.render({ ...props, session: sessionB });
    delayedLock.release();
    await recoveryPromise;

    const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
    const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: props.selectedToolPublicId, preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
    assert.ok(scope);
    assert.equal(candidates.length, 0);
    assert.equal(recovery.readStageBRecovery(scope), transactionHash);
  }
});

test("hands an unchanged recovery candidate off exactly once after persistence", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"e".repeat(64)}`;
  const delayedLock = lockDelayedOnRequest(2);
  const candidates = [];
  const bridge = {
    isCanonicalStageBTransactionHash: () => true,
    createStageBBrowserProviderBridge: () => ({
      async execute() { assert.fail("manual recovery cannot create a transaction"); },
      async recover() { return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } }; },
    }),
  };
  const props = {
    session: { provider: { async request({ method }) { assert.fail(`recovery must not request MetaMask: ${method}`); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate: (candidate) => candidates.push(candidate),
  };
  const harness = await actionHarness(new Map(), bridge, delayedLock.locks);
  const input = elements(harness.render(props)).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(props);
  const recoveryButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  const recoveryPromise = recoveryButton.props.onClick();
  await delayedLock.delayedRequest;
  delayedLock.release();
  await recoveryPromise;

  assert.equal(candidates.length, 1);
});

test("releases an obsolete initial creation claim before it invokes a controller or MetaMask", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const persisted = new Map();
  const delayedLock = lockDelayedOnRequest(1);
  let executeCalls = 0;
  const provider = { async request({ method }) { assert.fail(`obsolete creation must not request MetaMask: ${method}`); } };
  const bridge = {
    isCanonicalStageBTransactionHash: () => true,
    createStageBBrowserProviderBridge: () => ({
      async execute() { executeCalls += 1; assert.fail("an obsolete initial claim cannot invoke its controller"); },
      async recover() { assert.fail("creation cannot call recovery"); },
    }),
  };
  const base = {
    session: { provider, address: issuer },
    selectedTool: false,
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an obsolete creation cannot attach a candidate"); },
  };
  const contextA = { ...base, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
  const contextB = { ...base, selectedToolPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" };
  const harness = await actionHarness(persisted, bridge, delayedLock.locks);
  const create = elements(harness.render(contextA)).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(create?.props.disabled, false);
  const creationPromise = create.props.onClick();
  await delayedLock.delayedRequest;
  harness.render(contextB);
  delayedLock.release();
  await creationPromise;

  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  const scopeA = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: contextA.selectedToolPublicId, preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scopeA);
  assert.equal(executeCalls, 0);
  assert.equal(recovery.stageBRecoveryStatus(scopeA), "clear");
});

test("releases an obsolete initial recovery claim before it can use its old controller", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"f".repeat(64)}`;
  const persisted = new Map();
  const delayedLock = lockDelayedOnRequest(1);
  let recoverCalls = 0;
  const provider = { async request({ method }) { assert.fail(`recovery must not request MetaMask: ${method}`); } };
  const bridge = {
    isCanonicalStageBTransactionHash: () => true,
    createStageBBrowserProviderBridge: () => ({
      async execute() { assert.fail("manual recovery cannot create a transaction"); },
      async recover() { recoverCalls += 1; assert.fail("an obsolete initial claim cannot invoke recovery"); },
    }),
  };
  const base = {
    session: { provider, address: issuer },
    selectedTool: false,
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an obsolete recovery cannot attach a candidate"); },
  };
  const contextA = { ...base, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
  const contextB = { ...base, selectedToolPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" };
  const harness = await actionHarness(persisted, bridge, delayedLock.locks);
  const input = elements(harness.render(contextA)).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(contextA);
  const recoveryButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  const recoveryPromise = recoveryButton.props.onClick();
  await delayedLock.delayedRequest;
  harness.render(contextB);
  delayedLock.release();
  await recoveryPromise;

  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  const scopeA = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: contextA.selectedToolPublicId, preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scopeA);
  assert.equal(recoverCalls, 0);
  assert.equal(recovery.readStageBRecovery(scopeA), null, "the unused reservation is released without clearing unrelated evidence");
  assert.equal(recovery.stageBRecoveryStatus(scopeA), "clear");
});

test("retains corroborated recovery evidence when the downstream candidate handoff fails", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"9".repeat(64)}`;
  const persisted = new Map();
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { return { kind: "submission_unknown" }; },
      async recover() { return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } }; },
    }),
  };
  const props = {
    session: { provider: { async request() { assert.fail("manual recovery must not request MetaMask"); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { throw new Error("the later attachment handoff failed"); },
  };
  const harness = await actionHarness(persisted, bridge);
  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(props);
  const recover = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  await recover.props.onClick();

  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: props.selectedToolPublicId, preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scope);
  assert.equal(recovery.readStageBRecovery(scope), transactionHash);
});

test("reconciles a hashless ambiguous ATS reservation through public verification without enabling another send", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"4".repeat(64)}`;
  const persisted = new Map();
  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  globalThis.window = { localStorage: {
    getItem(key) { return persisted.get(key) ?? null; },
    setItem(key, value) { persisted.set(key, value); },
    removeItem(key) { persisted.delete(key); },
  } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request(_name, _options, callback) { return callback(); } } } });
  const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scope);
  assert.equal((await recovery.beginStageBRecovery(scope)).kind, "claimed");
  let recoverCalls = 0;
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { assert.fail("hashless recovery must not send a new transaction"); },
      async recover(hash) {
        recoverCalls += 1;
        assert.equal(hash, transactionHash);
        return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } };
      },
    }),
  };
  const props = {
    session: { provider: { async request() { assert.fail("hashless recovery must not request MetaMask"); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() {},
  };
  const harness = await actionHarness(persisted, bridge);
  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(props);
  const recoverButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  await recoverButton.props.onClick();

  assert.equal(recoverCalls, 1);
  assert.equal(recovery.readStageBRecovery(scope), transactionHash);
  const remounted = await actionHarness(persisted, bridge);
  const restored = remounted.render(props);
  const create = elements(restored).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(create?.props.disabled, true);
});

test("reconciles a hashless v1 ATS record through public verification without enabling a new send after remount", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"a".repeat(64)}`;
  const persisted = new Map();
  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scope);
  const recoveryKey = `tool402:ats-create-recovery:v1:${scope.address}:296:${scope.toolPublicId}:${scope.preparedAttemptPublicId}`;
  persisted.set(recoveryKey, JSON.stringify({ version: 1, scope }));
  let createCalls = 0;
  let recoverCalls = 0;
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { createCalls += 1; assert.fail("legacy recovery must not send a new transaction"); },
      async recover(hash) {
        recoverCalls += 1;
        assert.equal(hash, transactionHash);
        return { kind: "candidate", candidate: { transactionId: "0.0.9213391-1789430400-000000001", evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7" } };
      },
    }),
  };
  const candidates = [];
  const props = {
    session: { provider: { async request() { assert.fail("legacy recovery must not request MetaMask"); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate: (candidate) => candidates.push(candidate),
  };
  const harness = await actionHarness(persisted, bridge);
  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(input);
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(props);
  const recoverButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  await recoverButton.props.onClick();

  assert.equal(recoverCalls, 1);
  assert.equal(createCalls, 0);
  assert.equal(candidates.length, 1);
  assert.equal(recovery.readStageBRecovery(scope), transactionHash);
  const remounted = await actionHarness(persisted, bridge);
  const restored = remounted.render({ ...props, onCandidate() { assert.fail("remount must not reattach automatically"); } });
  const create = elements(restored).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(create?.props.disabled, true);
});

test("keeps a hashless ambiguous ATS reservation when public verification is unavailable", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"5".repeat(64)}`;
  const persisted = new Map();
  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  globalThis.window = { localStorage: {
    getItem(key) { return persisted.get(key) ?? null; },
    setItem(key, value) { persisted.set(key, value); },
    removeItem(key) { persisted.delete(key); },
  } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request(_name, _options, callback) { return callback(); } } } });
  const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scope);
  assert.equal((await recovery.beginStageBRecovery(scope)).kind, "claimed");
  let recoverCalls = 0;
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { assert.fail("unverified recovery must not send a new transaction"); },
      async recover() { recoverCalls += 1; return { kind: "submission_unknown" }; },
    }),
  };
  const props = {
    session: { provider: { async request() { assert.fail("unverified recovery must not request MetaMask"); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("unverified recovery cannot attach"); },
  };
  const harness = await actionHarness(persisted, bridge);
  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(props);
  const recoverButton = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  await recoverButton.props.onClick();

  assert.equal(recoverCalls, 1);
  assert.equal(recovery.readStageBRecovery(scope), null);
  assert.equal(recovery.stageBRecoveryStatus(scope), "existing");
  const remounted = await actionHarness(persisted, bridge);
  const restored = remounted.render(props);
  const create = elements(restored).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(create?.props.disabled, true);
});

test("keeps a conflicting persisted ATS recovery instead of accepting typed replacement evidence", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const originalHash = `0x${"6".repeat(64)}`;
  const replacementHash = `0x${"7".repeat(64)}`;
  const persisted = new Map();
  const recovery = await import("../src/components/provider/deploy/stage-b-recovery.ts");
  globalThis.window = { localStorage: {
    getItem(key) { return persisted.get(key) ?? null; },
    setItem(key, value) { persisted.set(key, value); },
    removeItem(key) { persisted.delete(key); },
  } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request(_name, _options, callback) { return callback(); } } } });
  const scope = recovery.createStageBRecoveryScope({ address: issuer, selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", preparedAttemptPublicId: "CCCCCCCCCCCCCCCCCCCCCg" });
  assert.ok(scope);
  const claim = await recovery.beginStageBRecovery(scope);
  assert.equal(claim.kind, "claimed");
  if (claim.kind === "claimed") assert.equal(await recovery.persistStageBRecovery(scope, claim.claimId, originalHash), true);
  const bridge = {
    isCanonicalStageBTransactionHash: (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/u.test(value),
    createStageBBrowserProviderBridge: () => ({
      async execute() { return { kind: "submission_unknown" }; },
      async recover() { assert.fail("a conflicting retained hash must not be replaced"); },
    }),
  };
  const harness = await actionHarness(persisted, bridge);
  const props = {
    session: { provider: { async request() { assert.fail("recovery conflict must not reach MetaMask"); } }, address: issuer },
    selectedTool: false,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("a conflicting recovery cannot attach a candidate"); },
  };
  const tree = harness.render(props);
  const input = elements(tree).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.equal(input?.props.value, originalHash);
  input.props.onChange({ target: { value: replacementHash } });
  const changed = harness.render(props);
  const recoverButton = elements(changed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  assert.equal(recoverButton?.props.disabled, false);
  await recoverButton.props.onClick();
  assert.equal(recovery.readStageBRecovery(scope), originalHash);
});

test("mutually excludes create and recovery while the create read is in flight", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"3".repeat(64)}`;
  let settleChain;
  const chainRead = new Promise((resolve) => { settleChain = resolve; });
  const providerCalls = [];
  const provider = {
    async request({ method }) {
      providerCalls.push(method);
      if (method === "eth_sendTransaction") return chainRead;
      if (method === "eth_getTransactionReceipt") return null;
      assert.fail(`the in-flight create must not reach ${method}`);
    },
  };
  const harness = await actionHarness();
  const props = {
    session: { provider, address: issuer },
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an unresolved create cannot attach a candidate"); },
  };

  const initial = harness.render(props);
  const input = elements(initial).find((element) => element.props["data-stage-b-recovery-hash"] === "true");
  assert.ok(input);
  input.props.onChange({ target: { value: transactionHash } });
  const armed = harness.render(props);
  const create = elements(armed).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  const recover = elements(armed).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  assert.equal(create?.props.disabled, false);
  assert.equal(recover?.props.disabled, false);

  const creating = create.props.onClick();
  const pending = harness.render(props);
  const pendingCreate = elements(pending).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  const pendingRecover = elements(pending).find((element) => element.type === "Button" && element.props.children === "Recover candidate from transaction hash");
  assert.equal(pendingCreate?.props.disabled, true);
  assert.equal(pendingRecover?.props.disabled, true);
  await pendingRecover.props.onClick();
  assert.deepEqual(harness.fetchCalls(), []);

  settleChain(transactionHash);
  await creating;
  assert.equal(providerCalls.filter((method) => method === "eth_sendTransaction").length, 1);
});

test("does not clear submitted-state protection when an equivalent configuration object is recreated", async () => {
  const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
  const transactionHash = `0x${"4".repeat(64)}`;
  const { createStageBAtsCreateExecutionProjection } = await import("../src/lib/ats/stage-b-ats-create-execution-projection.ts");
  const configuration = createStageBAtsCreateExecutionProjection().configuration;
  const provider = {
    async request({ method }) {
      if (method === "eth_chainId") return "0x128";
      if (method === "eth_accounts") return [issuer];
      if (method === "eth_sendTransaction") return transactionHash;
      if (method === "eth_getTransactionReceipt") return null;
      assert.fail(`unexpected provider request: ${method}`);
    },
  };
  const harness = await actionHarness();
  const initialProps = {
    session: { provider, address: issuer },
    selectedTool: true,
    selectedToolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    configuration,
    stageTwoDone: true,
    hasCandidate: false,
    onCandidate() { assert.fail("an unverified transaction must not attach a candidate"); },
  };
  const initial = harness.render(initialProps);
  const create = elements(initial).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.ok(create);
  await create.props.onClick();

  const replacement = harness.render({ ...initialProps, configuration: structuredClone(configuration) });
  const replacementCreate = elements(replacement).find((element) => element.type === "Button" && element.props.children === "Create the note in MetaMask");
  assert.equal(replacementCreate?.props.disabled, true);
});
