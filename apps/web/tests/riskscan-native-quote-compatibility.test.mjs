import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadNativeQuoteState() {
  return import("../src/components/riskscan/native-quote/riskscan-native-quote-state.ts");
}

function directory() {
  return {
    version: "v1",
    tools: [{
      id: "riskscan.quick",
      name: "RiskScan Quick",
      request: { method: "POST", path: "/api/riskscan", contentType: "application/json" },
      input: {
        type: "object",
        required: ["requestRef", "subjectRef", "context", "declarations"],
        properties: {
          requestRef: { type: "string", minLength: 1, maxLength: 96 },
          subjectRef: { type: "string", minLength: 1, maxLength: 160 },
          context: { type: "string", minLength: 1, maxLength: 280 },
          declarations: {
            type: "object",
            additionalProperties: false,
            required: ["identity", "pricing", "limitations", "evidence"],
            properties: {
              identity: { type: "boolean" },
              pricing: { type: "boolean" },
              limitations: { type: "boolean" },
              evidence: { type: "boolean" },
            },
          },
        },
      },
      limitations: ["quick_assessment_only", "caller_declarations_are_not_external_verification"],
      payment: {
        state: "locally_configured",
        protocol: "x402",
        network: "hedera:testnet",
        asset: "0.0.429274",
        amount: "9007199254740993",
      },
    }],
  };
}

test("delegates an explicit native policy through the public Agent with one bounded Directory GET and no POST", async () => {
  const { evaluateDiscoveredRiskScanNativeQuote } = await import("@tool402/agent/riskscan-tool-native-quote-evaluation");
  const calls = [];

  const outcome = await evaluateDiscoveredRiskScanNativeQuote(
    new URL("http://service.test/current"),
    {
      network: "hedera:testnet",
      asset: "0.0.429274",
      maximumAmount: "9007199254740993",
    },
    async (target, init) => {
      calls.push([target, init]);
      return Response.json(directory());
    },
  );

  assert.deepEqual(outcome, {
    kind: "eligible",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: 9007199254740993n,
  });
  assert.deepEqual(calls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
  assert.equal(calls.filter(([, init]) => init?.method === "POST").length, 0);
});

test("creates an exact no-default native compatibility policy record from submitted fields", async () => {
  const { readNativeQuotePolicy } = await loadNativeQuoteState();
  const form = new FormData();
  form.set("network", "hedera:testnet");
  form.set("asset", "0.0.429274");
  form.set("maximumAmount", "9007199254740993");

  const policy = readNativeQuotePolicy(form);

  assert.equal(Object.getPrototypeOf(policy), Object.prototype);
  assert.deepEqual(Object.keys(policy), ["network", "asset", "maximumAmount"]);
  assert.deepEqual(policy, {
    network: "hedera:testnet",
    asset: "0.0.429274",
    maximumAmount: "9007199254740993",
  });

  assert.deepEqual(readNativeQuotePolicy(new FormData()), {
    network: null,
    asset: null,
    maximumAmount: null,
  });
});

test("locks duplicate native compatibility evaluations until the active evaluation settles", async () => {
  const { runExclusive } = await loadNativeQuoteState();
  const inFlight = { current: false };
  let calls = 0;
  let releaseFirst;

  const first = runExclusive(inFlight, async () => {
    calls += 1;
    await new Promise((resolve) => { releaseFirst = resolve; });
    return "first";
  });
  const second = await runExclusive(inFlight, async () => {
    calls += 1;
    return "second";
  });

  assert.equal(calls, 1);
  assert.equal(second, undefined);
  assert.equal(inFlight.current, true);

  releaseFirst();
  assert.equal(await first, "first");
  assert.equal(inFlight.current, false);
});

test("maps only bounded native compatibility outcomes to fixed truthful presentation", async () => {
  const { nativeQuoteCompatibilityOutcomeMessage } = await loadNativeQuoteState();

  const evaluating = "Evaluating local native quote compatibility.";
  const notEvaluated = "Local compatibility was not evaluated.";
  const declined = "The submitted local policy is not compatible with the advertised native summary.";
  const eligible = "The advertised native summary is locally compatible. This is not consent, availability, a quote guarantee, payment authorization, or a transaction.";

  for (const [state, expected] of [
    [{ kind: "idle" }, null],
    [{ kind: "evaluating" }, evaluating],
    [{ kind: "directory_unavailable" }, `RiskScan directory is unavailable. ${notEvaluated}`],
    [{ kind: "directory_invalid" }, `RiskScan directory is invalid. ${notEvaluated}`],
    [{ kind: "native_summary_unavailable" }, `A local native summary is unavailable. ${notEvaluated}`],
    [{ kind: "declined", reason: "invalid_policy" }, declined],
    [{ kind: "declined", reason: "invalid_quote" }, declined],
    [{ kind: "declined", reason: "network_mismatch" }, declined],
    [{ kind: "declined", reason: "asset_mismatch" }, declined],
    [{ kind: "declined", reason: "amount_exceeds_maximum" }, declined],
    [{ kind: "eligible", network: "hedera:testnet", asset: "0.0.429274", amount: 9007199254740993n }, eligible],
  ]) {
    assert.equal(nativeQuoteCompatibilityOutcomeMessage(state), expected);
  }
});

test("keeps the native compatibility page to one guest route, one client island, and constrained local navigation", async () => {
  const [page, island, navigation] = await Promise.all([
    readAppFile("src/app/dashboard/riskscan/compatibility/page.tsx"),
    readAppFile("src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx"),
    readAppFile("src/components/workspace/workspace-navigation.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<RiskScanNativeQuoteCompatibility\s*\/>/);

  assert.match(island, /["']use client["']/);
  assert.equal((island.match(/<form\b/g) ?? []).length, 1);
  for (const field of ["network", "asset", "maximumAmount"]) {
    assert.equal((island.match(new RegExp(`name=["']${field}["']`, "g")) ?? []).length, 1);
    assert.match(island, new RegExp(`<input\\b(?=[^>]*name=["']${field}["'])(?=[^>]*required)(?=[^>]*type=["']text["'])[^>]*>`));
  }
  assert.doesNotMatch(island, /(?:defaultValue|value)=/);
  assert.match(island, /new URL\(window\.location\.origin\)/);
  assert.match(island, /window\.fetch\.bind\(window\)/);
  assert.match(island, /readNativeQuotePolicy\(new FormData\(event\.currentTarget\)\)/);
  assert.match(island, /const inFlight = useRef\(false\);/);
  assert.match(island, /await runExclusive\(inFlight, async \(\) =>/);
  assert.match(island, /disabled=\{state\.kind === ["']evaluating["']\}/);
  assert.match(island, /nativeQuoteCompatibilityOutcomeMessage\(state\)/);
  assert.match(island, /aria-live=["']polite["']/);
  assert.equal((island.match(/\bevaluateDiscoveredRiskScanNativeQuote\b/g) ?? []).length, 2);

  assert.match(navigation, /\{ href: "\/dashboard\/riskscan\/compatibility", label: "Native compatibility" \}/);
  assert.match(navigation, /<Link\b[^>]*href=\{link\.href\}/);
  assert.doesNotMatch(navigation, /<(?:a|button)\b/i);

  assert.doesNotMatch(island, /\/api\//);
  assert.doesNotMatch(island, /\b(?:Request|RequestInit|Headers)\b|\bfetch\s*\(/);
  assert.doesNotMatch(island, /process\.env|\b(?:configuration|config)\b/i);
  assert.doesNotMatch(island, /\b(?:sign|session|identity|account|wallet|provider|signer|balance|recipient|facilitator)\b/i);
  assert.doesNotMatch(island, /\b(?:payment|settlement|result|receipt|evidence|transaction|deployment)\b/i);
  assert.doesNotMatch(island, /\b(?:localStorage|sessionStorage|setTimeout|setInterval|retry|analytics)\b/i);
  assert.doesNotMatch(island, /https?:\/\/|mailto:|target=/i);
});
