import {
  parseBasisPoints,
  parseHederaAccountId,
  parseHederaTransactionId,
  parseNoteUnits,
  parseTinybar,
} from "../src/index.ts";
import type {
  BasisPoints,
  HederaAccountId,
  HederaTransactionId,
  NoteUnits,
  Tinybar,
} from "../src/index.ts";

declare const tinybar: Tinybar;
declare const basisPoints: BasisPoints;
declare const noteUnits: NoteUnits;
declare const accountId: HederaAccountId;
declare const transactionId: HederaTransactionId;

const parsedTinybar: Tinybar | undefined = parseTinybar("9007199254740993");
const parsedBasisPoints: BasisPoints | undefined = parseBasisPoints("10000");
const parsedNoteUnits: NoteUnits | undefined = parseNoteUnits("0");
const parsedAccountId: HederaAccountId | undefined = parseHederaAccountId("0.0.123");
const parsedTransactionId: HederaTransactionId | undefined = parseHederaTransactionId(
  "0.0.123@1700000000.123456789",
);

// @ts-expect-error Tinybar and NoteUnits are distinct public brands.
const tinybarAsNoteUnits: NoteUnits = tinybar;
// @ts-expect-error BasisPoints and Tinybar are distinct public brands.
const basisPointsAsTinybar: Tinybar = basisPoints;
// @ts-expect-error NoteUnits and Tinybar are distinct public brands.
const noteUnitsAsTinybar: Tinybar = noteUnits;
// @ts-expect-error Account and transaction identifiers are distinct public brands.
const accountIdAsTransactionId: HederaTransactionId = accountId;
// @ts-expect-error Transaction and account identifiers are distinct public brands.
const transactionIdAsAccountId: HederaAccountId = transactionId;
