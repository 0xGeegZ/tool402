import assert from "node:assert/strict";
import test from "node:test";

import { parseOfferingDefinition } from "@tool402/core";

const validTerms = {
  version: "offering-v1",
  fundingTargetTinybars: "200",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "10",
  minimumPurchaseUnits: "1",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "300",
};

function validDefinition(overrides = {}) {
  return {
    schemaVersion: 1,
    terms: { ...validTerms },
    maturityAt: "2026-12-31T00:00:00.000Z",
    qualifyingResource: "riskscan.quick",
    ...overrides,
  };
}

function assertDefinitionInputError(input) {
  assert.throws(
    () => parseOfferingDefinition(input),
    (error) => error instanceof RangeError || error instanceof TypeError,
  );
}

function withPrototype(prototype, values) {
  return Object.assign(Object.create(prototype), values);
}

function oversizedInteger() {
  return `2${"0".repeat(96)}`;
}

function oversizedPayoutCapInput() {
  return validDefinition({
    terms: {
      ...validTerms,
      fundingTargetTinybars: `8${"0".repeat(95)}`,
      payoutCapTinybars: `12${"0".repeat(95)}`,
    },
  });
}

test("parses one exact offering definition into a frozen detached local value", () => {
  const input = validDefinition();
  const parsed = parseOfferingDefinition(input);

  assert.deepEqual(parsed, {
    schemaVersion: 1,
    terms: {
      version: "offering-v1",
      fundingTargetTinybars: 200n,
      noteUnitPriceTinybars: 10n,
      maximumNoteUnits: 10n,
      minimumPurchaseUnits: 1n,
      reserveShareBps: 2000n,
      issuerShareBps: 8000n,
      platformFeeBps: 0n,
      payoutCapTinybars: 300n,
    },
    maturityAt: "2026-12-31T00:00:00.000Z",
    qualifyingResource: "riskscan.quick",
  });
  assert.deepEqual(Object.keys(parsed).sort(), [
    "maturityAt",
    "qualifyingResource",
    "schemaVersion",
    "terms",
  ]);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.terms), true);

  input.terms.version = "mutated-v2";
  input.terms.fundingTargetTinybars = "2";
  input.maturityAt = "2030-01-01T00:00:00.000Z";
  input.qualifyingResource = "mutated.resource";

  assert.equal(parsed.terms.version, "offering-v1");
  assert.equal(parsed.terms.fundingTargetTinybars, 200n);
  assert.equal(parsed.maturityAt, "2026-12-31T00:00:00.000Z");
  assert.equal(parsed.qualifyingResource, "riskscan.quick");
});

test("requires the exact root shape and supplies no defaults", () => {
  const missingSchemaVersion = validDefinition();
  delete missingSchemaVersion.schemaVersion;
  const missingTerms = validDefinition();
  delete missingTerms.terms;
  const missingMaturityAt = validDefinition();
  delete missingMaturityAt.maturityAt;
  const missingResource = validDefinition();
  delete missingResource.qualifyingResource;
  const nonEnumerableRequired = validDefinition();
  Object.defineProperty(nonEnumerableRequired, "schemaVersion", {
    enumerable: false,
  });
  const nonEnumerableExtra = Object.defineProperty(validDefinition(), "hidden", {
    value: true,
  });
  const symbolExtra = validDefinition();
  symbolExtra[Symbol("internal")] = true;
  const inheritedSchemaVersion = withPrototype(
    { schemaVersion: 1 },
    (() => {
      const definition = validDefinition();
      delete definition.schemaVersion;
      return definition;
    })(),
  );

  for (const malformed of [
    null,
    [],
    validDefinition({ schemaVersion: undefined }),
    validDefinition({ schemaVersion: 0 }),
    validDefinition({ schemaVersion: 2 }),
    validDefinition({ schemaVersion: "1" }),
    validDefinition({ schemaVersion: 1n }),
    validDefinition({ schemaVersion: new Number(1) }),
    validDefinition({ unexpected: true }),
    missingSchemaVersion,
    missingTerms,
    missingMaturityAt,
    missingResource,
    nonEnumerableRequired,
    nonEnumerableExtra,
    symbolExtra,
    inheritedSchemaVersion,
    withPrototype(null, validDefinition()),
    withPrototype({ inherited: true }, validDefinition()),
  ]) {
    assertDefinitionInputError(malformed);
  }
});

test("requires an exact nested terms shape without invoking accessors", () => {
  const missingTermsVersion = validDefinition();
  delete missingTermsVersion.terms.version;
  const nonEnumerableTerm = validDefinition();
  Object.defineProperty(nonEnumerableTerm.terms, "version", {
    enumerable: false,
  });
  const nonEnumerableExtra = validDefinition();
  Object.defineProperty(nonEnumerableExtra.terms, "hidden", { value: true });
  const symbolExtra = validDefinition();
  symbolExtra.terms[Symbol("internal")] = true;
  const inheritedTerms = validDefinition({
    terms: withPrototype({ version: "offering-v1" }, (() => {
      const terms = { ...validTerms };
      delete terms.version;
      return terms;
    })()),
  });
  const wrongTermsPrototype = validDefinition({
    terms: withPrototype(null, validTerms),
  });

  for (const malformed of [
    validDefinition({ terms: null }),
    validDefinition({ terms: [] }),
    validDefinition({ terms: { ...validTerms, unexpected: true } }),
    missingTermsVersion,
    nonEnumerableTerm,
    nonEnumerableExtra,
    symbolExtra,
    inheritedTerms,
    wrongTermsPrototype,
  ]) {
    assertDefinitionInputError(malformed);
  }

  let rootGetterCalls = 0;
  const rootAccessor = validDefinition();
  Object.defineProperty(rootAccessor, "qualifyingResource", {
    enumerable: true,
    get() {
      rootGetterCalls += 1;
      return "must-not-run";
    },
  });
  assertDefinitionInputError(rootAccessor);
  assert.equal(rootGetterCalls, 0);

  let termsGetterCalls = 0;
  const termsAccessor = validDefinition();
  Object.defineProperty(termsAccessor.terms, "fundingTargetTinybars", {
    enumerable: true,
    get() {
      termsGetterCalls += 1;
      return "must-not-run";
    },
  });
  assertDefinitionInputError(termsAccessor);
  assert.equal(termsGetterCalls, 0);
});

test("uses descriptor capture and fails closed on hostile record reflection", () => {
  const noDirectReads = {
    get() {
      throw new Error("direct property reads are prohibited");
    },
  };
  const descriptorOnlyDefinition = new Proxy(
    validDefinition({
      terms: new Proxy({ ...validTerms }, noDirectReads),
    }),
    noDirectReads,
  );
  assert.deepEqual(parseOfferingDefinition(descriptorOnlyDefinition), {
    schemaVersion: 1,
    terms: {
      version: "offering-v1",
      fundingTargetTinybars: 200n,
      noteUnitPriceTinybars: 10n,
      maximumNoteUnits: 10n,
      minimumPurchaseUnits: 1n,
      reserveShareBps: 2000n,
      issuerShareBps: 8000n,
      platformFeeBps: 0n,
      payoutCapTinybars: 300n,
    },
    maturityAt: "2026-12-31T00:00:00.000Z",
    qualifyingResource: "riskscan.quick",
  });

  const prototypeFailure = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw new Error("prototype reflection failed");
      },
    },
  );
  const keysFailure = new Proxy(validDefinition(), {
    ownKeys() {
      throw new Error("key reflection failed");
    },
  });
  const descriptorFailure = new Proxy(validDefinition(), {
    getOwnPropertyDescriptor() {
      throw new Error("descriptor reflection failed");
    },
  });
  const disappearingDescriptor = new Proxy(validDefinition(), {
    getOwnPropertyDescriptor(target, key) {
      return key === "terms" ? undefined : Reflect.getOwnPropertyDescriptor(target, key);
    },
  });

  for (const malformed of [
    prototypeFailure,
    keysFailure,
    descriptorFailure,
    disappearingDescriptor,
  ]) {
    assertDefinitionInputError(malformed);
  }
});

test("enforces bounded canonical metadata and terms text before economics", () => {
  const exactVersion = "v".repeat(96);
  const exactResource = "r".repeat(256);
  const exactBoundDefinition = parseOfferingDefinition(
    validDefinition({
      terms: { ...validTerms, version: exactVersion },
      qualifyingResource: exactResource,
    }),
  );
  assert.equal(exactBoundDefinition.terms.version, exactVersion);
  assert.equal(exactBoundDefinition.qualifyingResource, exactResource);

  const oversizedTerms = [
    "version",
    "fundingTargetTinybars",
    "noteUnitPriceTinybars",
    "maximumNoteUnits",
    "minimumPurchaseUnits",
    "reserveShareBps",
    "issuerShareBps",
    "platformFeeBps",
    "payoutCapTinybars",
  ];
  const validOversizedInteger = oversizedInteger();

  for (const field of oversizedTerms) {
    const terms = { ...validTerms, [field]: "1".repeat(97) };
    assertDefinitionInputError(validDefinition({ terms }));
  }

  assertDefinitionInputError(
    validDefinition({
      terms: {
        ...validTerms,
        fundingTargetTinybars: validOversizedInteger,
        payoutCapTinybars: `3${"0".repeat(96)}`,
      },
    }),
  );
  assertDefinitionInputError(
    validDefinition({
      terms: {
        ...validTerms,
        noteUnitPriceTinybars: validOversizedInteger,
        fundingTargetTinybars: validOversizedInteger,
        maximumNoteUnits: "1",
        minimumPurchaseUnits: "1",
        payoutCapTinybars: `3${"0".repeat(96)}`,
      },
    }),
  );
  assertDefinitionInputError(
    validDefinition({
      terms: {
        ...validTerms,
        maximumNoteUnits: `1${"0".repeat(96)}`,
        noteUnitPriceTinybars: "1",
        fundingTargetTinybars: validOversizedInteger,
        payoutCapTinybars: `3${"0".repeat(96)}`,
      },
    }),
  );
  assertDefinitionInputError(
    validDefinition({
      terms: {
        ...validTerms,
        maximumNoteUnits: `1${"0".repeat(96)}`,
        minimumPurchaseUnits: `1${"0".repeat(96)}`,
        noteUnitPriceTinybars: "1",
        fundingTargetTinybars: validOversizedInteger,
        payoutCapTinybars: `3${"0".repeat(96)}`,
      },
    }),
  );
  assertDefinitionInputError(oversizedPayoutCapInput());
  assertDefinitionInputError(
    validDefinition({ terms: { ...validTerms, version: "v".repeat(97) } }),
  );
  assertDefinitionInputError(
    validDefinition({ qualifyingResource: "r".repeat(257) }),
  );

  for (const malformed of [
    validDefinition({ qualifyingResource: " resource" }),
    validDefinition({ qualifyingResource: "resource " }),
    validDefinition({ qualifyingResource: "   " }),
    validDefinition({ terms: { ...validTerms, version: " version" } }),
    validDefinition({ terms: { ...validTerms, version: "version " } }),
    validDefinition({ terms: { ...validTerms, version: new String("version") } }),
    validDefinition({ terms: { ...validTerms, fundingTargetTinybars: 200 } }),
    validDefinition({ terms: { ...validTerms, fundingTargetTinybars: "0200" } }),
    validDefinition({ terms: { ...validTerms, noteUnitPriceTinybars: "1.5" } }),
    validDefinition({ terms: { ...validTerms, maximumNoteUnits: " 10" } }),
    validDefinition({ terms: { ...validTerms, reserveShareBps: "2001" } }),
    validDefinition({ terms: { ...validTerms, issuerShareBps: "7999" } }),
    validDefinition({ terms: { ...validTerms, platformFeeBps: "1" } }),
    validDefinition({ terms: { ...validTerms, payoutCapTinybars: "299" } }),
  ]) {
    assertDefinitionInputError(malformed);
  }
});

test("requires a real canonical UTC maturity instant without reading a clock", () => {
  assert.deepEqual(
    parseOfferingDefinition(
      validDefinition({ maturityAt: "2028-02-29T23:59:59.999Z" }),
    ).maturityAt,
    "2028-02-29T23:59:59.999Z",
  );

  for (const maturityAt of [
    "",
    "2026-12-31T00:00:00Z",
    "2026-12-31T00:00:00.000+00:00",
    "2026-12-31T00:00:00.000z",
    "2026-02-29T00:00:00.000Z",
    "2026-04-31T00:00:00.000Z",
    "2026-13-01T00:00:00.000Z",
    "not-a-date",
    new String("2026-12-31T00:00:00.000Z"),
  ]) {
    assertDefinitionInputError(validDefinition({ maturityAt }));
  }
});
