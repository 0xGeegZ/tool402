import assert from "node:assert/strict";
import test from "node:test";

const string = { type: "string" };
const literal = (value) => ({ type: "literal", value });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const optional = (fieldType) => ({ fieldType, optional: true });
const object = (fields) => ({
  type: "object",
  value: Object.fromEntries(Object.entries(fields).map(([key, fieldType]) => [
    key,
    fieldType?.fieldType !== undefined && typeof fieldType.optional === "boolean"
      ? fieldType
      : { fieldType, optional: false },
  ])),
});

test("declares exactly the three additive M32 tables with closed validators and bounded-read indexes", async () => {
  const { default: schema } = await import(new URL("../convex/schema.ts", import.meta.url));
  const exported = JSON.parse(schema.export());
  const tables = exported.tables.filter(({ tableName }) =>
    tableName.startsWith("commandAuthorit") || tableName.startsWith("externalPrepareCommand"));
  const role = union("ISSUER", "BACKER");
  const replay = object({
    replayIdentity: string,
    outcome: union("NEW", "IDEMPOTENCY_REPLAYED", "IDEMPOTENCY_CONFLICT"),
    attemptId: { type: "id", tableName: "externalPrepareCommandAttempts" },
    claimedAt: { type: "bigint" },
  });
  replay.value.attemptId.optional = true;

  assert.equal(exported.schemaValidation, true);
  assert.deepEqual(Object.fromEntries(tables.map((table) => [table.tableName, {
    documentType: table.documentType,
    indexes: table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]),
    searchIndexes: table.searchIndexes,
    vectorIndexes: table.vectorIndexes,
  }])), {
    commandAuthorities: {
      documentType: object({
        principalPublicId: string, canonicalSignerAddress: string, chainId: literal(296), role,
        ownedSubjectPublicIds: { type: "array", value: string }, authorityVersion: string, enabled: { type: "boolean" },
      }),
      indexes: [["by_chain_id_and_canonical_signer_address", ["chainId", "canonicalSignerAddress"]]],
      searchIndexes: [], vectorIndexes: [],
    },
    externalPrepareCommandReplayClaims: {
      documentType: replay,
      indexes: [["by_replay_identity", ["replayIdentity"]]], searchIndexes: [], vectorIndexes: [],
    },
    externalPrepareCommandAttempts: {
      documentType: object({
        version: literal(1), type: literal("external.prepare"), chainId: literal(296),
        canonicalSignerAddress: string, principalPublicId: string, role, authorityVersion: string,
        payloadHash: string,
        operationKind: union("ATS_CREATE", "ATS_CONTROL_LIST", "ATS_ISSUE", "ATS_TRANSFER", "ATS_COUPON", "HEDERA_FUNDING"),
        subjectPublicId: string, network: literal("hedera:testnet"), expectedTarget: string,
        canonicalParametersHash: string, idempotencyKey: string, expiresAt: string,
        state: union("PREPARED", "SUBMITTED", "CONFIRMED", "OUTCOME_UNKNOWN", "REJECTED"),
        candidateTransactionId: optional(string), candidateEvmAddress: optional(string), verifiedEvmTransactionHash: optional(string),
        nextReconciliationAt: optional({ type: "bigint" }), acceptedAt: { type: "bigint" },
      }),
      indexes: [["by_idempotency_key", ["idempotencyKey"]]], searchIndexes: [], vectorIndexes: [],
    },
  });
});
