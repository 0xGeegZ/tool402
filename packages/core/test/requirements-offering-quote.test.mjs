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
