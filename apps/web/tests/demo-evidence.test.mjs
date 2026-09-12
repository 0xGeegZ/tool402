import assert from "node:assert/strict";
import test from "node:test";

const moduleUrl = new URL("../src/components/demo/demo-evidence.ts", import.meta.url);

function agentEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    kind: "tool402.agent-payment",
    recordingRunRef: "b03-release-001",
    sourceVersion: "abc1234",
    observedAt: "2026-09-12T09:00:00.000Z",
    service: { id: "riskscan.quick", host: "tool402.vercel.app" },
    payment: {
      network: "hedera:testnet",
      asset: "0.0.0",
      quotedAmount: "100000",
      settlementRef: "0.0.1002@1720000000.123456789",
      payer: "0.0.1001",
      recipient: "0.0.1002",
      settlementReportedBy: "facilitator-reported",
    },
    result: {
      requestRef: "b03-release-001",
      digest: "a".repeat(64),
      receivedAndValidatedByClient: true,
    },
    ...overrides,
  };
}

test("imports only an exact safe Agent evidence schema and never trusts an imported verified flag", async () => {
  const { parseDemoEvidenceImport, summarizeDemoEvidence } = await import(moduleUrl.href);
  const imported = parseDemoEvidenceImport(JSON.stringify({ ...agentEvidence(), verified: true }));
  assert.equal(imported, null);

  const safe = parseDemoEvidenceImport(JSON.stringify(agentEvidence()));
  assert.notEqual(safe, null);
  const summary = summarizeDemoEvidence([safe]);
  assert.equal(summary.agentPayment.status, "Settlement reported");
  assert.equal(summary.agentPayment.detail, "Submitted — verification pending. Result received by the Agent.");
  assert.equal(summary.agentPayment.hashscanUrl, "https://hashscan.io/testnet/transaction/0.0.1002-1720000000-123456789");
  assert.equal(summary.agentPayment.verifiedOnHedera, false);
});

test("deduplicates a local retake summary and rejects wrong recording bindings, oversized, and secret-bearing imports", async () => {
  const { exportDemoEvidenceSummary, parseDemoEvidenceImport, mergeDemoEvidence, readStoredDemoEvidence, writeStoredDemoEvidence } = await import(moduleUrl.href);
  const safe = parseDemoEvidenceImport(JSON.stringify(agentEvidence()));
  assert.notEqual(safe, null);
  assert.deepEqual(mergeDemoEvidence([safe], safe), [safe]);
  assert.equal(parseDemoEvidenceImport(JSON.stringify(agentEvidence({ payment: { ...agentEvidence().payment, network: "hedera:mainnet" } }))), null);
  assert.equal(parseDemoEvidenceImport(JSON.stringify(agentEvidence({ recordingRunRef: "another-run" }))), null);
  assert.equal(parseDemoEvidenceImport(JSON.stringify(agentEvidence({ service: { id: "riskscan.quick", host: "other.example" } }))), null);
  assert.equal(parseDemoEvidenceImport(JSON.stringify(agentEvidence({ payment: { ...agentEvidence().payment, asset: "0.0.1" } }))), null);
  assert.equal(parseDemoEvidenceImport(JSON.stringify(agentEvidence({ result: { ...agentEvidence().result, requestRef: "another-request" } }))), null);
  const conflictingResult = parseDemoEvidenceImport(JSON.stringify(agentEvidence({ result: { ...agentEvidence().result, digest: "b".repeat(64) } })));
  assert.notEqual(conflictingResult, null);
  assert.deepEqual(mergeDemoEvidence([safe], conflictingResult), [safe]);
  assert.equal(parseDemoEvidenceImport(JSON.stringify({ ...agentEvidence(), privateKey: "secret" })), null);
  assert.equal(parseDemoEvidenceImport("x".repeat(16_385)), null);

  let persisted = null;
  const storage = { getItem: () => persisted, setItem: (_key, value) => { persisted = value; } };
  writeStoredDemoEvidence(storage, [safe]);
  assert.deepEqual(readStoredDemoEvidence(storage), [safe]);
  assert.deepEqual(parseDemoEvidenceImport(exportDemoEvidenceSummary([safe])), safe);
  assert.doesNotMatch(persisted, /private|context|assessment|signature|cookie/i);
});
