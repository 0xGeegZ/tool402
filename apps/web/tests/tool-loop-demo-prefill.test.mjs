import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadToolLoopState() {
  return import("../src/components/riskscan/tool-loop/riskscan-tool-loop-state.ts");
}

test("selects one closed, editable ToolLoop demo fixture without a pre-submit request", async () => {
  const { getToolLoopDemoDefaults } = await loadToolLoopState();

  assert.equal(typeof getToolLoopDemoDefaults, "function");

  const blank = getToolLoopDemoDefaults(null);
  const unsupported = getToolLoopDemoDefaults("unknown");
  const selected = getToolLoopDemoDefaults("tool-loop");
  const secondSelected = getToolLoopDemoDefaults("tool-loop");

  assert.deepEqual(blank, {
    requestRef: "",
    subjectRef: "",
    context: "",
    declarations: { identity: false, pricing: false, limitations: false, evidence: false },
  });
  assert.deepEqual(unsupported, blank);
  assert.notStrictEqual(blank, unsupported);
  assert.notStrictEqual(blank.declarations, unsupported.declarations);
  assert.deepEqual(selected, {
    requestRef: "demo-riskscan-quick-001",
    subjectRef: "riskscan-demo-subject",
    context: "Review the demo RiskScan Quick request before continuing the ToolLoop demo.",
    declarations: { identity: true, pricing: true, limitations: true, evidence: true },
  });
  assert.notStrictEqual(selected, secondSelected);
  assert.notStrictEqual(selected.declarations, secondSelected.declarations);
  for (const value of [blank, unsupported, selected, secondSelected]) {
    assert.equal(Object.isFrozen(value), true);
    assert.equal(Object.isFrozen(value.declarations), true);
  }

  const [layout, flow, guidedSteps, manifest] = await Promise.all([
    readAppFile("src/app/layout.tsx"),
    readAppFile("src/components/riskscan/tool-loop/riskscan-tool-loop.tsx"),
    readAppFile("src/components/demo/guided-demo-steps.tsx"),
    readAppFile("package.json").then(JSON.parse),
  ]);

  assert.equal(manifest.dependencies.nuqs, "2.10.1");
  assert.match(layout, /import\s*\{\s*NuqsAdapter\s*\}\s+from\s+["']nuqs\/adapters\/next\/app["']/);
  assert.match(layout, /<NuqsAdapter>\s*\{children\}\s*<\/NuqsAdapter>/);
  const queryKeys = [...flow.matchAll(/\buseQueryState\s*\(\s*["']([^"']+)["']/g)].map(([, key]) => key);
  assert.deepEqual(queryKeys, ["demo"]);
  assert.match(
    flow,
    /parseAsStringLiteral\(\s*\[\s*["']tool-loop["']\s*\]\s+as\s+const\s*\)/,
  );
  assert.match(flow, /name=["']requestRef["'][^>]*defaultValue=\{defaults\.requestRef\}/);
  assert.match(flow, /name=["']subjectRef["'][^>]*defaultValue=\{defaults\.subjectRef\}/);
  assert.match(flow, /name=["']context["'][^>]*defaultValue=\{defaults\.context\}/);
  for (const declaration of ["identity", "pricing", "limitations", "evidence"]) {
    assert.match(
      flow,
      new RegExp(`name=["']${declaration}["'][^>]*defaultChecked=\\{defaults\\.declarations\\.${declaration}\\}`),
    );
  }
  assert.match(
    flow,
    /\{demoMode\s*===\s*["']tool-loop["']\s*\?\s*<[^>]*aria-live=["']polite["'][^>]*>[\s\S]{0,240}?Demo values loaded\. Review before checking\.[\s\S]{0,240}?<\/[^>]+>\s*:\s*null\}/,
  );
  assert.match(guidedSteps, /recordingSteps/);
  assert.match(guidedSteps, /recordingTourHref\(step\.href, step\.id\)/);
  assert.doesNotMatch(flow, /\b(?:useQueryStates|useSearchParams|URLSearchParams|location\.search|router\.query)\b/);
  assert.doesNotMatch(flow, /\bsetDemoMode\b|\bfetch\b/);
});
