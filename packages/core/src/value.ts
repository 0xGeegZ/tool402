export type Tinybar = bigint & { readonly __brand: "Tinybar" };
export type BasisPoints = bigint & { readonly __brand: "BasisPoints" };
export type NoteUnits = bigint & { readonly __brand: "NoteUnits" };
export type HederaAccountId = string & {
  readonly __brand: "HederaAccountId";
};
export type HederaTransactionId = string & {
  readonly __brand: "HederaTransactionId";
};

const canonicalInteger = /^(?:0|[1-9][0-9]*)$/u;
const canonicalAccountId =
  /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$/u;
const canonicalTransactionId =
  /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)@(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]{0,8})$/u;

function parseCanonicalInteger(input: unknown): bigint | undefined {
  if (typeof input !== "string" || !canonicalInteger.test(input)) {
    return undefined;
  }

  return BigInt(input);
}

export function parseTinybar(input: unknown): Tinybar | undefined {
  const value = parseCanonicalInteger(input);
  return value === undefined ? undefined : (value as Tinybar);
}

export function parseBasisPoints(input: unknown): BasisPoints | undefined {
  const value = parseCanonicalInteger(input);
  if (value === undefined || value > 10000n) {
    return undefined;
  }

  return value as BasisPoints;
}

export function parseNoteUnits(input: unknown): NoteUnits | undefined {
  const value = parseCanonicalInteger(input);
  return value === undefined ? undefined : (value as NoteUnits);
}

export function parseHederaAccountId(
  input: unknown,
): HederaAccountId | undefined {
  if (typeof input !== "string" || !canonicalAccountId.test(input)) {
    return undefined;
  }

  return input as HederaAccountId;
}

export function parseHederaTransactionId(
  input: unknown,
): HederaTransactionId | undefined {
  if (typeof input !== "string" || !canonicalTransactionId.test(input)) {
    return undefined;
  }

  return input as HederaTransactionId;
}
