# M04 RiskScan durable schema contract

## Delivery boundary

This contract adds only local Convex schema declarations and indexes for durable RiskScan records. It does not register a query, mutation, action, HTTP handler, writer, reader, generated API output, deployment, external-store connection, payment action, settlement assertion, receipt/evidence claim, or live result.

The schema is a storage boundary for later local cards. It does not make any record durable at runtime until a separately specified writer and integration path exist, and it does not make any settlement or evidence record verified until a later local verification/reconciliation contract defines the write authority and finality rules.

## Record shapes

All timestamps use Convex `v.int64()` validators. All opaque identity, state, operation, network, reference, hash, and sanitized-reference fields use `v.string()` validators. A later local writer contract owns canonical value validation before storage; this schema does not infer a state transition, payment result, or public output.

### `riskScanRequests`

Required fields:

- `publicId`
- `requestRef`
- `subjectRefHash`
- `inputHash`
- `state`
- `createdAt`
- `updatedAt`

Declared indexes:

- `by_public_id` on `publicId`
- `by_request_ref` on `requestRef`
- `by_state_and_updated_at` on `state`, `updatedAt`

### `riskScanSettlementAttempts`

Required fields:

- `publicId`
- `requestId`, a `riskScanRequests` document ID
- `operation`
- `idempotencyKeyHash`
- `network`
- `state`
- `createdAt`
- `updatedAt`

Optional fields:

- `candidateSettlementRef`
- `nextReconciliationAt`

Declared indexes:

- `by_public_id` on `publicId`
- `by_request` on `requestId`
- `by_idempotency_scope_and_key` on `operation`, `idempotencyKeyHash`
- `by_network_and_candidate` on `network`, `candidateSettlementRef`
- `by_state_and_next_reconciliation` on `state`, `nextReconciliationAt`

### `riskScanSettlementRecords`

Required fields:

- `attemptId`, a `riskScanSettlementAttempts` document ID
- `network`
- `transactionRef`
- `verificationState`
- `observedAt`

Optional fields:

- `finalityBoundary`

Declared indexes:

- `by_attempt` on `attemptId`
- `by_network_and_transaction_ref` on `network`, `transactionRef`
- `by_verification_state_and_observed_at` on `verificationState`, `observedAt`

### `riskScanPublicProjections`

Required fields:

- `requestId`, a `riskScanRequests` document ID
- `publicState`
- `asOf`

Optional fields:

- `safeResultHash`

Declared indexes:

- `by_request` on `requestId`
- `by_public_state_and_as_of` on `publicState`, `asOf`

### `riskScanOutbox`

Required fields:

- `publicId`
- `subjectType`
- `subjectId`
- `eventKind`
- `idempotencyKeyHash`
- `state`
- `createdAt`
- `updatedAt`

Optional fields:

- `nextAttemptAt`

Declared indexes:

- `by_public_id` on `publicId`
- `by_subject` on `subjectType`, `subjectId`
- `by_idempotency_scope_and_key` on `eventKind`, `idempotencyKeyHash`
- `by_state_and_next_attempt` on `state`, `nextAttemptAt`

### `riskScanEvidenceReferences`

Required fields:

- `subjectType`
- `subjectId`
- `kind`
- `sanitizedReference`
- `observedAt`
- `verificationState`

Optional fields:

- `network`

Declared indexes:

- `by_subject` on `subjectType`, `subjectId`
- `by_kind_and_observed_at` on `kind`, `observedAt`
- `by_verification_state_and_observed_at` on `verificationState`, `observedAt`

## Privacy and authority boundary

No table in this card may contain a raw payment payload, payment signature, protected-response digest, credential, private key, signer material, wallet/account data, recipient, raw request body, raw input, raw evidence, provider response, completed result, or public financial mutation.

The stored references are opaque or sanitized strings. `requestRef`, `publicId`, and document IDs support local correlation only; they are not proof of settlement, result completion, receipt, or evidence. The defined indexes are the required lookup paths for later request, idempotency, candidate-settlement, transaction-reference, projection, outbox, and evidence correlation work.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/convex/schema.ts`
- `packages/backend/tests/risk-scan-schema.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. Existing backend projection code, public APIs, UI, package metadata, lockfiles, generated output, runtime configuration, external resources, accounts, wallets, payments, deployments, and live evidence are excluded.

## Acceptance evidence

- A backend test imports the default schema and proves it exposes exactly the six declared tables, field validators, optional fields, document-ID targets, and indexes.
- The test proves no unlisted table or field appears in the exported schema shape.
- Backend typecheck, test, lint, local-reference guard, and independent review pass.
- No writer, reader, generated output, external action, durable/live assertion, payment payload, credential, wallet/account material, or raw evidence is added.
