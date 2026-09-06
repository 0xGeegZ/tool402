import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBasisPoints,
  parseHederaAccountId,
  parseHederaTransactionId,
  parseNoteUnits,
  parseTinybar,
} from "../src/index.ts";

const integerParsers = [parseTinybar, parseBasisPoints, parseNoteUnits];

test("parses exact canonical core values through the public entry point", () => {
  assert.equal(parseTinybar("9007199254740993"), 9007199254740993n);
  assert.equal(parseNoteUnits("0"), 0n);
  assert.equal(parseBasisPoints("10000"), 10000n);
});

test("rejects noncanonical and non-string integer inputs", () => {
  for (const parser of integerParsers) {
    for (const input of ["01", "-1", "1.5", "1e3", " 1 ", 0, null, {}]) {
      assert.equal(parser(input), undefined);
    }
  }

  assert.equal(parseBasisPoints("10001"), undefined);
});

test("parses canonical Hedera account identifiers", () => {
  assert.equal(parseHederaAccountId("0.0.123"), "0.0.123");
});

test("parses zero-, one-, and nine-digit canonical transaction nanoseconds", () => {
  assert.equal(
    parseHederaTransactionId("0.0.123@1700000000.0"),
    "0.0.123@1700000000.0",
  );
  assert.equal(
    parseHederaTransactionId("0.0.123@1700000000.1"),
    "0.0.123@1700000000.1",
  );
  assert.equal(
    parseHederaTransactionId("0.0.123@1700000000.123456789"),
    "0.0.123@1700000000.123456789",
  );
});

test("rejects non-ASCII digits in exact values and identifiers", () => {
  for (const parser of integerParsers) {
    for (const input of ["١", "１"]) {
      assert.equal(parser(input), undefined);
    }
  }

  for (const input of ["٠.٠.١٢٣", "０.０.１２３"]) {
    assert.equal(parseHederaAccountId(input), undefined);
    assert.equal(parseHederaTransactionId(`${input}@1.1`), undefined);
  }
});

test("rejects malformed Hedera identifiers", () => {
  for (const input of ["01.0.123", "0.0", "0.0.123.4", "0.0.-1", 0, null, {}]) {
    assert.equal(parseHederaAccountId(input), undefined);
  }

  for (const input of [
    "0.0.123@01.1",
    "0.0.123@1.01",
    "0.0.123@1.1234567890",
    "0.0.123@1.1.1",
    "01.0.123@1.1",
    "0.0.123@-1.1",
    0,
    null,
    {},
  ]) {
    assert.equal(parseHederaTransactionId(input), undefined);
  }
});
