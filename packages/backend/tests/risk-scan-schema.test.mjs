import assert from "node:assert/strict";
import test from "node:test";

test("declares the durable RiskScan schema boundary", async () => {
  const schemaModule = await import(new URL("../convex/schema.ts", import.meta.url));
  const exported = JSON.parse(schemaModule.default.export());
  const normalizeField = ({ fieldType, optional }) =>
    fieldType.type === "id"
      ? ["id", optional ?? false, fieldType.tableName]
      : [fieldType.type, optional ?? false];
  const tables = Object.fromEntries(
    exported.tables.map((table) => [
      table.tableName,
      {
        fields: Object.fromEntries(
          Object.entries(table.documentType.value).map(([name, field]) => [name, normalizeField(field)]),
        ),
        indexes: table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]),
      },
    ]),
  );

  assert.equal(exported.schemaValidation, true);
  assert.deepEqual(tables, {
    riskScanRequests: {
      fields: {
        publicId: ["string", false], requestRef: ["string", false], subjectRefHash: ["string", false],
        inputHash: ["string", false], state: ["string", false], createdAt: ["bigint", false], updatedAt: ["bigint", false],
      },
      indexes: [["by_public_id", ["publicId"]], ["by_request_ref", ["requestRef"]], ["by_state_and_updated_at", ["state", "updatedAt"]]],
    },
    riskScanSettlementAttempts: {
      fields: {
        publicId: ["string", false], operation: ["string", false], idempotencyKeyHash: ["string", false], network: ["string", false], state: ["string", false],
        requestId: ["id", false, "riskScanRequests"], candidateSettlementRef: ["string", true], nextReconciliationAt: ["bigint", true], createdAt: ["bigint", false], updatedAt: ["bigint", false],
      },
      indexes: [["by_public_id", ["publicId"]], ["by_request", ["requestId"]], ["by_idempotency_scope_and_key", ["operation", "idempotencyKeyHash"]], ["by_network_and_candidate", ["network", "candidateSettlementRef"]], ["by_state_and_next_reconciliation", ["state", "nextReconciliationAt"]]],
    },
    riskScanSettlementRecords: {
      fields: { attemptId: ["id", false, "riskScanSettlementAttempts"], network: ["string", false], transactionRef: ["string", false], verificationState: ["string", false], observedAt: ["bigint", false], finalityBoundary: ["string", true] },
      indexes: [["by_attempt", ["attemptId"]], ["by_network_and_transaction_ref", ["network", "transactionRef"]], ["by_verification_state_and_observed_at", ["verificationState", "observedAt"]]],
    },
    riskScanPublicProjections: {
      fields: { requestId: ["id", false, "riskScanRequests"], publicState: ["string", false], asOf: ["bigint", false], safeResultHash: ["string", true] },
      indexes: [["by_request", ["requestId"]], ["by_public_state_and_as_of", ["publicState", "asOf"]]],
    },
    riskScanOutbox: {
      fields: { publicId: ["string", false], subjectType: ["string", false], subjectId: ["string", false], eventKind: ["string", false], idempotencyKeyHash: ["string", false], state: ["string", false], nextAttemptAt: ["bigint", true], createdAt: ["bigint", false], updatedAt: ["bigint", false] },
      indexes: [["by_public_id", ["publicId"]], ["by_subject", ["subjectType", "subjectId"]], ["by_idempotency_scope_and_key", ["eventKind", "idempotencyKeyHash"]], ["by_state_and_next_attempt", ["state", "nextAttemptAt"]]],
    },
    riskScanEvidenceReferences: {
      fields: { subjectType: ["string", false], subjectId: ["string", false], kind: ["string", false], sanitizedReference: ["string", false], verificationState: ["string", false], network: ["string", true], observedAt: ["bigint", false] },
      indexes: [["by_subject", ["subjectType", "subjectId"]], ["by_kind_and_observed_at", ["kind", "observedAt"]], ["by_verification_state_and_observed_at", ["verificationState", "observedAt"]]],
    },
  });
});
