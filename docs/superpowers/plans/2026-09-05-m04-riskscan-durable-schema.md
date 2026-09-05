# RiskScan Durable Schema Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a narrow, test-locked Convex schema for durable RiskScan correlation records and their required lookup indexes.

**Architecture:** A single default schema module declares six storage-only record types: request, settlement attempt, settlement record, safe public projection, outbox, and sanitized evidence reference. It uses document IDs only for the direct request-to-attempt and attempt-to-settlement relations. A Node built-in test imports the schema's own export representation and compares its complete table, field, optionality, ID-target, and index surface to the local contract.

**Tech Stack:** TypeScript, Convex `defineSchema`/`defineTable`, Convex validators, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m04-riskscan-durable-schema.md`

## Global Constraints

- Use the committed Node 22.21.1 runtime and add no dependency.
- Create only `packages/backend/convex/schema.ts` and `packages/backend/tests/risk-scan-schema.test.mjs` for implementation.
- Use `v.int64()` for every declared timestamp and `v.string()` for every opaque identifier, hash, state, operation, network, or sanitized reference.
- Use `v.id("riskScanRequests")` only for request relations and `v.id("riskScanSettlementAttempts")` only for settlement-attempt relations.
- Add no query, mutation, action, HTTP handler, writer, reader, generated output, package or lockfile change, configuration, external-store connection, payment action, wallet/account action, deployment, or live assertion.
- Do not declare raw payment payloads, payment signatures, protected-response digests, credentials, private keys, signer material, wallet/account data, recipients, raw request/input/evidence data, provider responses, completed results, or financial mutations.
- Run the enabled local-reference guard before every non-empty commit.

---

## File structure

- `packages/backend/convex/schema.ts` owns only the default Convex table declarations and indexes.
- `packages/backend/tests/risk-scan-schema.test.mjs` owns the import-level schema regression contract and its exact exported-shape assertions.

### Task 1: Declare and lock the durable schema boundary

**Files:**

- Create: `packages/backend/convex/schema.ts`
- Create: `packages/backend/tests/risk-scan-schema.test.mjs`

**Interfaces:**

- Consumes: `defineSchema` and `defineTable` from `convex/server`; `v` from `convex/values`.
- Produces: the default `SchemaDefinition` with exactly six named tables; no public backend export or registered function.

- [ ] **Step 1: Write the failing schema-export contract**

Create `packages/backend/tests/risk-scan-schema.test.mjs` with this complete import-level contract. It normalizes every exported table to its name, index descriptors/fields, and each document field's validator type, optionality, and ID target:

```js
import assert from "node:assert/strict";
import test from "node:test";

const schemaModule = await import(new URL("../convex/schema.ts", import.meta.url));
const exportedSchema = JSON.parse(schemaModule.default.export());

function normalizeFields(documentType) {
  return Object.fromEntries(
    Object.entries(documentType.value).map(([name, validator]) => [
      name,
      validator.fieldType.type === "id"
        ? [validator.fieldType.type, validator.optional, validator.fieldType.tableName]
        : [validator.fieldType.type, validator.optional],
    ]),
  );
}

function normalizeTable(table) {
  return {
    fields: normalizeFields(table.documentType),
    indexes: table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]),
  };
}

const expectedTables = {
  riskScanRequests: {
    fields: {
      publicId: ["string", false], requestRef: ["string", false],
      subjectRefHash: ["string", false], inputHash: ["string", false],
      state: ["string", false], createdAt: ["bigint", false], updatedAt: ["bigint", false],
    },
    indexes: [["by_public_id", ["publicId"]], ["by_request_ref", ["requestRef"]], ["by_state_and_updated_at", ["state", "updatedAt"]]],
  },
  riskScanSettlementAttempts: {
    fields: {
      publicId: ["string", false], requestId: ["id", false, "riskScanRequests"],
      operation: ["string", false], idempotencyKeyHash: ["string", false], network: ["string", false],
      state: ["string", false], candidateSettlementRef: ["string", true], nextReconciliationAt: ["bigint", true],
      createdAt: ["bigint", false], updatedAt: ["bigint", false],
    },
    indexes: [["by_public_id", ["publicId"]], ["by_request", ["requestId"]], ["by_idempotency_scope_and_key", ["operation", "idempotencyKeyHash"]], ["by_network_and_candidate", ["network", "candidateSettlementRef"]], ["by_state_and_next_reconciliation", ["state", "nextReconciliationAt"]]],
  },
  riskScanSettlementRecords: {
    fields: {
      attemptId: ["id", false, "riskScanSettlementAttempts"], network: ["string", false],
      transactionRef: ["string", false], verificationState: ["string", false], observedAt: ["bigint", false],
      finalityBoundary: ["string", true],
    },
    indexes: [["by_attempt", ["attemptId"]], ["by_network_and_transaction_ref", ["network", "transactionRef"]], ["by_verification_state_and_observed_at", ["verificationState", "observedAt"]]],
  },
  riskScanPublicProjections: {
    fields: { requestId: ["id", false, "riskScanRequests"], publicState: ["string", false], asOf: ["bigint", false], safeResultHash: ["string", true] },
    indexes: [["by_request", ["requestId"]], ["by_public_state_and_as_of", ["publicState", "asOf"]]],
  },
  riskScanOutbox: {
    fields: {
      publicId: ["string", false], subjectType: ["string", false], subjectId: ["string", false],
      eventKind: ["string", false], idempotencyKeyHash: ["string", false], state: ["string", false],
      nextAttemptAt: ["bigint", true], createdAt: ["bigint", false], updatedAt: ["bigint", false],
    },
    indexes: [["by_public_id", ["publicId"]], ["by_subject", ["subjectType", "subjectId"]], ["by_idempotency_scope_and_key", ["eventKind", "idempotencyKeyHash"]], ["by_state_and_next_attempt", ["state", "nextAttemptAt"]]],
  },
  riskScanEvidenceReferences: {
    fields: {
      subjectType: ["string", false], subjectId: ["string", false], kind: ["string", false],
      sanitizedReference: ["string", false], network: ["string", true], observedAt: ["bigint", false], verificationState: ["string", false],
    },
    indexes: [["by_subject", ["subjectType", "subjectId"]], ["by_kind_and_observed_at", ["kind", "observedAt"]], ["by_verification_state_and_observed_at", ["verificationState", "observedAt"]]],
  },
};

test("exports exactly the narrow RiskScan durable schema foundation", () => {
  assert.equal(exportedSchema.schemaValidation, true);
  assert.deepEqual(
    Object.fromEntries(
      exportedSchema.tables.map((table) => [table.tableName, normalizeTable(table)]),
    ),
    expectedTables,
  );
});
```

The one deep-equality assertion proves the exact table-name set, complete normalized value of every expected table, and absence of every unlisted field/table. This test contains no test record, write, connection, or generated output.

- [ ] **Step 2: Run the focused backend test to verify RED**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-schema.test.mjs
```

Expected: FAIL because `packages/backend/convex/schema.ts` does not yet exist.

- [ ] **Step 3: Write the minimal default schema module**

Create `packages/backend/convex/schema.ts` with this exact storage-only declaration:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  riskScanRequests: defineTable({
    publicId: v.string(),
    requestRef: v.string(),
    subjectRefHash: v.string(),
    inputHash: v.string(),
    state: v.string(),
    createdAt: v.int64(),
    updatedAt: v.int64(),
  }).index("by_public_id", ["publicId"])
    .index("by_request_ref", ["requestRef"])
    .index("by_state_and_updated_at", ["state", "updatedAt"]),

  riskScanSettlementAttempts: defineTable({
    publicId: v.string(),
    requestId: v.id("riskScanRequests"),
    operation: v.string(),
    idempotencyKeyHash: v.string(),
    network: v.string(),
    state: v.string(),
    candidateSettlementRef: v.optional(v.string()),
    nextReconciliationAt: v.optional(v.int64()),
    createdAt: v.int64(),
    updatedAt: v.int64(),
  }).index("by_public_id", ["publicId"])
    .index("by_request", ["requestId"])
    .index("by_idempotency_scope_and_key", ["operation", "idempotencyKeyHash"])
    .index("by_network_and_candidate", ["network", "candidateSettlementRef"])
    .index("by_state_and_next_reconciliation", ["state", "nextReconciliationAt"]),

  riskScanSettlementRecords: defineTable({
    attemptId: v.id("riskScanSettlementAttempts"),
    network: v.string(),
    transactionRef: v.string(),
    verificationState: v.string(),
    observedAt: v.int64(),
    finalityBoundary: v.optional(v.string()),
  }).index("by_attempt", ["attemptId"])
    .index("by_network_and_transaction_ref", ["network", "transactionRef"])
    .index("by_verification_state_and_observed_at", ["verificationState", "observedAt"]),

  riskScanPublicProjections: defineTable({
    requestId: v.id("riskScanRequests"),
    publicState: v.string(),
    asOf: v.int64(),
    safeResultHash: v.optional(v.string()),
  }).index("by_request", ["requestId"])
    .index("by_public_state_and_as_of", ["publicState", "asOf"]),

  riskScanOutbox: defineTable({
    publicId: v.string(),
    subjectType: v.string(),
    subjectId: v.string(),
    eventKind: v.string(),
    idempotencyKeyHash: v.string(),
    state: v.string(),
    nextAttemptAt: v.optional(v.int64()),
    createdAt: v.int64(),
    updatedAt: v.int64(),
  }).index("by_public_id", ["publicId"])
    .index("by_subject", ["subjectType", "subjectId"])
    .index("by_idempotency_scope_and_key", ["eventKind", "idempotencyKeyHash"])
    .index("by_state_and_next_attempt", ["state", "nextAttemptAt"]),

  riskScanEvidenceReferences: defineTable({
    subjectType: v.string(),
    subjectId: v.string(),
    kind: v.string(),
    sanitizedReference: v.string(),
    network: v.optional(v.string()),
    observedAt: v.int64(),
    verificationState: v.string(),
  }).index("by_subject", ["subjectType", "subjectId"])
    .index("by_kind_and_observed_at", ["kind", "observedAt"])
    .index("by_verification_state_and_observed_at", ["verificationState", "observedAt"]),
});
```

The completed file has no function export beyond the default schema, no code that writes/reads a table, and no prohibited field.

- [ ] **Step 4: Run focused GREEN checks**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-schema.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
```

Expected: PASS. The exported schema is exactly the narrow declared storage surface, and the existing backend public-entry/projection tests remain green.

- [ ] **Step 5: Commit the isolated backend change**

Run:

```bash
git add packages/backend/convex/schema.ts packages/backend/tests/risk-scan-schema.test.mjs
sh .git/tool402-local-guards/reference-check --staged
git diff --cached --check
git commit -m "feat: Add RiskScan Durable Schema"
```

Expected: one conventional commit containing only the owned backend schema and test files.

## Plan self-review

- Spec coverage: Task 1 declares every required table, relation, optional field, index, timestamp validator, opaque-field boundary, and exclusion from the local contract.
- Placeholder scan: no placeholder marker or deferred implementation instruction remains; the complete expected contract is included in Step 1.
- Type consistency: table names, ID targets, index fields, validator types, and optionality use the same names in the specification and every plan step.
