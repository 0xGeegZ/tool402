import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const moduleUrl = new URL("../src/components/demo/demo-control-room.ts", import.meta.url);

test("defines a stable, non-mutating recording itinerary with truthful evidence states", async () => {
  assert.equal(existsSync(fileURLToPath(moduleUrl)), true, "demo control-room module must exist");

  const {
    recordingSteps,
    recordingReadiness,
    recordingReadinessForEvidence,
    recordingTourHref,
  } = await import(moduleUrl.href);

  assert.equal(recordingSteps.length, 15);
  assert.deepEqual(recordingSteps.map((step) => step.id), [
    "introduce",
    "discover",
    "x402-boundary",
    "consumer-agent",
    "provider-sign-in",
    "provider-campaign",
    "provider-terms",
    "ats-deployment",
    "ats-lifecycle",
    "world",
    "publication",
    "backing",
    "backing-evidence",
    "dashboard",
    "evidence-recap",
  ]);
  assert.equal(new Set(recordingSteps.map((step) => step.id)).size, recordingSteps.length);
  assert.ok(recordingSteps.every((step) => step.do.length > 0 && step.say.length > 0 && step.show.length > 0));
  assert.equal(recordingSteps.find((step) => step.id === "consumer-agent")?.wallet, "Human Ops payer");
  assert.equal(recordingSteps.find((step) => step.id === "backing")?.wallet, "BACKER");
  assert.equal(recordingSteps.find((step) => step.id === "provider-sign-in")?.href, "/sign-in");
  assert.equal(recordingSteps.find((step) => step.id === "dashboard")?.href, "/sign-in");
  assert.equal(recordingSteps.find((step) => step.id === "ats-deployment")?.nextAction, "Continue after verified receipt");
  assert.equal(recordingSteps.find((step) => step.id === "world")?.nextAction, "Continue without World proof");
  assert.match(recordingSteps.find((step) => step.id === "backing")?.show ?? "", /allocation pending/i);
  assert.deepEqual(recordingReadiness.map((item) => item.status), [
    "ACTION REQUIRED",
    "ACTION REQUIRED",
    "ACTION REQUIRED",
    "ACTION REQUIRED",
    "ACTION REQUIRED",
    "NOT AVAILABLE",
    "ACTION REQUIRED",
    "OPTIONAL",
  ]);

  assert.equal(recordingTourHref("/provider/deploy?foo=bar", "provider-terms"), "/provider/deploy?foo=bar&tour=1&demoStep=provider-terms");
  assert.equal(recordingTourHref("/explore/riskscan/tool-loop?demo=tool-loop", "x402-boundary"), "/explore/riskscan/tool-loop?demo=tool-loop&tour=1&demoStep=x402-boundary");
  assert.throws(() => recordingTourHref("/provider", "unknown-step"), TypeError);
  assert.throws(() => recordingTourHref("/\\\\evil.example", "provider-terms"), TypeError);

  const evidence = {
    schemaVersion: 1, kind: "tool402.agent-payment", recordingRunRef: "run-1", sourceVersion: null, observedAt: "2026-09-12T09:00:00.000Z",
    service: { id: "riskscan.quick", host: "tool402.example" },
    payment: { network: "hedera:testnet", asset: "0.0.0", quotedAmount: "100000", settlementRef: "0.0.1002@1720000000.123456789", payer: "0.0.1001", recipient: "0.0.1002", settlementReportedBy: "client" },
    result: { requestRef: "recording-request-1", digest: "a".repeat(64), receivedAndValidatedByClient: true },
  };
  const liveReadiness = recordingReadinessForEvidence([evidence]);
  assert.equal(liveReadiness.find((item) => item.label === "B03 Consumer Agent settlement")?.status, "Settlement reported");
  assert.match(liveReadiness.find((item) => item.label === "B03 Consumer Agent settlement")?.detail ?? "", /Result received/i);
});
