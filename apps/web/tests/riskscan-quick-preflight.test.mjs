import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

const localPreparationBoundary =
  "This is caller-reported local preparation only. No request was sent, and it does not confirm a payment, service, evidence, or live availability.";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadPreflightState() {
  return import("../src/components/riskscan/preflight/riskscan-quick-preflight-state.ts");
}

function formWithRequest({
  requestRef = "request-preflight-42",
  subjectRef = "service:tool402",
  context = "caller local preflight",
  declarations = {},
} = {}) {
  const form = new FormData();
  form.set("requestRef", requestRef);
  form.set("subjectRef", subjectRef);
  form.set("context", context);

  for (const declaration of ["identity", "pricing", "limitations", "evidence"]) {
    if (declarations[declaration]) form.set(declaration, "on");
  }

  return form;
}

test("preserves blank text and explicit caller declarations in the local Quick input", async () => {
  const { readRiskScanQuickPreflightInput } = await loadPreflightState();

  const blankInput = readRiskScanQuickPreflightInput(formWithRequest({
    requestRef: "",
    subjectRef: "",
    context: "",
  }));

  assert.equal(Object.getPrototypeOf(blankInput), Object.prototype);
  assert.deepEqual(Object.keys(blankInput), ["requestRef", "subjectRef", "context", "declarations"]);
  assert.deepEqual(blankInput, {
    requestRef: "",
    subjectRef: "",
    context: "",
    declarations: {
      identity: false,
      pricing: false,
      limitations: false,
      evidence: false,
    },
  });

  assert.deepEqual(
    readRiskScanQuickPreflightInput(formWithRequest({
      declarations: { identity: true, pricing: true, limitations: true, evidence: true },
    })),
    {
      requestRef: "request-preflight-42",
      subjectRef: "service:tool402",
      context: "caller local preflight",
      declarations: {
        identity: true,
        pricing: true,
        limitations: true,
        evidence: true,
      },
    },
  );
});

test("assesses caller disclosures locally and maps only bounded preflight feedback", async () => {
  const {
    evaluateRiskScanQuickPreflight,
    readRiskScanQuickPreflightInput,
    riskScanQuickPreflightOutcomeMessage,
  } = await loadPreflightState();

  const needsDisclosure = evaluateRiskScanQuickPreflight(
    readRiskScanQuickPreflightInput(formWithRequest()),
  );
  assert.deepEqual(needsDisclosure, {
    kind: "assessment",
    assessment: {
      requestRef: "request-preflight-42",
      subjectRef: "service:tool402",
      context: "caller local preflight",
      disposition: "needs_disclosure",
      reasons: [
        "identity disclosure",
        "pricing disclosure",
        "limitations disclosure",
        "evidence disclosure",
      ],
      limitations: [
        "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.",
      ],
    },
  });

  const allReported = evaluateRiskScanQuickPreflight(
    readRiskScanQuickPreflightInput(formWithRequest({
      declarations: { identity: true, pricing: true, limitations: true, evidence: true },
    })),
  );
  assert.deepEqual(allReported, {
    kind: "assessment",
    assessment: {
      requestRef: "request-preflight-42",
      subjectRef: "service:tool402",
      context: "caller local preflight",
      disposition: "disclosures_reported",
      reasons: [
        "caller reported identity disclosure",
        "caller reported pricing disclosure",
        "caller reported limitations disclosure",
        "caller reported evidence disclosure",
      ],
      limitations: [
        "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.",
      ],
    },
  });

  const invalidInput = evaluateRiskScanQuickPreflight(
    readRiskScanQuickPreflightInput(formWithRequest({ requestRef: "   " })),
  );
  assert.deepEqual(invalidInput, { kind: "invalid_input" });

  assert.equal(riskScanQuickPreflightOutcomeMessage({ kind: "idle" }), null);
  assert.equal(
    riskScanQuickPreflightOutcomeMessage(needsDisclosure),
    `One or more caller-reported disclosures are absent. ${localPreparationBoundary}`,
  );
  assert.equal(
    riskScanQuickPreflightOutcomeMessage(allReported),
    `All four disclosures are caller reported. ${localPreparationBoundary}`,
  );
  assert.equal(
    riskScanQuickPreflightOutcomeMessage(invalidInput),
    `The local preflight input is invalid. ${localPreparationBoundary}`,
  );
});

test("keeps the guest preflight to one static route, one local Core island, and one constrained link", async () => {
  const [page, island, state, navigation] = await Promise.all([
    readAppFile("src/app/dashboard/riskscan/preflight/page.tsx"),
    readAppFile("src/components/riskscan/preflight/riskscan-quick-preflight.tsx"),
    readAppFile("src/components/riskscan/preflight/riskscan-quick-preflight-state.ts"),
    readAppFile("src/components/workspace/workspace-navigation.tsx"),
  ]);

  assert.doesNotMatch(page, /["']use client["']/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((page.match(/<RiskScanQuickPreflight\s*\/>/g) ?? []).length, 1);

  assert.match(island, /^["']use client["'];/);
  assert.equal((island.match(/<form\b/g) ?? []).length, 1);
  for (const [field, maximumLength] of [["requestRef", 96], ["subjectRef", 160], ["context", 280]]) {
    assert.equal((island.match(new RegExp(`name=["']${field}["']`, "g")) ?? []).length, 1);
    assert.match(
      island,
      new RegExp(`<(?:input|textarea)\\b(?=[^>]*name=["']${field}["'])(?=[^>]*required)(?=[^>]*maxLength=\\{${maximumLength}\\})[^>]*>`),
    );
  }
  for (const declaration of ["identity", "pricing", "limitations", "evidence"]) {
    assert.match(island, new RegExp(`<input\\b(?=[^>]*name=["']${declaration}["'])(?=[^>]*type=["']checkbox["'])[^>]*>`));
  }
  assert.doesNotMatch(island, /(?:defaultValue|value)=/);
  assert.match(island, /readRiskScanQuickPreflightInput\(new FormData\(event\.currentTarget\)\)/);
  assert.match(island, /evaluateRiskScanQuickPreflight\(/);
  assert.match(island, /riskScanQuickPreflightOutcomeMessage\(state\)/);
  assert.match(island, /aria-live=["']polite["']/);

  assert.match(state, /from ["']@tool402\/core["']/);
  assert.equal((state.match(/\bassessRiskScanQuick\b/g) ?? []).length, 2);
  assert.match(state, /try\s*\{[\s\S]*?assessRiskScanQuick\(input\)/);
  assert.match(state, /catch \(error\)/);

  assert.match(navigation, /\{ href: "\/dashboard\/riskscan\/preflight", label: "Quick preflight" \}/);
  assert.match(navigation, /<Link\b[^>]*href=\{link\.href\}/);

  const localSources = [page, island, state].join("\n");
  assert.doesNotMatch(localSources, /@tool402\/agent|\/api\/|\bfetch\b|\b(?:RequestInit|Headers)\b|new URL\(/);
  assert.doesNotMatch(localSources, /\bPOST\b|process\.env|localStorage|sessionStorage|setTimeout|setInterval|retry|analytics/);
  assert.doesNotMatch(localSources, /\b(?:currentUser|connectWallet|signOut|authenticated|active\s+session)\b/i);
  assert.doesNotMatch(localSources, /\b(?:account|wallet|provider|signer|balance|recipient|facilitator)\b/i);
  assert.doesNotMatch(localSources, /https?:\/\/|mailto:|target=/i);
});
