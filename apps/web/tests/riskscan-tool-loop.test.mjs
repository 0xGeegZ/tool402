import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

const input = {
  requestRef: "request-agent-42",
  subjectRef: "service:tool402",
  context: "caller disclosure review",
  declarations: { identity: true, pricing: true, limitations: true, evidence: true },
};

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadToolLoopState() {
  return import("../src/components/riskscan/tool-loop/riskscan-tool-loop-state.ts");
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
        amount: "10000",
      },
    }],
  };
}

function response(status, challenge) {
  return {
    status,
    headers: { get(name) { return name === "payment-required" ? challenge : null; } },
    json() { throw new Error("response body must not be read"); },
  };
}

test("uses the public Agent ToolLoop flow for one safe directory GET then one unsigned challenge POST", async () => {
  const { runRiskScanQuickFlow } = await import("@tool402/agent/riskscan-tool-flow");
  const directoryCalls = [];
  const challengeCalls = [];

  const outcome = await runRiskScanQuickFlow(
    new URL("http://service.test/example"),
    input,
    async (target, init) => {
      directoryCalls.push([target, init]);
      return Response.json(directory());
    },
    async (target, init) => {
      challengeCalls.push([target, init]);
      return response(402, "controlled-challenge-value");
    },
  );

  assert.deepEqual(outcome, { kind: "payment_required" });
  assert.deepEqual(directoryCalls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
  assert.deepEqual(challengeCalls, [[
    new URL("http://service.test/api/riskscan"),
    {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(input),
      credentials: "omit",
      redirect: "error",
    },
  ]]);
});

test("does not submit a RiskScan request when the public Agent directory call fails", async () => {
  const { runRiskScanQuickFlow } = await import("@tool402/agent/riskscan-tool-flow");
  let challengeCalls = 0;

  const outcome = await runRiskScanQuickFlow(
    new URL("http://service.test/example"),
    input,
    async () => { throw new Error("offline"); },
    async () => {
      challengeCalls += 1;
      return response(402, "controlled-challenge-value");
    },
  );

  assert.deepEqual(outcome, { kind: "directory_unavailable" });
  assert.equal(challengeCalls, 0);
});

test("runs only one ToolLoop submission until the pending runner releases its synchronous lock", async () => {
  const { runExclusive } = await loadToolLoopState();
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
  assert.equal(await runExclusive(inFlight, async () => {
    calls += 1;
    return "third";
  }), "third");
  assert.equal(calls, 2);
});

test("maps only the bounded ToolLoop view states to their truthful fixed messages", async () => {
  const { toolLoopOutcomeMessage } = await loadToolLoopState();

  for (const [state, expected] of [
    [{ kind: "idle" }, null],
    [{ kind: "submitting" }, "Sending the ToolLoop request boundary."],
    [{ kind: "directory_unavailable" }, "RiskScan directory is unavailable. No RiskScan request was sent."],
    [{ kind: "directory_invalid" }, "RiskScan directory is invalid. No RiskScan request was sent."],
    [{ kind: "input_invalid" }, "The input was rejected. No RiskScan request was sent."],
    [{ kind: "transport_failure" }, "The request could not reach the service. No payment or result is confirmed or shown."],
    [{ kind: "unavailable" }, "RiskScan is unavailable. No payment or result is confirmed or shown."],
    [{ kind: "payment_required" }, "A payment challenge was returned. No payment was made in this browser."],
    [{ kind: "unexpected_response" }, "The service returned an unexpected response. No payment or result is confirmed or shown."],
  ]) {
    assert.equal(toolLoopOutcomeMessage(state), expected);
  }
});

test("locks the static ToolLoop page, bounded client form, and non-payment presentation boundary", async () => {
  const [page, flow, detail] = await Promise.all([
    readAppFile("src/app/explore/riskscan/tool-loop/page.tsx"),
    readAppFile("src/components/riskscan/tool-loop/riskscan-tool-loop.tsx"),
    readAppFile("src/components/riskscan/detail/riskscan-detail.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(page, /<RiskScanToolLoop\s*\/>/);
  assert.match(flow, /["']use client["']/);
  assert.match(flow, /<form\b[^>]*>/);

  for (const field of ["requestRef", "subjectRef", "context", "identity", "pricing", "limitations", "evidence"]) {
    assert.match(flow, new RegExp(`name=["']${field}["']`));
  }
  assert.match(flow, /name=["']requestRef["'][^>]*required[^>]*maxLength=\{96\}/);
  assert.match(flow, /name=["']subjectRef["'][^>]*required[^>]*maxLength=\{160\}/);
  assert.match(flow, /name=["']context["'][^>]*required[^>]*maxLength=\{280\}/);
  for (const declaration of ["identity", "pricing", "limitations", "evidence"]) {
    assert.match(flow, new RegExp(`name=["']${declaration}["'][^>]*type=["']checkbox["']`));
  }
  assert.match(flow, /new URL\(window\.location\.origin\)/);
  assert.match(flow, /disabled=\{state\.kind === ["']submitting["']\}/);
  assert.match(flow, /const inFlight = useRef\(false\);/);
  assert.match(flow, /await runExclusive\(inFlight, async \(\) =>/);
  assert.match(flow, /toolLoopOutcomeMessage\(state\)/);
  assert.match(flow, /aria-live=["']polite["']/);
  assert.equal((flow.match(/\brunRiskScanQuickFlow\b/g) ?? []).length, 2);

  assert.match(detail, /href=["']\/explore\/riskscan\/tool-loop["']/);

  assert.doesNotMatch(flow, /\bfetch\b|\/api\//);
  assert.doesNotMatch(flow, /\bheaders\b|payment-required|PAYMENT-REQUIRED/i);
  assert.doesNotMatch(flow, /process\.env|\b(?:configuration|config)\b/i);
  assert.doesNotMatch(flow, /\b(?:wallet|account|signer|provider|price|network|recipient|facilitator)\b/i);
  assert.doesNotMatch(flow, /\b(?:quick_response|RiskScanQuickResult|evidenceRef|receipt)\b/i);
  assert.doesNotMatch(flow, /\b(?:localStorage|sessionStorage|setTimeout|setInterval|retry)\b/i);
  assert.doesNotMatch(flow, /https?:\/\/|mailto:|target=/i);
  assert.doesNotMatch(flow, /\b(?:paid|settled|completed)\b/i);
});
