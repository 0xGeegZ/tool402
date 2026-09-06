import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeRequirements,
  createOfferingRequirementsQuote,
  createOfferingTerms,
  isOfferingRequirementsQuoteActive,
  matchesQuotedRequirements,
  parseNoteUnits,
  sha256Requirements,
} from "@tool402/core";

const validTermsInput = {
  version: "offering-v1",
  fundingTargetTinybars: "100",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "10",
  minimumPurchaseUnits: "2",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "150",
};

function noteUnits(value) {
  const parsed = parseNoteUnits(value);
  assert.notEqual(parsed, undefined);
  return parsed;
}

function validTerms() {
  return createOfferingTerms(validTermsInput);
}

function nestedContainers(count) {
  let value = null;

  for (let index = 0; index < count; index += 1) {
    value = { child: value };
  }

  return value;
}

function objectWithProperties(count) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`field-${index}`, null]),
  );
}

function withOversizedStringifyGuard(callback) {
  const stringify = JSON.stringify;

  JSON.stringify = (...arguments_) => {
    if (
      typeof arguments_[0] === "string" &&
      arguments_[0].length > 1024
    ) {
      throw new Error("unbounded JSON.stringify input");
    }

    return stringify(...arguments_);
  };

  try {
    callback();
  } finally {
    JSON.stringify = stringify;
  }
}

test("canonicalizes nested key order and hashes the published UTF-8 vector", async () => {
  const requirements = {
    x402Version: 2,
    requirements: { b: true, a: ["z", { y: null, x: 2 }] },
  };

  assert.equal(
    canonicalizeRequirements(requirements),
    '{"requirements":{"a":["z",{"x":2,"y":null}],"b":true},"x402Version":2}',
  );
  assert.equal(
    await sha256Requirements(requirements),
    "e19be69052e97b9b41445cfd81527a49cf4fed010426580733a96b343461da6f",
  );
});

test("rejects raw strings and malformed or hostile requirements without evaluating getters", async () => {
  await assert.rejects(() => sha256Requirements('{"x402Version":2}'));

  const sparse = [];
  sparse[1] = true;
  const inherited = Object.create({ inherited: true });
  inherited.field = true;
  const nonEnumerable = { field: true };
  Object.defineProperty(nonEnumerable, "hidden", { value: true });
  const withSymbol = { field: true };
  withSymbol[Symbol("unsupported")] = true;
  const cyclic = { field: true };
  cyclic.self = cyclic;

  for (const malformed of [
    [],
    {},
    { field: undefined },
    { field: NaN },
    { field: -0 },
    { field: 1n },
    { field: sparse },
    inherited,
    nonEnumerable,
    withSymbol,
    cyclic,
  ]) {
    assert.throws(() => canonicalizeRequirements(malformed));
  }

  let getterRead = false;
  const accessor = {};
  Object.defineProperty(accessor, "unsafe", {
    enumerable: true,
    get() {
      getterRead = true;
      return "must-not-run";
    },
  });
  assert.throws(() => canonicalizeRequirements(accessor));
  assert.equal(getterRead, false);

  const reflectionFailure = new Proxy(
    { field: true },
    {
      ownKeys() {
        throw new Error("reflection failed");
      },
    },
  );
  assert.throws(() => canonicalizeRequirements(reflectionFailure));
});

test("accepts each canonicalization limit exactly and rejects one past it", () => {
  assert.doesNotThrow(() => canonicalizeRequirements(nestedContainers(16)));
  assert.throws(() => canonicalizeRequirements(nestedContainers(17)));

  const exactValueLimit = {
    first: Array.from({ length: 127 }, () => null),
    second: Array.from({ length: 126 }, () => null),
  };
  assert.doesNotThrow(() => canonicalizeRequirements(exactValueLimit));
  assert.throws(() =>
    canonicalizeRequirements({
      ...exactValueLimit,
      second: Array.from({ length: 127 }, () => null),
    }),
  );

  assert.doesNotThrow(() => canonicalizeRequirements(objectWithProperties(128)));
  assert.throws(() => canonicalizeRequirements(objectWithProperties(129)));

  assert.doesNotThrow(() =>
    canonicalizeRequirements({ items: Array.from({ length: 128 }, () => null) }),
  );
  assert.throws(() =>
    canonicalizeRequirements({ items: Array.from({ length: 129 }, () => null) }),
  );

  const exactByteLimit = { a: "a".repeat(32_760) };
  assert.equal(
    new TextEncoder().encode(canonicalizeRequirements(exactByteLimit)).byteLength,
    32_768,
  );
  assert.throws(() => canonicalizeRequirements({ a: "a".repeat(32_761) }));
});

test("bounds key and string serialization before oversized canonical output is built", () => {
  const oversizedLeaf = "a".repeat(128 * 1024);
  const oversizedKey = "k".repeat(128 * 1024);
  const escapeHeavy = '"'.repeat(16_385);

  assert.ok(new TextEncoder().encode(escapeHeavy).byteLength < 32 * 1024);
  withOversizedStringifyGuard(() => {
    assert.throws(
      () => canonicalizeRequirements({ value: oversizedLeaf }),
      /requirements exceed canonicalization limits/u,
    );
    assert.throws(
      () => canonicalizeRequirements(Object.fromEntries([[oversizedKey, true]])),
      /requirements exceed canonicalization limits/u,
    );
    assert.throws(
      () => canonicalizeRequirements({ value: escapeHeavy }),
      /requirements exceed canonicalization limits/u,
    );
  });
});

test("bounds object keys before descriptor reflection and sorting", () => {
  const commonPrefix = "k".repeat(32 * 1024 + 1);
  let descriptorRead = false;
  const requirements = new Proxy(
    {},
    {
      ownKeys() {
        return [`${commonPrefix}a`, `${commonPrefix}b`];
      },
      getOwnPropertyDescriptor() {
        descriptorRead = true;
        return {
          configurable: true,
          enumerable: true,
          value: true,
          writable: true,
        };
      },
    },
  );

  assert.throws(
    () => canonicalizeRequirements(requirements),
    /requirements exceed canonicalization limits/u,
  );
  assert.equal(descriptorRead, false);
});

test("preflights every object key before descriptor reflection", () => {
  const oversizedKey = "k".repeat(32 * 1024 + 1);
  let descriptorRead = false;
  const requirements = new Proxy(
    {},
    {
      ownKeys() {
        return ["safe", oversizedKey];
      },
      getOwnPropertyDescriptor() {
        descriptorRead = true;
        return {
          configurable: true,
          enumerable: true,
          value: true,
          writable: true,
        };
      },
    },
  );

  assert.throws(
    () => canonicalizeRequirements(requirements),
    /requirements exceed canonicalization limits/u,
  );
  assert.equal(descriptorRead, false);
});

test("bounds aggregate object key cost before descriptor reflection", () => {
  const firstKey = "a".repeat(20 * 1024);
  const secondKey = "b".repeat(20 * 1024);
  let descriptorRead = false;
  const requirements = new Proxy(
    {},
    {
      ownKeys() {
        return [firstKey, secondKey];
      },
      getOwnPropertyDescriptor() {
        descriptorRead = true;
        return {
          configurable: true,
          enumerable: true,
          value: true,
          writable: true,
        };
      },
    },
  );

  assert.throws(
    () => canonicalizeRequirements(requirements),
    /requirements exceed canonicalization limits/u,
  );
  assert.equal(descriptorRead, false);
});

test("rejects oversized array index keys before numeric conversion", () => {
  const oversizedIndex = "9".repeat(128 * 1024);
  const items = new Proxy(
    [],
    {
      ownKeys() {
        return [oversizedIndex, "length"];
      },
    },
  );
  const originalNumber = globalThis.Number;
  const sentinel = new Error("unbounded numeric conversion");
  const guardedNumber = (value) => {
    if (typeof value === "string" && value.length > 1024) {
      throw sentinel;
    }

    return originalNumber(value);
  };

  guardedNumber.isSafeInteger = originalNumber.isSafeInteger;
  globalThis.Number = guardedNumber;
  try {
    assert.throws(
      () => canonicalizeRequirements({ items }),
      (error) => {
        assert.notEqual(error, sentinel);
        return (
          error instanceof TypeError &&
          error.message === "requirements must be a safe JSON object"
        );
      },
    );
  } finally {
    globalThis.Number = originalNumber;
  }
});

test("snapshots requirements in reflected order before sorted canonical emission", () => {
  const later = { state: "before" };
  const earlier = new Proxy(
    { kind: true },
    {
      ownKeys(target) {
        later.state = "after";
        return Reflect.ownKeys(target);
      },
    },
  );

  assert.equal(
    canonicalizeRequirements({ later, earlier }),
    '{"earlier":{"kind":true},"later":{"state":"before"}}',
  );
  assert.equal(later.state, "after");
});

test("snapshots object descriptor side effects before later descriptors", () => {
  const earlier = { state: "before" };
  const root = new Proxy(
    { earlier, later: { state: "later" } },
    {
      getOwnPropertyDescriptor(target, key) {
        if (key === "later") {
          earlier.state = "after";
        }

        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );

  assert.equal(
    canonicalizeRequirements(root),
    '{"earlier":{"state":"before"},"later":{"state":"later"}}',
  );
  assert.equal(earlier.state, "after");
});

test("snapshots array descriptor side effects before later item descriptors", () => {
  const earlier = { state: "before" };
  const items = new Proxy(
    [earlier, { state: "later" }],
    {
      getOwnPropertyDescriptor(target, key) {
        if (key === "1") {
          earlier.state = "after";
        }

        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );

  assert.equal(
    canonicalizeRequirements({ items }),
    '{"items":[{"state":"before"},{"state":"later"}]}',
  );
  assert.equal(earlier.state, "after");
});

test("snapshots array items before later length descriptor side effects", () => {
  const earlier = { state: "before" };
  const items = new Proxy(
    [earlier, { state: "later" }],
    {
      getOwnPropertyDescriptor(target, key) {
        if (key === "length") {
          earlier.state = "after";
        }

        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );

  assert.equal(
    canonicalizeRequirements({ items }),
    '{"items":[{"state":"before"},{"state":"later"}]}',
  );
  assert.equal(earlier.state, "after");
});

test("binds M16 allocation facts to complete requirements, strict expiry, and an immutable quote", async () => {
  const requirements = {
    x402Version: 2,
    payment: { amount: "20", asset: "tinybar" },
  };
  const quote = await createOfferingRequirementsQuote(validTerms(), {
    expectedTermsVersion: "offering-v1",
    requestedUnits: noteUnits("2"),
    confirmedAllocatedUnits: noteUnits("3"),
    requirements,
    expiresAt: "2026-09-06T18:00:00.000Z",
  });
  const quoteSnapshot = { ...quote };

  assert.equal(quote.termsVersion, "offering-v1");
  assert.equal(quote.requestedUnits, 2n);
  assert.equal(quote.paymentTinybars, 20n);
  assert.equal(quote.remainingCapacityUnits, 5n);
  assert.equal(Object.isFrozen(quote), true);
  assert.deepEqual(Reflect.ownKeys(quote).sort(), [
    "expiresAt",
    "paymentTinybars",
    "remainingCapacityUnits",
    "requestedUnits",
    "requirementsDigest",
    "termsVersion",
  ]);
  assert.equal(
    await matchesQuotedRequirements(quote, {
      payment: { asset: "tinybar", amount: "20" },
      x402Version: 2,
    }),
    true,
  );
  assert.equal(
    await matchesQuotedRequirements(quote, {
      x402Version: 2,
      payment: { amount: "21", asset: "tinybar" },
    }),
    false,
  );
  assert.equal(
    await matchesQuotedRequirements(quote, {
      x402Version: 2,
      payment: { amount: "20", asset: "tinybar" },
      extension: { trial: true },
    }),
    false,
  );
  assert.equal(
    isOfferingRequirementsQuoteActive(quote, "2026-09-06T17:59:59.999Z"),
    true,
  );
  assert.equal(
    isOfferingRequirementsQuoteActive(quote, "2026-09-06T18:00:00.000Z"),
    false,
  );
  assert.throws(() =>
    isOfferingRequirementsQuoteActive(quote, "2026-09-06T18:00:00Z"),
  );
  await assert.rejects(() =>
    createOfferingRequirementsQuote(validTerms(), {
      expectedTermsVersion: "offering-v1",
      requestedUnits: noteUnits("2"),
      confirmedAllocatedUnits: noteUnits("3"),
      requirements,
      expiresAt: "2026-09-06T18:00:00Z",
    }),
  );

  requirements.payment.amount = "21";
  Object.freeze(requirements.payment);
  Object.freeze(requirements);
  assert.deepEqual(quote, quoteSnapshot);
  assert.equal(await matchesQuotedRequirements(quote, requirements), false);
});

test("snapshots the canonical expiry before requirements hashing awaits", async () => {
  const quoteInput = {
    expectedTermsVersion: "offering-v1",
    requestedUnits: noteUnits("2"),
    confirmedAllocatedUnits: noteUnits("3"),
    requirements: {
      x402Version: 2,
      payment: { amount: "20", asset: "tinybar" },
    },
    expiresAt: "2026-09-06T18:00:00.000Z",
  };

  const quotePromise = createOfferingRequirementsQuote(validTerms(), quoteInput);
  quoteInput.expiresAt = "2026-09-06T19:00:00.000Z";

  const quote = await quotePromise;
  assert.equal(quote.expiresAt, "2026-09-06T18:00:00.000Z");
});
