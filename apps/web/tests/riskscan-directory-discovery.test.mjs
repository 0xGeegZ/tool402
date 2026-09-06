import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadDirectoryState() {
  return import("../src/components/discovery/riskscan-directory-state.ts");
}

function nativeDirectory() {
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
      limitations: [
        "quick_assessment_only",
        "caller_declarations_are_not_external_verification",
      ],
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

test("uses the public Agent Directory boundary for one credential-free GET and no RiskScan POST", async () => {
  const { discoverRiskScanQuick } = await import("@tool402/agent/riskscan-tool-directory");
  const calls = [];

  const outcome = await discoverRiskScanQuick(
    new URL("http://service.test/example"),
    async (target, init) => {
      calls.push([target, init]);
      return Response.json(nativeDirectory());
    },
  );

  assert.deepEqual(calls, [[
    new URL("http://service.test/api/tools"),
    { method: "GET", headers: { accept: "application/json" }, credentials: "omit", redirect: "error" },
  ]]);
  assert.equal(calls.filter(([, init]) => init.method === "POST").length, 0);
  assert.equal(outcome.kind, "tool_selected");
  assert.equal(outcome.tool.id, "riskscan.quick");
  assert.equal(outcome.tool.name, "RiskScan Quick");
  assert.deepEqual(outcome.tool.input.required, ["requestRef", "subjectRef", "context", "declarations"]);
  assert.deepEqual(outcome.tool.input.properties.requestRef, { type: "string", minLength: 1, maxLength: 96 });
  assert.deepEqual(outcome.tool.input.properties.subjectRef, { type: "string", minLength: 1, maxLength: 160 });
  assert.deepEqual(outcome.tool.input.properties.context, { type: "string", minLength: 1, maxLength: 280 });
  assert.deepEqual(outcome.tool.input.properties.declarations.required, ["identity", "pricing", "limitations", "evidence"]);
  assert.deepEqual(outcome.tool.limitations, [
    "quick_assessment_only",
    "caller_declarations_are_not_external_verification",
  ]);
  assert.deepEqual(outcome.tool.payment, {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "10000",
  });
});

test("keeps a failed public Directory read descriptor-free", async () => {
  const { discoverRiskScanQuick } = await import("@tool402/agent/riskscan-tool-directory");
  let calls = 0;

  const outcome = await discoverRiskScanQuick(new URL("http://service.test/example"), async () => {
    calls += 1;
    throw new Error("offline");
  });

  assert.equal(calls, 1);
  assert.deepEqual(outcome, { kind: "directory_unavailable" });
  assert.equal(Object.hasOwn(outcome, "tool"), false);
});

test("locks duplicate Directory inspection until the active inspection settles", async () => {
  const { runExclusive } = await loadDirectoryState();
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

test("maps only Directory inspection states to their truthful fixed messages", async () => {
  const { directoryOutcomeMessage } = await loadDirectoryState();

  for (const [state, expected] of [
    [{ kind: "idle" }, null],
    [{ kind: "inspecting" }, "Inspecting the local directory."],
    [{ kind: "directory_unavailable" }, "The local directory could not be read. No RiskScan request was sent."],
    [{ kind: "directory_invalid" }, "The local directory response could not be used. No RiskScan request was sent."],
    [{ kind: "tool_selected", tool: {} }, null],
  ]) {
    assert.equal(directoryOutcomeMessage(state), expected);
  }
});

test("keeps static Explore separate from the bounded client-only Directory island", async () => {
  const [page, island, state, staticCard] = await Promise.all([
    readAppFile("src/app/explore/page.tsx"),
    readAppFile("src/components/discovery/riskscan-directory-discovery.tsx"),
    readAppFile("src/components/discovery/riskscan-directory-state.ts"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(page, /<RiskScanDiscoveryCard\s*\/>/);
  assert.match(page, /<RiskScanDirectoryDiscovery\s*\/>/);
  assert.match(island, /^["']use client["'];/);
  assert.match(island, /from ["']@tool402\/agent\/riskscan-tool-directory["']/);
  assert.equal((island.match(/\bdiscoverRiskScanQuick\b/g) ?? []).length, 2);
  assert.match(island, /const \[state, setState\] = useState<RiskScanDirectoryViewState>\(\{ kind: ["']idle["'] \}\);/);
  assert.match(island, /const inFlight = useRef\(false\);/);
  assert.match(island, /await runExclusive\(inFlight, async \(\) =>/);
  assert.match(island, /new URL\(window\.location\.origin\)/);
  assert.match(island, /await discoverRiskScanQuick\(serviceBase\)/);
  assert.match(island, /<Button\b(?=[^>]*\btype=["']button["'])(?=[^>]*\bdisabled=\{state\.kind === ["']inspecting["']\})[^>]*>/);
  assert.match(island, />\s*Inspect local directory\s*<\/Button>/);
  assert.match(island, /directoryOutcomeMessage\(state\)/);
  assert.match(island, /aria-live=["']polite["']/);
  assert.match(island, /state\.kind === ["']tool_selected["']/);
  assert.match(island, /state\.tool\.id/);
  assert.match(island, /state\.tool\.name/);
  assert.match(island, /state\.tool\.input/);
  assert.match(island, /state\.tool\.limitations/);
  assert.match(island, /state\.tool\.payment/);
  assert.match(island, /Local configuration is required before a challenge can be offered\./);
  assert.match(island, /state\.tool\.payment\.asset/);
  assert.match(island, /state\.tool\.payment\.amount/);
  assert.match(island, /state\.tool\.payment\.price/);
  assert.match(state, /finally/);
  assert.match(staticCard, /This surface is descriptive only\./);
  assert.doesNotMatch(staticCard, /<(?:button|form|input|select|textarea)\b/i);

  assert.doesNotMatch(island, /\bfetch\s*\(|\/api\//);
  assert.doesNotMatch(island, /\bheaders\b|payment-required/i);
  assert.doesNotMatch(island, /process\.env/);
  assert.doesNotMatch(island, /state\.tool\.request|\btool\.request/);
  assert.doesNotMatch(island, /\b(?:wallet|account|signer|provider|recipient|facilitator)\b/i);
  assert.doesNotMatch(island, /\b(?:localStorage|sessionStorage|setTimeout|setInterval|retry)\b/);
  assert.doesNotMatch(island, /https?:\/\/|mailto:|target=/i);
  assert.doesNotMatch(island, /\b(?:quick_response|RiskScanQuickResult|result|receipt)\b/i);
  assert.doesNotMatch(island, /\b(?:paid|settled|completed)\b/i);
});
