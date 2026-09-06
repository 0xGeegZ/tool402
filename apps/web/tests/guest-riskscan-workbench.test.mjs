import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("renders one static guest RiskScan route with one ordered workbench", async () => {
  const [page, workbench] = await Promise.all([
    readAppFile("src/app/dashboard/riskscan/page.tsx"),
    readAppFile("src/components/workspace/guest-riskscan-workbench.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /unconfigured guest workbench/i);
  assert.equal((page.match(/<GuestRiskScanWorkbench\s*\/>/g) ?? []).length, 1);

  const steps = [
    {
      id: "directory-step",
      label: "Inspect the local directory",
      island: "RiskScanDirectoryDiscovery",
    },
    {
      id: "compatibility-step",
      label: "Check native compatibility",
      island: "RiskScanNativeQuoteCompatibility",
    },
    {
      id: "tool-loop-step",
      label: "Follow the ToolLoop boundary",
      island: "RiskScanToolLoop",
    },
  ];
  const positions = steps.map(({ id, label, island }) => {
    assert.equal((workbench.match(new RegExp(`<${island}\\s*/>`, "g")) ?? []).length, 1);
    assert.match(
      workbench,
      new RegExp(`<section\\b[^>]*aria-labelledby=["']${id}["'][^>]*>[\\s\\S]*?<h2\\b[^>]*id=["']${id}["'][^>]*>\\s*${label}\\s*</h2>[\\s\\S]*?<${island}\\s*/>[\\s\\S]*?</section>`),
    );
    return workbench.indexOf(`<${island}`);
  });
  assert.deepEqual([...positions].sort((left, right) => left - right), positions);
});

test("keeps the new guest route and workbench server-only and authority-free", async () => {
  const sources = await Promise.all([
    readAppFile("src/app/dashboard/riskscan/page.tsx"),
    readAppFile("src/components/workspace/guest-riskscan-workbench.tsx"),
  ]);
  const source = sources.join("\n");

  assert.doesNotMatch(source, /["']use client["']/);
  assert.doesNotMatch(source, /\bfetch\b|\/api\/|\b(?:Request|RequestInit|Headers)\b|new URL\(/);
  assert.doesNotMatch(source, /process\.env|\b(?:configuration|config)\b/i);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|setTimeout|setInterval|retry|analytics)\b/);
  assert.doesNotMatch(source, /\b(?:sign|session|identity|account|wallet|provider|signer|balance|recipient|facilitator)\b/i);
  assert.doesNotMatch(source, /\b(?:payment|persistence|result|receipt|evidence|transaction|settlement|deployment|live)\b/i);
  assert.doesNotMatch(source, /https?:\/\/|mailto:|target=/i);
});
