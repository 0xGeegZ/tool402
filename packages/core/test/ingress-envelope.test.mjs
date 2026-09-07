import assert from "node:assert/strict";
import test from "node:test";

import { parseIngressEnvelope } from "@tool402/core";

const validInput = () => ({
  keyId: "key-A",
  timestampUnixSeconds: "1735689600",
  requestNonce: "AbCdEfGhIjKlMnOpQrStUv",
  bodySha256: "a".repeat(64),
  signature: "B".repeat(43),
});

function assertTypeError(action) {
  assert.throws(action, TypeError);
}

test("parses, detaches, and freezes the fixed ingress envelope", () => {
  const input = validInput();
  const envelope = parseIngressEnvelope(input);

  assert.deepEqual(envelope, {
    keyId: "key-A",
    timestampUnixSeconds: 1735689600n,
    requestNonce: "AbCdEfGhIjKlMnOpQrStUv",
    bodySha256: "a".repeat(64),
    signature: "B".repeat(43),
    method: "POST",
    path: "/internal/commands",
    signingInput:
      "POST\n/internal/commands\n1735689600\nAbCdEfGhIjKlMnOpQrStUv\n" +
      "a".repeat(64),
    replayIdentity: "key-A:AbCdEfGhIjKlMnOpQrStUv",
  });
  assert.deepEqual(Object.keys(envelope), [
    "keyId",
    "timestampUnixSeconds",
    "requestNonce",
    "bodySha256",
    "signature",
    "method",
    "path",
    "signingInput",
    "replayIdentity",
  ]);
  assert.equal(Object.isFrozen(envelope), true);
  assert.equal(Object.getPrototypeOf(envelope), Object.prototype);

  input.keyId = "changed";
  input.timestampUnixSeconds = "0";
  input.requestNonce = "Z".repeat(22);
  input.bodySha256 = "b".repeat(64);
  input.signature = "C".repeat(43);
  assert.equal(envelope.keyId, "key-A");
  assert.equal(envelope.timestampUnixSeconds, 1735689600n);
  assert.equal(envelope.requestNonce, "AbCdEfGhIjKlMnOpQrStUv");
  assert.equal(envelope.bodySha256, "a".repeat(64));
  assert.equal(envelope.signature, "B".repeat(43));
});

test("rejects every non-closed input shape as a TypeError", () => {
  const missing = validInput();
  delete missing.signature;
  const extra = { ...validInput(), extra: "not allowed" };
  const symbol = validInput();
  symbol[Symbol("not allowed")] = "not allowed";
  const nonenumerable = validInput();
  Object.defineProperty(nonenumerable, "hidden", { value: "not allowed" });
  const inherited = Object.create({ inherited: "not allowed" });
  Object.assign(inherited, validInput());
  const customPrototype = Object.assign(Object.create(null), validInput());

  for (const malformed of [
    null,
    undefined,
    "not an object",
    [],
    missing,
    extra,
    symbol,
    nonenumerable,
    inherited,
    customPrototype,
  ]) {
    assertTypeError(() => parseIngressEnvelope(malformed));
  }
});

test("rejects accessor and reflection-hostile records without executing accessors", () => {
  let getterRead = false;
  const accessor = validInput();
  Object.defineProperty(accessor, "keyId", {
    enumerable: true,
    get() {
      getterRead = true;
      return "key-A";
    },
  });
  assertTypeError(() => parseIngressEnvelope(accessor));
  assert.equal(getterRead, false);

  const ownKeysFailure = new Proxy(validInput(), {
    ownKeys() {
      throw new Error("reflection failed");
    },
  });
  const descriptorFailure = new Proxy(validInput(), {
    getOwnPropertyDescriptor() {
      throw new Error("reflection failed");
    },
  });
  const prototypeFailure = new Proxy(validInput(), {
    getPrototypeOf() {
      throw new Error("reflection failed");
    },
  });

  for (const malformed of [ownKeysFailure, descriptorFailure, prototypeFailure]) {
    assertTypeError(() => parseIngressEnvelope(malformed));
  }
});

test("rejects malformed field values as TypeErrors", () => {
  const invalidKeyIds = ["", "a".repeat(65), "with space", "key:id", "é"];
  const invalidNonces = ["A".repeat(21), "A".repeat(23), "A".repeat(21) + "+", "A".repeat(21) + "="];
  const invalidDigests = ["A".repeat(64), "a".repeat(63), "a".repeat(63) + "g"];
  const invalidSignatures = ["B".repeat(42), "B".repeat(44), "B".repeat(42) + "+", "B".repeat(42) + "="];
  const invalidTimestamps = [
    "-1",
    "00",
    "01735689600",
    "18446744073709551616",
    "9223372036854775808",
    "not-a-number",
  ];

  for (const keyId of invalidKeyIds) {
    assertTypeError(() => parseIngressEnvelope({ ...validInput(), keyId }));
  }
  for (const requestNonce of invalidNonces) {
    assertTypeError(() => parseIngressEnvelope({ ...validInput(), requestNonce }));
  }
  for (const bodySha256 of invalidDigests) {
    assertTypeError(() => parseIngressEnvelope({ ...validInput(), bodySha256 }));
  }
  for (const signature of invalidSignatures) {
    assertTypeError(() => parseIngressEnvelope({ ...validInput(), signature }));
  }
  for (const timestampUnixSeconds of invalidTimestamps) {
    assertTypeError(() =>
      parseIngressEnvelope({ ...validInput(), timestampUnixSeconds }),
    );
  }

  for (const field of [
    "keyId",
    "timestampUnixSeconds",
    "requestNonce",
    "bodySha256",
    "signature",
  ]) {
    assertTypeError(() => parseIngressEnvelope({ ...validInput(), [field]: 1 }));
  }
});
