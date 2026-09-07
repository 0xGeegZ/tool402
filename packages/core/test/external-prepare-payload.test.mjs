import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const payloadModuleUrl = new URL(
  "../src/external-prepare-payload.ts",
  import.meta.url,
);
const payloadModulePath = fileURLToPath(payloadModuleUrl);
const payloadModuleExists = existsSync(payloadModulePath);

const operationKinds = [
  "ATS_CREATE",
  "ATS_CONTROL_LIST",
  "ATS_ISSUE",
  "ATS_TRANSFER",
  "ATS_COUPON",
  "HEDERA_FUNDING",
];
const fields = [
  "operationKind",
  "subjectPublicId",
  "network",
  "chainId",
  "expectedTarget",
  "canonicalParametersHash",
  "idempotencyKey",
  "expiresAt",
];
const validEvmAddress = `0x${"a".repeat(40)}`;
const validHederaAccountId = "0.0.123";
const validHash = "a".repeat(64);
const validIdempotencyKey = `${"A".repeat(21)}A`;
const validExpiry = "2026-09-07T00:00:00.000Z";

function validPayload(overrides = {}) {
  return {
    operationKind: "ATS_CREATE",
    subjectPublicId: "subject_42",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: validEvmAddress,
    canonicalParametersHash: validHash,
    idempotencyKey: validIdempotencyKey,
    expiresAt: validExpiry,
    ...overrides,
  };
}

async function loadParser() {
  return import(payloadModuleUrl.href);
}

function assertTypeError(action) {
  assert.throws(action, TypeError);
}

test("parses one exact external-prepare payload into a frozen detached value", async () => {
  const { parseExternalPreparePayload } = await loadParser();
  const input = validPayload();
  const parsed = parseExternalPreparePayload(input);

  assert.deepEqual(parsed, validPayload());
  assert.notEqual(parsed, input);
  assert.deepEqual(Reflect.ownKeys(parsed), fields);
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
  assert.equal(Object.isFrozen(parsed), true);
  assert.throws(() => {
    parsed.operationKind = "ATS_ISSUE";
  }, TypeError);

  input.operationKind = "HEDERA_FUNDING";
  input.subjectPublicId = "mutated";
  input.network = "hedera:mainnet";
  input.chainId = 295;
  input.expectedTarget = validHederaAccountId;
  input.canonicalParametersHash = "b".repeat(64);
  input.idempotencyKey = `${"B".repeat(21)}Q`;
  input.expiresAt = "2030-01-01T00:00:00.000Z";

  assert.deepEqual(parsed, validPayload());

  const frozenInput = Object.freeze(validPayload({ subjectPublicId: "frozen" }));
  const parsedFrozenInput = parseExternalPreparePayload(frozenInput);
  assert.notEqual(parsedFrozenInput, frozenInput);
  assert.deepEqual(parsedFrozenInput, frozenInput);
  assert.equal(Object.isFrozen(parsedFrozenInput), true);
});

test("accepts every closed operation kind and both accepted target syntaxes", async () => {
  const { parseExternalPreparePayload } = await loadParser();

  for (const operationKind of operationKinds) {
    const parsed = parseExternalPreparePayload(validPayload({ operationKind }));
    assert.equal(parsed.operationKind, operationKind);
  }

  for (const expectedTarget of [validEvmAddress, validHederaAccountId]) {
    const parsed = parseExternalPreparePayload(validPayload({ expectedTarget }));
    assert.equal(parsed.expectedTarget, expectedTarget);
  }
});

test("accepts the full public identifier grammar including leading underscores and hyphens", async () => {
  const { parseExternalPreparePayload } = await loadParser();

  for (const subjectPublicId of [
    "_leading_underscore",
    "-leading-hyphen",
    "A",
    "A".repeat(96),
  ]) {
    const parsed = parseExternalPreparePayload(validPayload({ subjectPublicId }));
    assert.equal(parsed.subjectPublicId, subjectPublicId);
  }
});

test("requires exactly eight own enumerable data fields on an ordinary record", async () => {
  const { parseExternalPreparePayload } = await loadParser();
  const missing = validPayload();
  delete missing.operationKind;
  const extra = validPayload({ unexpected: true });
  const symbol = validPayload();
  symbol[Symbol("unexpected")] = true;
  const nonenumerableRequired = validPayload();
  Object.defineProperty(nonenumerableRequired, "operationKind", {
    value: "ATS_CREATE",
    enumerable: false,
  });
  const nonenumerableExtra = validPayload();
  Object.defineProperty(nonenumerableExtra, "hidden", {
    value: true,
  });
  const inherited = Object.assign(
    Object.create({ operationKind: "ATS_CREATE" }),
    validPayload(),
  );
  delete inherited.operationKind;
  const customPrototype = Object.assign(Object.create(null), validPayload());

  for (const malformed of [
    null,
    undefined,
    "not a record",
    [],
    missing,
    extra,
    symbol,
    nonenumerableRequired,
    nonenumerableExtra,
    inherited,
    customPrototype,
  ]) {
    assertTypeError(() => parseExternalPreparePayload(malformed));
  }
});

test("uses descriptor capture and fails closed without invoking caller accessors", async () => {
  const { parseExternalPreparePayload } = await loadParser();
  let getterReads = 0;
  const accessorBacked = validPayload();
  Object.defineProperty(accessorBacked, "subjectPublicId", {
    enumerable: true,
    get() {
      getterReads += 1;
      throw new Error("caller accessor must not run");
    },
  });

  assertTypeError(() => parseExternalPreparePayload(accessorBacked));
  assert.equal(getterReads, 0);

  const descriptorOnly = new Proxy(validPayload(), {
    get() {
      throw new Error("direct field reads must not run");
    },
  });
  assert.deepEqual(parseExternalPreparePayload(descriptorOnly), validPayload());

  const ownKeysFailure = new Proxy(validPayload(), {
    ownKeys() {
      throw new Error("own-key reflection failed");
    },
  });
  const descriptorFailure = new Proxy(validPayload(), {
    getOwnPropertyDescriptor() {
      throw new Error("descriptor reflection failed");
    },
  });
  const prototypeFailure = new Proxy(validPayload(), {
    getPrototypeOf() {
      throw new Error("prototype reflection failed");
    },
  });

  for (const malformed of [
    ownKeysFailure,
    descriptorFailure,
    prototypeFailure,
  ]) {
    assertTypeError(() => parseExternalPreparePayload(malformed));
  }
});

test("rejects every noncanonical field literal and primitive type", async () => {
  const { parseExternalPreparePayload } = await loadParser();

  for (const operationKind of ["", "ats_create", "ATS_UNKNOWN", 1, null]) {
    assertTypeError(() =>
      parseExternalPreparePayload(validPayload({ operationKind })),
    );
  }
  for (const subjectPublicId of [
    "",
    "A".repeat(97),
    "contains.period",
    "contains:colon",
    "contains space",
    "é",
    1,
  ]) {
    assertTypeError(() =>
      parseExternalPreparePayload(validPayload({ subjectPublicId })),
    );
  }
  for (const network of ["hedera:mainnet", "HEDERA:TESTNET", "testnet", 1]) {
    assertTypeError(() => parseExternalPreparePayload(validPayload({ network })));
  }
  for (const chainId of [295, 297, "296", 296n, null]) {
    assertTypeError(() => parseExternalPreparePayload(validPayload({ chainId })));
  }
});

test("rejects malformed or mixed-case expected targets", async () => {
  const { parseExternalPreparePayload } = await loadParser();

  for (const expectedTarget of [
    `0x${"a".repeat(39)}`,
    `0x${"a".repeat(39)}A`,
    `0x${"g".repeat(40)}`,
    `0X${"a".repeat(40)}`,
    "00.0.123",
    "0.00.123",
    "0.0.0123",
    "0.0.123.0",
    "0.0.-123",
    "hedera:testnet:0.0.123",
    "",
    1,
  ]) {
    assertTypeError(() =>
      parseExternalPreparePayload(validPayload({ expectedTarget })),
    );
  }
});

test("requires an algorithm-neutral lower-case hexadecimal parameters hash", async () => {
  const { parseExternalPreparePayload } = await loadParser();

  for (const canonicalParametersHash of [
    "A".repeat(64),
    "a".repeat(63),
    "a".repeat(65),
    `${"a".repeat(63)}g`,
    `0x${"a".repeat(64)}`,
    1,
  ]) {
    assertTypeError(() =>
      parseExternalPreparePayload(validPayload({ canonicalParametersHash })),
    );
  }
});

test("requires a canonical 16-byte base64url idempotency key without claiming it", async () => {
  const { parseExternalPreparePayload } = await loadParser();

  for (const tail of ["A", "Q", "g", "w"]) {
    const idempotencyKey = `${"A".repeat(21)}${tail}`;
    const parsed = parseExternalPreparePayload(validPayload({ idempotencyKey }));
    assert.equal(parsed.idempotencyKey, idempotencyKey);
  }

  for (const idempotencyKey of [
    "A".repeat(21),
    "A".repeat(23),
    `${"A".repeat(21)}B`,
    `${"A".repeat(21)}+`,
    `${"A".repeat(21)}=`,
    1,
  ]) {
    assertTypeError(() =>
      parseExternalPreparePayload(validPayload({ idempotencyKey })),
    );
  }

  const repeatedInput = validPayload();
  const first = parseExternalPreparePayload(repeatedInput);
  const second = parseExternalPreparePayload(repeatedInput);
  assert.notEqual(first, second);
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(second), true);
});

test("requires a real canonical UTC-millisecond declared expiry without reading a clock", async () => {
  const { parseExternalPreparePayload } = await loadParser();
  const leapDayExpiry = "2024-02-29T12:34:56.789Z";
  assert.equal(
    parseExternalPreparePayload(validPayload({ expiresAt: leapDayExpiry })).expiresAt,
    leapDayExpiry,
  );

  for (const expiresAt of [
    "2026-02-29T00:00:00.000Z",
    "2026-13-01T00:00:00.000Z",
    "2026-09-07T00:00:00Z",
    "2026-09-07T00:00:00.000+00:00",
    "2026-09-07 00:00:00.000Z",
    "2026-9-07T00:00:00.000Z",
    new Date(validExpiry),
    1,
  ]) {
    assertTypeError(() => parseExternalPreparePayload(validPayload({ expiresAt })));
  }
});

test("keeps the future parser free of runtime adapters and exposes it through the public barrel", async (t) => {
  if (!payloadModuleExists) {
    t.skip("static parser checks begin with the implementation task");
    return;
  }

  const source = await readFile(payloadModulePath, "utf8");
  for (const prohibited of [
    /\bJSON\.parse\b/u,
    /\bprocess\.env\b/u,
    /\bfetch\s*\(/u,
    /\bDate\.now\b/u,
    /\bsetTimeout\b/u,
    /from\s+["'][^"']*convex[^"']*["']/iu,
    /from\s+["'][^"']*(?:storage|database)[^"']*["']/iu,
    /from\s+["'][^"']*(?:ats|provider)[^"']*["']/iu,
  ]) {
    assert.doesNotMatch(source, prohibited);
  }

  const sourceApi = await loadParser();
  const publicApi = await import("@tool402/core");
  assert.equal(
    publicApi.parseExternalPreparePayload,
    sourceApi.parseExternalPreparePayload,
  );
});
