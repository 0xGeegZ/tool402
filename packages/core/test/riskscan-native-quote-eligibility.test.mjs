import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRiskScanNativeQuote } from "../src/index.ts";

const genericAssetPolicy = {
  network: "hedera:testnet",
  asset: "0.0.777",
  maximumAmount: "900719925474099300000",
};

const genericAssetQuote = {
  network: "hedera:testnet",
  asset: "0.0.777",
  amount: "900719925474099300000",
};

const invalidPolicy = {
  ...genericAssetPolicy,
  network: "hedera:mainnet",
};

function declined(reason) {
  return { kind: "declined", reason };
}

function recordWithPrototype(prototype, values) {
  return Object.assign(Object.create(prototype), values);
}

test("selects an equal generic-asset quote without losing an exact atomic amount", () => {
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, genericAssetQuote),
    {
      kind: "eligible",
      network: "hedera:testnet",
      asset: "0.0.777",
      amount: 900719925474099300000n,
    },
  );
});

test("accepts the native HBAR asset sentinel with an exact atomic amount", () => {
  assert.deepEqual(
    evaluateRiskScanNativeQuote(
      {
        network: "hedera:testnet",
        asset: "0.0.0",
        maximumAmount: "9007199254740993",
      },
      {
        network: "hedera:testnet",
        asset: "0.0.0",
        amount: "9007199254740993",
      },
    ),
    {
      kind: "eligible",
      network: "hedera:testnet",
      asset: "0.0.0",
      amount: 9007199254740993n,
    },
  );
});

test("declines a positive quote that exceeds an explicit zero maximum", () => {
  assert.deepEqual(
    evaluateRiskScanNativeQuote(
      { ...genericAssetPolicy, maximumAmount: "0" },
      { ...genericAssetQuote, amount: "1" },
    ),
    declined("amount_exceeds_maximum"),
  );
});

test("returns the declared mismatch and cap decline reasons", () => {
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, {
      ...genericAssetQuote,
      network: "hedera:mainnet",
    }),
    declined("network_mismatch"),
  );
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, {
      ...genericAssetQuote,
      asset: "0.0.778",
    }),
    declined("asset_mismatch"),
  );
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, {
      ...genericAssetQuote,
      amount: "900719925474099300001",
    }),
    declined("amount_exceeds_maximum"),
  );
});

test("rejects malformed policies before inspecting quote data", () => {
  for (const policy of [
    null,
    [],
    { ...genericAssetPolicy, network: "hedera:mainnet" },
    { ...genericAssetPolicy, asset: "00.0.777" },
    { ...genericAssetPolicy, maximumAmount: "01" },
    { ...genericAssetPolicy, unexpected: "field" },
  ]) {
    assert.deepEqual(
      evaluateRiskScanNativeQuote(policy, genericAssetQuote),
      declined("invalid_policy"),
    );
  }

  let getterCalls = 0;
  const accessorPolicy = {
    asset: "0.0.777",
    maximumAmount: "1",
    get network() {
      getterCalls += 1;
      return "hedera:testnet";
    },
  };

  assert.deepEqual(
    evaluateRiskScanNativeQuote(accessorPolicy, genericAssetQuote),
    declined("invalid_policy"),
  );
  assert.equal(getterCalls, 0);

  const hostileQuote = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw new Error("quote inspection is forbidden for an invalid policy");
      },
    },
  );

  assert.deepEqual(
    evaluateRiskScanNativeQuote(invalidPolicy, hostileQuote),
    declined("invalid_policy"),
  );
});

test("rejects malformed quotes without invoking quote accessors", () => {
  for (const quote of [
    null,
    [],
    { ...genericAssetQuote, network: 1 },
    { ...genericAssetQuote, asset: "00.0.777" },
    { ...genericAssetQuote, amount: "0" },
    { ...genericAssetQuote, amount: "01" },
    { ...genericAssetQuote, unexpected: "field" },
  ]) {
    assert.deepEqual(
      evaluateRiskScanNativeQuote(genericAssetPolicy, quote),
      declined("invalid_quote"),
    );
  }

  let getterCalls = 0;
  const accessorQuote = {
    network: "hedera:testnet",
    asset: "0.0.777",
    get amount() {
      getterCalls += 1;
      return "1";
    },
  };

  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, accessorQuote),
    declined("invalid_quote"),
  );
  assert.equal(getterCalls, 0);
});

test("requires ordinary own enumerable data records with exactly the declared fields", () => {
  const inheritedQuote = recordWithPrototype(
    { amount: "1" },
    { network: "hedera:testnet", asset: "0.0.777" },
  );
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, inheritedQuote),
    declined("invalid_quote"),
  );

  for (const prototype of [null, { inherited: true }]) {
    assert.deepEqual(
      evaluateRiskScanNativeQuote(
        recordWithPrototype(prototype, genericAssetPolicy),
        genericAssetQuote,
      ),
      declined("invalid_policy"),
    );
    assert.deepEqual(
      evaluateRiskScanNativeQuote(
        genericAssetPolicy,
        recordWithPrototype(prototype, genericAssetQuote),
      ),
      declined("invalid_quote"),
    );
  }

  const symbolPolicy = {
    ...genericAssetPolicy,
    [Symbol("internal")]: true,
  };
  assert.deepEqual(
    evaluateRiskScanNativeQuote(symbolPolicy, genericAssetQuote),
    declined("invalid_policy"),
  );

  const nonEnumerableQuote = Object.defineProperty(
    { ...genericAssetQuote },
    "internal",
    { value: true },
  );
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, nonEnumerableQuote),
    declined("invalid_quote"),
  );
});

test("uses descriptors rather than direct property reads for valid proxy records", () => {
  const forbidDirectReads = {
    get() {
      throw new Error("direct property reads are prohibited");
    },
  };

  const policy = new Proxy({ ...genericAssetPolicy }, forbidDirectReads);
  const quote = new Proxy({ ...genericAssetQuote }, forbidDirectReads);

  assert.deepEqual(evaluateRiskScanNativeQuote(policy, quote), {
    kind: "eligible",
    network: "hedera:testnet",
    asset: "0.0.777",
    amount: 900719925474099300000n,
  });
});

test("fails closed when record reflection throws", () => {
  const throwingPolicy = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw new Error("policy prototype reflection failed");
      },
    },
  );
  assert.deepEqual(
    evaluateRiskScanNativeQuote(throwingPolicy, genericAssetQuote),
    declined("invalid_policy"),
  );

  const throwingQuote = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error("quote key reflection failed");
      },
    },
  );
  assert.deepEqual(
    evaluateRiskScanNativeQuote(genericAssetPolicy, throwingQuote),
    declined("invalid_quote"),
  );
});
