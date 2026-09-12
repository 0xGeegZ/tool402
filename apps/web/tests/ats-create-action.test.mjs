import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
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

async function actionHarness() {
  const slots = [];
  let cursor = 0;
  const bridge = await import("../src/lib/ats/stage-b-browser-provider-bridge.ts");
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
    },
    "react/jsx-runtime": jsxRuntime,
    "../../../lib/ats/stage-b-browser-provider-bridge.ts": bridge,
    "../../ui/button": { Button: "Button" },
    "../../ui/status": { StatusRegion: "StatusRegion" },
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
    fetch() { throw new Error("the regression harness must never use a live fetch"); },
    Promise,
    Object,
    Error,
  }, { filename: actionPath });
  return {
    render(props) {
      cursor = 0;
      return module.exports.AtsCreateAction(props);
    },
  };
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

test("keeps Stage-B UI interaction local, manual, and free of persistence or automatic attach/signing", async () => {
  const [action, stages, signing] = await sources();
  const combined = `${action}\n${stages}\n${signing}`;

  assert.doesNotMatch(combined, /(?:localStorage|sessionStorage|indexedDB|document\.cookie|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|setInterval|setTimeout|requestAnimationFrame|process\.env|import\.meta\.env)/u);
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
