import assert from "node:assert/strict";
import test from "node:test";

const moduleUrl = new URL("../src/riskscan-payment-evidence.ts", import.meta.url);

test("creates a sanitized versioned packet only from a paid Agent outcome", async () => {
  const { createRiskScanPaymentEvidence } = await import(moduleUrl.href);
  const evidence = createRiskScanPaymentEvidence({
    outcome: {
      kind: "paid",
      settlementRef: "0.0.1002@1720000000.123456789",
      assessment: {
        requestRef: "recording-request-1",
        subjectRef: "service:tool402",
        context: "sensitive caller context must not leave the terminal",
        disposition: "disclosures_reported",
        reasons: ["sensitive reason"],
        limitations: ["sensitive limitation"],
      },
      quotedPayment: {
        network: "hedera:testnet",
        asset: "0.0.0",
        amount: "100000",
        recipient: "0.0.1002",
      },
    },
    serviceBase: new URL("https://tool402.example/path?secret=discarded"),
    payerAccountId: "0.0.1001",
    recordingRunRef: "demo-run-2026-09-12",
    sourceVersion: "abc1234",
    observedAt: "2026-09-12T09:00:00.000Z",
  });

  assert.deepEqual(evidence, {
    schemaVersion: 1,
    kind: "tool402.agent-payment",
    recordingRunRef: "demo-run-2026-09-12",
    sourceVersion: "abc1234",
    observedAt: "2026-09-12T09:00:00.000Z",
    service: { id: "riskscan.quick", host: "tool402.example" },
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
      requestRef: "recording-request-1",
      digest: "bf5319afcb1b5a850369b46dc63f8049d2dbcf5e75fe13456681dfb322e8bc12",
      receivedAndValidatedByClient: true,
    },
  });
  assert.doesNotMatch(JSON.stringify(evidence), /sensitive|secret|context|reason|limitation/i);
});

test("refuses non-paid outcomes and writes one safe JSON packet without retrying payment", async () => {
  const { createRiskScanPaymentEvidence, writeRiskScanPaymentEvidence } = await import(moduleUrl.href);
  assert.throws(() => createRiskScanPaymentEvidence({ outcome: { kind: "unavailable" } }), TypeError);

  const packet = createRiskScanPaymentEvidence({
    outcome: {
      kind: "paid",
      settlementRef: "0.0.1002@1720000000.123456789",
      assessment: { requestRef: "recording-request-1", subjectRef: "service:tool402", context: "not exported", disposition: "disclosures_reported", reasons: [], limitations: [] },
      quotedPayment: { network: "hedera:testnet", asset: "0.0.0", amount: "100000", recipient: "0.0.1002" },
    },
    serviceBase: new URL("https://tool402.example"), payerAccountId: "0.0.1001", recordingRunRef: null, sourceVersion: null, observedAt: "2026-09-12T09:00:00.000Z",
  });
  let writes = 0;
  writeRiskScanPaymentEvidence(packet, "/tmp/evidence.json", (path, body) => {
    writes += 1;
    assert.equal(path, "/tmp/evidence.json");
    assert.deepEqual(JSON.parse(body), packet);
  });
  assert.equal(writes, 1);
});
