import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = "src/components/provider/deploy/provider-deploy-stages.tsx";

async function renderStages(props) {
  const source = await readFile(join(appRoot, sourcePath), "utf8");
  const state = await import("../src/components/provider/deploy/provider-deploy-state.ts");
  const imports = {
    "react/jsx-runtime": jsxRuntime,
    "../../ui/badge": { Badge: "Badge" },
    "../../ui/button": { Button: "Button" },
    "../../ui/card": { Card: "Card", CardContent: "CardContent", CardDescription: "CardDescription", CardHeader: "CardHeader", CardTitle: "CardTitle" },
    "./ats-create-action": { AtsCreateAction: "AtsCreateAction" },
    "./provider-deploy-state": state,
  };
  const { outputText } = typescript.transpileModule(source, {
    fileName: sourcePath,
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
      assert.ok(Object.hasOwn(imports, specifier), `unexpected stages import: ${specifier}`);
      return imports[specifier];
    },
  }, { filename: sourcePath });
  return module.exports.ProviderDeployStages(props);
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

function activeStates(kind) {
  return [{ kind }, { kind: "blocked" }, { kind: "blocked" }, { kind: "blocked" }];
}

test("renders one visible handoff that invokes the existing actionable stage callback", async () => {
  const calls = [];
  const tree = await renderStages({
    states: activeStates("actionable"),
    enabledStage: 0,
    onActivate(index) { calls.push(index); },
  });
  const handoff = elements(tree).find((element) => element.props["data-ui"] === "provider-signature-handoff");
  assert.ok(handoff, "an actionable stage must surface the signature handoff");
  const button = elements(handoff).find((element) => element.type === "Button");
  assert.ok(button, "the handoff must use the existing Button surface");
  button.props.onClick();
  assert.deepEqual(calls, [0]);
});

test("does not render a handoff for an enabled non-actionable stage", async () => {
  for (const kind of ["blocked", "in_progress", "done", "unavailable"]) {
    const tree = await renderStages({ states: activeStates(kind), enabledStage: 0, onActivate() {} });
    assert.equal(elements(tree).some((element) => element.props["data-ui"] === "provider-signature-handoff"), false, `${kind} must not create a new signature entry point`);
  }
});

test("does not render a handoff without the existing activation callback", async () => {
  const tree = await renderStages({ states: activeStates("actionable"), enabledStage: 0 });
  assert.equal(elements(tree).some((element) => element.props["data-ui"] === "provider-signature-handoff"), false);
});
