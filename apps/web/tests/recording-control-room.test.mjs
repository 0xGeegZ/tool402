import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const roomUrl = new URL("../src/components/demo/recording-control-room.tsx", import.meta.url);

function evidence() {
  return JSON.stringify({
    schemaVersion: 1, kind: "tool402.agent-payment", recordingRunRef: "b03-release-001", sourceVersion: "a".repeat(40), observedAt: "2026-09-13T10:00:00.000Z",
    service: { id: "riskscan.quick", host: "tool402.vercel.app" },
    payment: { network: "hedera:testnet", asset: "0.0.0", quotedAmount: "100000", settlementRef: "0.0.1002@1720000000.000000001", payer: "0.0.1001", recipient: "0.0.1002", settlementReportedBy: "facilitator-reported" },
    result: { requestRef: "b03-release-001", digest: "a".repeat(64), receivedAndValidatedByClient: true },
  });
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  return node && typeof node === "object" && "props" in node ? [node, ...elements(node.props.children)] : [];
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node && typeof node === "object" && "props" in node ? text(node.props.children) : "";
}

async function harness(storage) {
  const source = await readFile(roomUrl, "utf8");
  const { outputText } = typescript.transpileModule(source, {
    fileName: fileURLToPath(roomUrl),
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS, jsx: typescript.JsxEmit.ReactJSX },
  });
  const states = [];
  const refs = [];
  const effects = [];
  const listeners = new Map();
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (effects[index] === undefined) effects[index] = { dependencies, effect, pending: true };
    },
  };
  const component = { exports: {} };
  const window = {
    localStorage: storage,
    addEventListener(event, listener) { listeners.set(event, listener); },
    removeEventListener(event) { listeners.delete(event); },
  };
  const demoEvidence = await import("../src/components/demo/demo-evidence.ts");
  runInNewContext(outputText, {
    exports: component.exports,
    window,
    Blob,
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
    document: { createElement: () => ({ click() {} }) },
    require(specifier) {
      const imports = {
        react,
        "react/jsx-runtime": jsxRuntime,
        "next/link": { default: "Link" },
        "../ui/button": { Button: "Button" },
        "./demo-control-room": { recordingReadinessForEvidence: () => [], recordingSteps: [{ href: "/", id: "introduce" }], recordingTourHref: () => "/?tour=1", },
        "./demo-evidence": demoEvidence,
      };
      assert.ok(Object.hasOwn(imports, specifier), `unexpected import ${specifier}`);
      return imports[specifier];
    },
  }, { filename: fileURLToPath(roomUrl) });
  function render() {
    cursor = 0;
    const tree = component.exports.RecordingControlRoom();
    for (const effect of effects) {
      if (effect?.pending) { effect.pending = false; effect.effect(); }
    }
    return tree;
  }
  return { render, focus() { listeners.get("focus")?.(); } };
}

async function flush() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

test("keeps imported evidence and both HashScan actions during storage write and focus read failure", async () => {
  const storage = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
  const page = await harness(storage);
  let tree = page.render();
  const input = elements(tree).find((node) => node.type === "input");
  assert.notEqual(input, undefined);
  input.props.onChange({ target: { files: [{ size: evidence().length, text: async () => evidence() }], value: "" } });
  await flush();
  tree = page.render();
  assert.match(text(tree), /Evidence imported for this tab only/u);
  assert.equal(elements(tree).filter((node) => node.type === "a" && node.props.href === "https://hashscan.io/testnet/transaction/0.0.1002-1720000000-000000001").length, 2);
  page.focus();
  tree = page.render();
  assert.match(text(tree), /Saved evidence could not be read; current in-memory evidence is retained/u);
  assert.match(text(tree), /0\.0\.1002@1720000000\.000000001/u);
  const exportButton = elements(tree).find((node) => node.type === "Button" && text(node) === "Export evidence summary");
  assert.equal(exportButton.props.disabled, false);
});
