import assert from "node:assert/strict";
import test from "node:test";

const validInput = {
  idempotencyKeyHash: "a".repeat(64),
  network: "eip155:84532",
  candidateSettlementRef: "0xabc_123",
  createdAt: 1n,
  updatedAt: 1n,
};

async function loadAdmission() {
  const module = await import(
    new URL("../src/risk-scan-settlement-attempt-admission.ts", import.meta.url),
  );
  return module.admitRiskScanSettlementAttempt;
}

function copyValidInput() {
  return { ...validInput };
}

test("admits a canonical unpersisted candidate without exposing protected input", async () => {
  const admitRiskScanSettlementAttempt = await loadAdmission();

  const first = admitRiskScanSettlementAttempt(copyValidInput());
  const second = admitRiskScanSettlementAttempt(copyValidInput());

  assert.deepEqual(first, {
    status: "unpersisted_candidate",
    table: "riskScanSettlementAttempts",
    document: {
      operation: "risk_scan_settlement",
      idempotencyKeyHash: "a".repeat(64),
      network: "eip155:84532",
      state: "pending_reconciliation",
      candidateSettlementRef: "0xabc_123",
      nextReconciliationAt: 1n,
      createdAt: 1n,
      updatedAt: 1n,
    },
  });
  assert.deepEqual(Object.keys(first), ["status", "table", "document"]);
  assert.deepEqual(Reflect.ownKeys(first), ["status", "table", "document"]);
  assert.deepEqual(Object.keys(first.document), [
    "operation",
    "idempotencyKeyHash",
    "network",
    "state",
    "candidateSettlementRef",
    "nextReconciliationAt",
    "createdAt",
    "updatedAt",
  ]);
  assert.deepEqual(Reflect.ownKeys(first.document), [
    "operation",
    "idempotencyKeyHash",
    "network",
    "state",
    "candidateSettlementRef",
    "nextReconciliationAt",
    "createdAt",
    "updatedAt",
  ]);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.document), true);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.document, second.document);

  for (const field of [
    "publicId",
    "requestId",
    "subject",
    "context",
    "payload",
    "signature",
    "credential",
    "wallet",
    "account",
    "receipt",
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
  const admitRiskScanSettlementAttempt = await loadAdmission();
  const symbolInput = copyValidInput();
  symbolInput[Symbol("unexpected")] = "unexpected";
  const hiddenSymbolInput = copyValidInput();
  Object.defineProperty(hiddenSymbolInput, Symbol("hidden"), {
    value: "unexpected",
  });
  const hiddenExtraKeyInput = copyValidInput();
  Object.defineProperty(hiddenExtraKeyInput, "hidden", {
    value: "unexpected",
  });
  const nonEnumerableRequiredInput = copyValidInput();
  Object.defineProperty(nonEnumerableRequiredInput, "network", {
    enumerable: false,
    value: "eip155:84532",
  });
  const accessorInput = copyValidInput();
  let accessorRead = false;
  Object.defineProperty(accessorInput, "network", {
    enumerable: true,
    get() {
      accessorRead = true;
      return "eip155:84532";
    },
  });

  const inheritedInput = Object.create(validInput);
  const customPrototypeInput = Object.assign(Object.create({}), validInput);

  for (const { name, value } of [
    { name: "null", value: null },
    { name: "array", value: [] },
    {
      name: "null-prototype object",
      value: Object.assign(Object.create(null), validInput),
    },
    { name: "custom-prototype object", value: customPrototypeInput },
    { name: "inherited fields", value: inheritedInput },
    { name: "symbol key", value: symbolInput },
    { name: "hidden symbol key", value: hiddenSymbolInput },
    { name: "hidden extra key", value: hiddenExtraKeyInput },
    { name: "non-enumerable required key", value: nonEnumerableRequiredInput },
    { name: "accessor property", value: accessorInput },
  ]) {
    assert.throws(
      () => admitRiskScanSettlementAttempt(value),
      undefined,
      `expected ${name} to be rejected`,
    );
  }

  assert.equal(accessorRead, false);
});

test("rejects accessor fields when a polluted descriptor prototype supplies value", async () => {
  const admitRiskScanSettlementAttempt = await loadAdmission();
  const accessorInput = copyValidInput();
  let accessorRead = 0;
  let rejected = false;
  const priorValueDescriptor = Object.getOwnPropertyDescriptor(
    Object.prototype,
    "value",
  );

  Object.defineProperty(accessorInput, "network", {
    enumerable: true,
    get() {
      accessorRead += 1;
      return "eip155:84532";
    },
  });

  try {
    Object.defineProperty(Object.prototype, "value", {
      configurable: true,
      enumerable: false,
      value: "eip155:84532",
      writable: true,
    });
    try {
      admitRiskScanSettlementAttempt(accessorInput);
    } catch {
      rejected = true;
    }
  } finally {
    if (priorValueDescriptor === undefined) {
      delete Object.prototype.value;
    } else {
      Object.defineProperty(Object.prototype, "value", priorValueDescriptor);
    }
  }

  assert.equal(rejected, true);
  assert.equal(accessorRead, 0);
});

test("rejects incomplete, unsafe, and malformed settlement-attempt fields", async () => {
  const admitRiskScanSettlementAttempt = await loadAdmission();
  const tooLargeTimestamp = 9_223_372_036_854_775_808n;

  const rejectionCases = [
    {
      name: "missing idempotency key hash",
      value: (() => {
        const { idempotencyKeyHash, ...input } = copyValidInput();
        return input;
      })(),
    },
    { name: "unexpected key", value: { ...copyValidInput(), extra: true } },
    { name: "caller supplied public identifier", value: { ...copyValidInput(), publicId: "risk_402" } },
    { name: "caller supplied request identifier", value: { ...copyValidInput(), requestId: "request_402" } },
    { name: "caller supplied state", value: { ...copyValidInput(), state: "completed" } },
    { name: "raw payload", value: { ...copyValidInput(), payload: {} } },
    { name: "uppercase idempotency key hash", value: { ...copyValidInput(), idempotencyKeyHash: "A".repeat(64) } },
    { name: "short idempotency key hash", value: { ...copyValidInput(), idempotencyKeyHash: "a".repeat(63) } },
    { name: "non-string idempotency key hash", value: { ...copyValidInput(), idempotencyKeyHash: 402 } },
    { name: "malformed network", value: { ...copyValidInput(), network: "eip155:" } },
    { name: "zero network ID", value: { ...copyValidInput(), network: "eip155:0" } },
    { name: "leading-zero network ID", value: { ...copyValidInput(), network: "eip155:01" } },
    { name: "non-EIP155 network", value: { ...copyValidInput(), network: "solana:1" } },
    { name: "non-string network", value: { ...copyValidInput(), network: 84532 } },
    { name: "blank candidate reference", value: { ...copyValidInput(), candidateSettlementRef: "" } },
    { name: "space in candidate reference", value: { ...copyValidInput(), candidateSettlementRef: "0xabc 123" } },
    { name: "unsafe candidate reference", value: { ...copyValidInput(), candidateSettlementRef: "0xabc/123" } },
    { name: "oversized candidate reference", value: { ...copyValidInput(), candidateSettlementRef: "a".repeat(161) } },
    { name: "non-string candidate reference", value: { ...copyValidInput(), candidateSettlementRef: 402 } },
    { name: "number timestamp", value: { ...copyValidInput(), createdAt: 1 } },
    { name: "negative timestamp", value: { ...copyValidInput(), createdAt: -1n, updatedAt: -1n } },
    { name: "out-of-range timestamp", value: { ...copyValidInput(), createdAt: tooLargeTimestamp, updatedAt: tooLargeTimestamp } },
    { name: "unequal timestamps", value: { ...copyValidInput(), updatedAt: 2n } },
  ];

  for (const { name, value } of rejectionCases) {
    assert.throws(
      () => admitRiskScanSettlementAttempt(value),
      undefined,
      `expected ${name} to be rejected`,
    );
  }
});
