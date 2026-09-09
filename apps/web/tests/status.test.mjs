import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const statusPath = "src/components/ui/status.tsx";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

async function fileExists(path) {
  try {
    await access(join(appRoot, path));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function assertParses(path, source) {
  const sourceFile = typescript.createSourceFile(
    path,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TSX,
  );

  assert.deepEqual(sourceFile.parseDiagnostics, [], `${path} must parse`);
}

test("defines the closed, labelled Status treatment without client or runtime behavior", async () => {
  const source = await readAppFile(statusPath);

  assertParses(statusPath, source);
  assert.match(
    source,
    /export const statusTones = \["neutral", "working", "success", "warning", "error"\] as const;/,
  );
  assert.match(source, /export type StatusTone = \(typeof statusTones\)\[number\];/);
  assert.match(source, /neutral:\s*["']Status["']/);
  assert.match(source, /working:\s*["']Working["']/);
  assert.match(source, /success:\s*["']Complete["']/);
  assert.match(source, /warning:\s*["']Attention["']/);
  assert.match(source, /error:\s*["']Error["']/);
  assert.match(source, /export function Status\(/);
  assert.match(source, /data-slot=["']status["']/);
  assert.match(source, /data-tone=\{tone\}/);
  assert.match(source, /data-slot=["']status-label["']/);
  assert.match(source, /toneLabels\[tone\]/);
  assert.match(source, /children/);

  for (const className of [
    "border-border bg-muted text-muted-foreground",
    "border-primary/30 bg-secondary text-secondary-foreground",
    "border-success/30 bg-success text-success-foreground",
    "border-warning/30 bg-warning text-warning-foreground",
    "border-destructive/30 bg-destructive text-destructive-foreground",
  ]) {
    assert.match(source, new RegExp(className));
  }

  for (const [kind, tone] of [
    ["idle", "neutral"],
    ["submitting", "working"],
    ["inspecting", "working"],
    ["evaluating", "working"],
    ["quick_response", "success"],
    ["tool_selected", "success"],
    ["eligible", "success"],
    ["disclosures_reported", "success"],
    ["payment_required", "warning"],
    ["declined", "warning"],
    ["needs_disclosure", "warning"],
    ["unavailable", "error"],
    ["invalid_request", "error"],
    ["transport_failure", "error"],
    ["unexpected_response", "error"],
    ["directory_unavailable", "error"],
    ["directory_invalid", "error"],
    ["native_summary_unavailable", "error"],
    ["input_invalid", "error"],
  ]) {
    assert.match(
      source,
      new RegExp(`case ["']${kind}["']:\\s*return ["']${tone}["'];`),
    );
  }

  assert.doesNotMatch(
    source,
    /["']use client["']|\buse(?:State|Effect|Memo|Ref)\b|\bfetch\b|window\.|process\.env|localStorage|sessionStorage|setTimeout|setInterval|https?:\/\//,
  );
});

test("declares the exact feedback tokens and routes only existing outcomes through Status", async (t) => {
  if (!(await fileExists(statusPath))) {
    t.skip("the durable Status source is absent during RED");
    return;
  }

  const [styles, request, toolLoop, nativeQuote, preflight, directory] = await Promise.all([
    readAppFile("src/app/globals.css"),
    readAppFile("src/components/riskscan/request/riskscan-request-flow.tsx"),
    readAppFile("src/components/riskscan/tool-loop/riskscan-tool-loop.tsx"),
    readAppFile("src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx"),
    readAppFile("src/components/riskscan/preflight/riskscan-quick-preflight.tsx"),
    readAppFile("src/components/discovery/riskscan-directory-discovery.tsx"),
  ]);

  for (const [name, value] of [
    ["destructive", "#fdeae4"],
    ["destructive-foreground", "#b03a1d"],
    ["success", "#e6f4ec"],
    ["success-foreground", "#1c7a4d"],
    ["warning", "#fdf1d8"],
    ["warning-foreground", "#a05a12"],
  ]) {
    assert.match(styles, new RegExp(`--${name}: ${value};`));
    assert.match(styles, new RegExp(`--color-${name}: var\\(--${name}\\);`));
  }

  for (const [source, importSpecifier] of [
    [request, "../../ui/status"],
    [toolLoop, "../../ui/status"],
    [nativeQuote, "../../ui/status"],
    [preflight, "../../ui/status"],
    [directory, "../ui/status"],
  ]) {
    assert.match(source, new RegExp(`from ["']${importSpecifier}["']`));
    assert.match(source, /\bStatus\b/);
    assert.match(source, /\bstatusToneForOutcome\(/);
    assert.match(source, /aria-live=["']polite["']/);
  }

  for (const [source, message] of [
    [request, "RiskScan is unavailable. No payment challenge or result was returned."],
    [request, "A payment challenge was returned. No payment was made in this browser."],
    [request, "The request was rejected before a result. Check the fields and try again."],
    [toolLoop, "Sending the ToolLoop request boundary."],
    [nativeQuote, "Evaluating local native quote compatibility."],
    [preflight, "Quick preflight"],
    [directory, "Inspecting the local directory."],
  ]) {
    assert.match(source, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
