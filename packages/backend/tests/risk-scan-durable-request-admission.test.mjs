import assert from "node:assert/strict";
import test from "node:test";

const validInput = {
  publicId: "risk_402",
  requestRef: " request-402 ",
  subjectRefHash: "a".repeat(64),
  inputHash: "b".repeat(64),
  createdAt: 1n,
  updatedAt: 1n,
};

async function loadAdmission() {
  const module = await import(
    new URL("../src/risk-scan-durable-request-admission.ts", import.meta.url),
  );
  return module.admitRiskScanDurableRequest;
}

function copyValidInput() {
  return { ...validInput };
}

test("admits a canonical unpersisted candidate without exposing sensitive input", async () => {
  const admitRiskScanDurableRequest = await loadAdmission();

  const first = admitRiskScanDurableRequest(copyValidInput());
  const second = admitRiskScanDurableRequest(copyValidInput());

  assert.deepEqual(first, {
    status: "unpersisted_candidate",
    table: "riskScanRequests",
    document: {
      publicId: "risk_402",
      requestRef: "request-402",
      subjectRefHash: "a".repeat(64),
      inputHash: "b".repeat(64),
      state: "payment_required",
      createdAt: 1n,
      updatedAt: 1n,
    },
  });
  assert.deepEqual(Object.keys(first), ["status", "table", "document"]);
  assert.deepEqual(Reflect.ownKeys(first), ["status", "table", "document"]);
  assert.deepEqual(Object.keys(first.document), [
    "publicId",
    "requestRef",
    "subjectRefHash",
    "inputHash",
    "state",
    "createdAt",
    "updatedAt",
  ]);
  assert.deepEqual(Reflect.ownKeys(first.document), [
    "publicId",
    "requestRef",
    "subjectRefHash",
    "inputHash",
    "state",
    "createdAt",
    "updatedAt",
  ]);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.document), true);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.document, second.document);
  assert.equal("state" in first, false);

  for (const field of [
    "subjectRef",
    "context",
    "request",
    "payload",
    "evidence",
    "credential",
    "privateKey",
    "signer",
    "wallet",
    "account",
    "recipient",
    "settlement",
    "receipt",
    "result",
    "amount",
    "currency",
    "price",
  ]) {
    assert.equal(field in first, false);
    assert.equal(field in first.document, false);
  }
});

test("rejects non-plain, inherited, symbol, and accessor input without reading accessors", async () => {
  const admitRiskScanDurableRequest = await loadAdmission();
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
  Object.defineProperty(nonEnumerableRequiredInput, "publicId", {
    enumerable: false,
    value: "risk_402",
  });
  const accessorInput = copyValidInput();
  let accessorRead = false;
  Object.defineProperty(accessorInput, "publicId", {
    enumerable: true,
    get() {
      accessorRead = true;
      return "risk_402";
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
      () => admitRiskScanDurableRequest(value),
      undefined,
      `expected ${name} to be rejected`,
    );
  }

  assert.equal(accessorRead, false);
});

test("rejects incomplete, unsafe, and malformed request fields", async () => {
  const admitRiskScanDurableRequest = await loadAdmission();
  const tooLargeTimestamp = 9_223_372_036_854_775_808n;

  const rejectionCases = [
    {
      name: "missing public identifier",
      value: (() => {
        const { publicId, ...input } = copyValidInput();
        return input;
      })(),
    },
    { name: "unexpected key", value: { ...copyValidInput(), extra: true } },
    { name: "raw subject reference", value: { ...copyValidInput(), subjectRef: "service:weather" } },
    { name: "raw context", value: { ...copyValidInput(), context: "travel-planning" } },
    { name: "caller supplied state", value: { ...copyValidInput(), state: "completed" } },
    { name: "raw payload", value: { ...copyValidInput(), payload: {} } },
    { name: "blank public identifier", value: { ...copyValidInput(), publicId: " " } },
    { name: "leading-whitespace public identifier", value: { ...copyValidInput(), publicId: " risk_402" } },
    { name: "trailing-whitespace public identifier", value: { ...copyValidInput(), publicId: "risk_402\n" } },
    { name: "invalid public identifier", value: { ...copyValidInput(), publicId: "risk 402" } },
    { name: "oversized public identifier", value: { ...copyValidInput(), publicId: "a".repeat(97) } },
    { name: "non-string public identifier", value: { ...copyValidInput(), publicId: 402 } },
    { name: "blank request reference", value: { ...copyValidInput(), requestRef: "   " } },
    { name: "oversized request reference", value: { ...copyValidInput(), requestRef: "a".repeat(97) } },
    { name: "non-string request reference", value: { ...copyValidInput(), requestRef: 402 } },
    { name: "uppercase subject hash", value: { ...copyValidInput(), subjectRefHash: "A".repeat(64) } },
    { name: "short subject hash", value: { ...copyValidInput(), subjectRefHash: "a".repeat(63) } },
    { name: "non-string subject hash", value: { ...copyValidInput(), subjectRefHash: 402 } },
    { name: "uppercase input hash", value: { ...copyValidInput(), inputHash: "B".repeat(64) } },
    { name: "short input hash", value: { ...copyValidInput(), inputHash: "b".repeat(63) } },
    { name: "non-string input hash", value: { ...copyValidInput(), inputHash: 402 } },
    { name: "number timestamp", value: { ...copyValidInput(), createdAt: 1 } },
    { name: "negative timestamp", value: { ...copyValidInput(), createdAt: -1n, updatedAt: -1n } },
    { name: "out-of-range timestamp", value: { ...copyValidInput(), createdAt: tooLargeTimestamp, updatedAt: tooLargeTimestamp } },
    { name: "unequal timestamps", value: { ...copyValidInput(), updatedAt: 2n } },
  ];

  for (const { name, value } of rejectionCases) {
    assert.throws(
      () => admitRiskScanDurableRequest(value),
      undefined,
      `expected ${name} to be rejected`,
    );
  }
});
