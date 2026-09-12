import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../src/ats/provider-tool-receipt.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const expectationUrl = new URL("../src/ats/provider-tool-receipt-expectation.ts", import.meta.url);
const expectationPath = fileURLToPath(expectationUrl);
const expectationExists = existsSync(expectationPath);
const implementedExpectationTest = expectationExists ? test : test.skip;

const factory = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const sender = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const asset = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const hash = `0x${"1".repeat(64)}`;
const input = "0xdeadbeef";

function expectation(overrides = {}) {
  return {
    chainId: 296,
    sender,
    factory,
    input,
    transactionHash: hash,
    asset,
    ...overrides,
  };
}

function transaction(overrides = {}) {
  return {
    hash,
    chainId: 296,
    from: sender,
    to: factory,
    input,
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    transactionHash: hash,
    status: "0x1",
    logs: [{ address: factory, eventName: "BondDeployed", asset }],
    ...overrides,
  };
}

test("requires the declared provider-tool receipt verifier before GREEN", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) await import(sourceUrl.href);
});

implementedTest("verifies only the exact server-derived A receipt", async () => {
  const { verifyProviderToolReceipt } = await import(sourceUrl.href);
  assert.deepEqual(
    verifyProviderToolReceipt({
      expected: expectation(),
      transaction: transaction(),
      receipt: receipt(),
    }),
    { outcome: "VERIFIED", transactionHash: hash, asset },
  );
});

implementedTest("rejects each independently altered transaction or receipt field", async () => {
  const { verifyProviderToolReceipt } = await import(sourceUrl.href);
  const cases = [
    ["sender", { transaction: transaction({ from: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }) }],
    ["chain", { transaction: transaction({ chainId: 295 }) }],
    ["target", { transaction: transaction({ to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }) }],
    ["input", { transaction: transaction({ input: "0x00" }) }],
    ["hash", { transaction: transaction({ hash: `0x${"2".repeat(64)}` }) }],
    ["receipt hash", { receipt: receipt({ transactionHash: `0x${"2".repeat(64)}` }) }],
    ["status", { receipt: receipt({ status: "0x0" }) }],
    ["event address", { receipt: receipt({ logs: [{ address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", eventName: "BondDeployed", asset }] }) }],
    ["event count", { receipt: receipt({ logs: [
      { address: factory, eventName: "BondDeployed", asset },
      { address: factory, eventName: "BondDeployed", asset },
    ] }) }],
    ["asset", { receipt: receipt({ logs: [{ address: factory, eventName: "BondDeployed", asset: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }] }) }],
  ];
  for (const [name, change] of cases) {
    assert.deepEqual(
      verifyProviderToolReceipt({
        expected: expectation(),
        transaction: change.transaction ?? transaction(),
        receipt: change.receipt ?? receipt(),
      }),
      { outcome: "REJECTED" },
      name,
    );
  }
});

implementedTest("treats malformed and unavailable evidence as unknown rather than a false success", async () => {
  const { verifyProviderToolReceipt } = await import(sourceUrl.href);
  for (const evidence of [
    { transaction: null, receipt: receipt() },
    { transaction: transaction(), receipt: null },
    { transaction: transaction(), receipt: { ...receipt(), logs: "not-an-array" } },
    { transaction: transaction(), receipt: { ...receipt(), logs: Array(101).fill(receipt().logs[0]) } },
  ]) {
    assert.deepEqual(
      verifyProviderToolReceipt({ expected: expectation(), ...evidence }),
      { outcome: "UNKNOWN" },
    );
  }
});

test("requires the server-derived provider-tool receipt expectation before GREEN", () => {
  assert.equal(expectationExists, true, `missing declared source module: ${expectationPath}`);
});

implementedExpectationTest("derives a distinct exact Factory calldata for equal-name selected tools", async () => {
  const { createProviderToolAtsConfiguration } = await import("../src/ats/provider-tool-ats-configuration.ts");
  const { createProviderToolReceiptExpectation } = await import(expectationUrl.href);
  const first = createProviderToolAtsConfiguration({
    toolPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    subjectPublicId: "tool_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    title: "RiskScan",
    canonicalSignerAddress: sender,
  });
  const second = createProviderToolAtsConfiguration({
    toolPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    subjectPublicId: "tool_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    title: "RiskScan",
    canonicalSignerAddress: sender,
  });
  const firstExpectation = createProviderToolReceiptExpectation({
    configuration: first.atsCreateConfiguration,
    transactionHash: hash,
    asset,
  });
  const secondExpectation = createProviderToolReceiptExpectation({
    configuration: second.atsCreateConfiguration,
    transactionHash: hash,
    asset,
  });
  assert.equal(firstExpectation.input.startsWith("0x"), true);
  assert.notEqual(firstExpectation.input, secondExpectation.input);
  assert.deepEqual(firstExpectation, expectation({ input: firstExpectation.input }));
  const altered = structuredClone(first.atsCreateConfiguration);
  altered.parameters.numberOfUnits = "999";
  assert.deepEqual(createProviderToolReceiptExpectation({
    configuration: altered,
    transactionHash: hash,
    asset,
  }), firstExpectation, "rederivation ignores non-durable caller mutations");
});
