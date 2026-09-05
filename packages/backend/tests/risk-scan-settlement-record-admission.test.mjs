import assert from "node:assert/strict";
import test from "node:test";

const validInput = { transactionRef: "0xabc_123", observedAt: 1n };

async function loadAdmission() {
  const module = await import(
    new URL("../src/risk-scan-settlement-record-admission.ts", import.meta.url),
  );
  return module.admitRiskScanSettlementRecord;
}

function copyValidInput() {
  return { ...validInput };
}

test("admits an exact fresh frozen unpersisted candidate without protected fields", async () => {
  const admitRiskScanSettlementRecord = await loadAdmission();

  const first = admitRiskScanSettlementRecord(copyValidInput());
  const second = admitRiskScanSettlementRecord(copyValidInput());

  assert.deepEqual(first, {
    status: "unpersisted_candidate",
    table: "riskScanSettlementRecords",
    document: {
      transactionRef: "0xabc_123",
      verificationState: "pending_verification",
      observedAt: 1n,
    },
  });
  assert.deepEqual(Object.keys(first), ["status", "table", "document"]);
  assert.deepEqual(Reflect.ownKeys(first), ["status", "table", "document"]);
  assert.deepEqual(Object.keys(first.document), [
    "transactionRef",
    "verificationState",
    "observedAt",
  ]);
  assert.deepEqual(Reflect.ownKeys(first.document), [
    "transactionRef",
    "verificationState",
    "observedAt",
  ]);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.document), true);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.document, second.document);

  for (const field of [
    "attemptId",
    "network",
    "finalityBoundary",
    "publicId",
    "requestId",
    "payload",
    "payment",
    "signature",
    "credential",
    "wallet",
    "account",
    "evidence",
    "result",
    "amount",
    "currency",
    "price",
  ]) {
    assert.equal(field in first, false);
    assert.equal(field in first.document, false);
  }
});

test("rejects non-plain, inherited, symbol, hidden, and accessor input without reading accessors", async () => {
  const admitRiskScanSettlementRecord = await loadAdmission();
  const symbolInput = copyValidInput();
  symbolInput[Symbol("unexpected")] = "unexpected";
  const hiddenSymbolInput = copyValidInput();
  Object.defineProperty(hiddenSymbolInput, Symbol("hidden"), { value: "unexpected" });
  const hiddenExtraKeyInput = copyValidInput();
  Object.defineProperty(hiddenExtraKeyInput, "hidden", { value: "unexpected" });
  const nonEnumerableRequiredInput = copyValidInput();
  Object.defineProperty(nonEnumerableRequiredInput, "transactionRef", {
    enumerable: false,
    value: "0xabc_123",
  });
  const accessorInput = copyValidInput();
  let accessorRead = false;
  Object.defineProperty(accessorInput, "transactionRef", {
    enumerable: true,
    get() {
      accessorRead = true;
      return "0xabc_123";
    },
  });

  const inheritedInput = Object.create(validInput);
  const customPrototypeInput = Object.assign(Object.create({}), validInput);

  for (const { name, value } of [
    { name: "null", value: null },
    { name: "array", value: [] },
    { name: "null-prototype object", value: Object.assign(Object.create(null), validInput) },
    { name: "custom-prototype object", value: customPrototypeInput },
    { name: "inherited fields", value: inheritedInput },
    { name: "symbol key", value: symbolInput },
    { name: "hidden symbol key", value: hiddenSymbolInput },
    { name: "hidden extra key", value: hiddenExtraKeyInput },
    { name: "non-enumerable required key", value: nonEnumerableRequiredInput },
    { name: "accessor property", value: accessorInput },
  ]) {
    assert.throws(
      () => admitRiskScanSettlementRecord(value),
      TypeError,
      `expected ${name} to be rejected`,
    );
  }

  assert.equal(accessorRead, false);
});

test("rejects accessor fields when a polluted descriptor prototype supplies value", async () => {
  const admitRiskScanSettlementRecord = await loadAdmission();
  const accessorInput = copyValidInput();
  let accessorRead = false;
  const priorValueDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, "value");

  Object.defineProperty(accessorInput, "transactionRef", {
    enumerable: true,
    get() {
      accessorRead = true;
      throw new Error("must not read accessor");
    },
  });

  try {
    Object.defineProperty(Object.prototype, "value", {
      configurable: true,
      enumerable: false,
      value: "0xabc_123",
      writable: true,
    });
    assert.throws(
      () => admitRiskScanSettlementRecord(accessorInput),
      TypeError,
    );
  } finally {
    if (priorValueDescriptor === undefined) {
      delete Object.prototype.value;
    } else {
      Object.defineProperty(Object.prototype, "value", priorValueDescriptor);
    }
  }

  assert.equal(accessorRead, false);
});

test("rejects incomplete, unsafe, and malformed settlement-record fields", async () => {
  const admitRiskScanSettlementRecord = await loadAdmission();
  const tooLargeTimestamp = 9_223_372_036_854_775_808n;

  const rejectionCases = [
    {
      name: "missing transaction reference",
      value: (() => {
        const { transactionRef, ...input } = copyValidInput();
        return input;
      })(),
    },
    { name: "missing observed timestamp", value: { transactionRef: "0xabc_123" } },
    { name: "unexpected key", value: { ...copyValidInput(), extra: true } },
    { name: "caller supplied attempt identifier", value: { ...copyValidInput(), attemptId: "attempt" } },
    { name: "caller supplied network", value: { ...copyValidInput(), network: "eip155:84532" } },
    { name: "caller supplied verification state", value: { ...copyValidInput(), verificationState: "verified" } },
    { name: "caller supplied finality boundary", value: { ...copyValidInput(), finalityBoundary: "final" } },
    { name: "raw payload", value: { ...copyValidInput(), payload: {} } },
    { name: "blank transaction reference", value: { ...copyValidInput(), transactionRef: "" } },
    { name: "space in transaction reference", value: { ...copyValidInput(), transactionRef: "0xabc 123" } },
    { name: "unsafe transaction reference", value: { ...copyValidInput(), transactionRef: "0xabc/123" } },
    { name: "oversized transaction reference", value: { ...copyValidInput(), transactionRef: "a".repeat(161) } },
    { name: "non-string transaction reference", value: { ...copyValidInput(), transactionRef: 402 } },
    { name: "number timestamp", value: { ...copyValidInput(), observedAt: 1 } },
    { name: "negative timestamp", value: { ...copyValidInput(), observedAt: -1n } },
    { name: "out-of-range timestamp", value: { ...copyValidInput(), observedAt: tooLargeTimestamp } },
  ];

  for (const { name, value } of rejectionCases) {
    assert.throws(
      () => admitRiskScanSettlementRecord(value),
      TypeError,
      `expected ${name} to be rejected`,
    );
  }
});
