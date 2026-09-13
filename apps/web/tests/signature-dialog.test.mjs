import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const dialogUrl = new URL("../src/components/wallet/signature-dialog.tsx", import.meta.url);
const account = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

async function loadHarness() {
  const slots = [];
  let cursor = 0;
  let signCalls = 0;
  let relayCalls = 0;
  let releaseRelay;
  let relayStarted;
  const relayCompletion = new Promise((resolve) => {
    releaseRelay = resolve;
  });
  const relayStart = new Promise((resolve) => {
    relayStarted = resolve;
  });
  const { outputText } = typescript.transpileModule(await readFile(dialogUrl, "utf8"), {
    fileName: fileURLToPath(dialogUrl),
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    module,
    Object,
    Date,
    document: { activeElement: null },
    require(specifier) {
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
            return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
          },
        },
        "react/jsx-runtime": jsxRuntime,
        wagmi: { useSignTypedData: () => ({ mutateAsync: async () => {
          signCalls += 1;
          return `0x${"11".repeat(65)}`;
        } }) },
        "../../lib/wallet/command-relay.ts": {
          signAndRelayCommand: async (_context, _request, dependencies) => {
            relayCalls += 1;
            relayStarted();
            await dependencies.signTypedData({ message: {} });
            await relayCompletion;
            return { kind: "relayed", outcome: "ACCEPTED" };
          },
        },
        "./use-tool402-wallet": { useTool402Wallet: () => ({
          resolved: true,
          connection: { generation: 0, status: "connected", account, chainId: 296, connector: { id: "metaMask" } },
        }) },
        "../ui/button": { Button: "Button" },
        "../ui/card": {
          Card: "Card",
          CardContent: "CardContent",
          CardDescription: "CardDescription",
          CardFooter: "CardFooter",
          CardHeader: "CardHeader",
          CardTitle: "CardTitle",
        },
      };
      assert.ok(Object.hasOwn(imports, specifier), `unexpected signature dialog import: ${specifier}`);
      return imports[specifier];
    },
  }, { filename: fileURLToPath(dialogUrl) });
  return {
    get relayCalls() { return relayCalls; },
    get signCalls() { return signCalls; },
    async waitForRelay() { await relayStart; },
    releaseRelay,
    sign() {
      cursor = 0;
      const tree = module.exports.SignatureDialog({
        request: {
          type: "directory.publish",
          canonicalPayloadBytes: new Uint8Array([1]),
          expiresAt: "2026-09-13T12:05:00.000Z",
          title: "Publish directory entry",
          description: "A test request.",
        },
      });
      const button = elements(tree).find((element) => element.type === "Button" && element.props.children === "Sign with MetaMask");
      assert.ok(button, "the signature dialog renders its explicit action");
      return button.props.onClick;
    },
  };
}

test("accepts only one immediate signature action while a command relay is in flight", async () => {
  const harness = await loadHarness();
  const sign = harness.sign();

  const first = sign();
  const second = sign();
  await harness.waitForRelay();

  assert.equal(harness.signCalls, 1);
  assert.equal(harness.relayCalls, 1);
  harness.releaseRelay();
  await Promise.all([first, second]);
});
