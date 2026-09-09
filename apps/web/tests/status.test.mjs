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

  for (const [tone, kinds] of [
    ["neutral", ["idle"]],
    ["working", ["submitting", "inspecting", "evaluating"]],
    ["success", ["quick_response", "tool_selected", "eligible", "disclosures_reported"]],
    ["warning", ["payment_required", "declined", "needs_disclosure"]],
    ["error", ["unavailable", "invalid_request", "transport_failure", "unexpected_response", "directory_unavailable", "directory_invalid", "native_summary_unavailable", "invalid_input"]],
  ]) {
    const cases = kinds
      .map((kind) => `case ["']${kind}["']:`)
      .join("[\\s\\S]*?");

    assert.match(
      source,
      new RegExp(`${cases}\\s*return ["']${tone}["'];`),
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

  const [
    styles,
    request,
    toolLoop,
    nativeQuote,
    preflight,
    directory,
    toolLoopState,
    nativeQuoteState,
    preflightState,
    directoryState,
  ] = await Promise.all([
    readAppFile("src/app/globals.css"),
    readAppFile("src/components/riskscan/request/riskscan-request-flow.tsx"),
    readAppFile("src/components/riskscan/tool-loop/riskscan-tool-loop.tsx"),
    readAppFile("src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx"),
    readAppFile("src/components/riskscan/preflight/riskscan-quick-preflight.tsx"),
    readAppFile("src/components/discovery/riskscan-directory-discovery.tsx"),
    readAppFile("src/components/riskscan/tool-loop/riskscan-tool-loop-state.ts"),
    readAppFile("src/components/riskscan/native-quote/riskscan-native-quote-state.ts"),
    readAppFile("src/components/riskscan/preflight/riskscan-quick-preflight-state.ts"),
    readAppFile("src/components/discovery/riskscan-directory-state.ts"),
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
    assert.match(source, /<Status\b(?=[^>]*\btone=\{[^}]*statusToneForOutcome\()[^>]*>/);
    assert.match(source, /<Status\b[\s\S]*?<\/Status>/);
  }

  for (const source of [request, nativeQuote, preflight]) {
    assert.match(source, /<section\b(?=[^>]*\baria-live=["']polite["'])[^>]*>/);
  }

  for (const source of [toolLoop, directory]) {
    assert.match(
      source,
      /<Status\b(?=[^>]*\btone=\{[^}]*statusToneForOutcome\()(?=[^>]*\baria-live=["']polite["'])[^>]*>/,
    );
  }

  assert.match(request, /<h2 className=["']text-xl font-semibold["']>Quick endpoint response<\/h2>/);

  for (const [source, message] of [
    [request, "Sending the request boundary."],
    [request, "RiskScan is unavailable. No payment challenge or result was returned."],
    [request, "A payment challenge was returned. No payment was made in this browser."],
    [request, "The request was rejected before a result. Check the fields and try again."],
    [request, "The request could not reach the service. No payment or result was confirmed."],
    [request, "The service returned an unexpected response. No payment or result is shown."],
    [request, "Quick endpoint response"],
    [request, "This is only an endpoint response. It is not payment or lifecycle evidence."],
    [toolLoopState, "Sending the ToolLoop request boundary."],
    [toolLoopState, "RiskScan directory is unavailable. No RiskScan request was sent."],
    [toolLoopState, "RiskScan directory is invalid. No RiskScan request was sent."],
    [toolLoopState, "The input was rejected. No RiskScan request was sent."],
    [toolLoopState, "The request could not reach the service. No payment or result is confirmed or shown."],
    [toolLoopState, "RiskScan is unavailable. No payment or result is confirmed or shown."],
    [toolLoopState, "A payment challenge was returned. No payment was made in this browser."],
    [toolLoopState, "The service returned an unexpected response. No payment or result is confirmed or shown."],
    [nativeQuoteState, "Evaluating local native quote compatibility."],
    [nativeQuoteState, "RiskScan directory is unavailable. Local compatibility was not evaluated."],
    [nativeQuoteState, "RiskScan directory is invalid. Local compatibility was not evaluated."],
    [nativeQuoteState, "A local native summary is unavailable. Local compatibility was not evaluated."],
    [nativeQuoteState, "The submitted local policy is not compatible with the advertised native summary."],
    [nativeQuoteState, "The advertised native summary is locally compatible. This is not consent, availability, a quote guarantee, payment authorization, or a transaction."],
    [preflightState, "This is caller-reported local preparation only. No request was sent, and it does not confirm a payment, service, evidence, or live availability."],
    [preflightState, "The local preflight input is invalid."],
    [preflightState, "One or more caller-reported disclosures are absent."],
    [preflightState, "All four disclosures are caller reported."],
    [directoryState, "The local directory descriptor was selected. No RiskScan request was sent."],
    [directoryState, "Inspecting the local directory."],
    [directoryState, "The local directory could not be read. No RiskScan request was sent."],
    [directoryState, "The local directory response could not be used. No RiskScan request was sent."],
  ]) {
    assert.match(source, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
