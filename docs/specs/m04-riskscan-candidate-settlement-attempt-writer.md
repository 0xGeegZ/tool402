# M04 RiskScan candidate settlement-attempt writer contract

## Delivery boundary

This contract adds a strict local candidate-admission module and one real Convex `internalMutationGeneric` writer for an initial candidate `riskScanSettlementAttempts` document. The writer is internal-only: no public mutation, query, action, HTTP handler, generated API output, API route, or browser client is added.

The writer runs transactionally only when a configured Convex runtime invokes it. Its local tests prove candidate admission, registration, and handler decisions against a controlled database context; they do not prove an external store exists, a deployment happened, a payment settled, finality was reached, a record is durable in a live environment, evidence was captured, or a result completed.

## Candidate-admission boundary

`admitRiskScanSettlementAttempt` accepts exactly one `Object.prototype` object with precisely these five enumerable own data fields:

- `idempotencyKeyHash`;
- `network`;
- `candidateSettlementRef`;
- `createdAt`; and
- `updatedAt`.

It rejects null, arrays, custom or null prototypes, inherited values, symbols, missing or extra keys, non-enumerable properties, and accessor properties without invoking them. It rejects any raw payment payload/signature, request body, subject/context, credential, wallet/account, receipt/evidence, result, or caller-supplied state/public/request ID field.

- `idempotencyKeyHash` is exactly 64 lowercase hexadecimal characters.
- `network` is exactly `eip155:` followed by a nonzero decimal chain ID.
- `candidateSettlementRef` is one to 160 characters from `[A-Za-z0-9:_-]`; it is an opaque candidate correlation only.
- `createdAt` and `updatedAt` are equal nonnegative `bigint` values at most `9223372036854775807n`.

For valid input it returns fresh frozen objects exactly:

```ts
{
  status: "unpersisted_candidate",
  table: "riskScanSettlementAttempts",
  document: {
    operation: "risk_scan_settlement",
    idempotencyKeyHash,
    network,
    state: "pending_reconciliation",
    candidateSettlementRef,
    nextReconciliationAt: createdAt,
    createdAt,
    updatedAt,
  },
}
```

It has no clock, random, I/O, database, framework, network, environment, payment, settlement, finality, verification, evidence, or UI dependency. `publicId` and `requestId` are deliberately absent because the writer derives them from an existing durable request.

## Internal writer boundary

`recordInitialRiskScanSettlementAttempt` accepts only these Convex arguments:

- `requestId`: `v.id("riskScanRequests")`;
- `idempotencyKeyHash`: `v.string()`;
- `network`: `v.string()`;
- `candidateSettlementRef`: `v.string()`;
- `createdAt`: `v.int64()`; and
- `updatedAt`: `v.int64()`.

The handler passes the five non-ID fields as one complete object to `admitRiskScanSettlementAttempt` before database access. It then reads `riskScanRequests` by `requestId`. The request must exist and have the exact stored state `payment_required`; otherwise it throws a generic `RangeError` before an idempotency query or insertion. The handler derives `publicId` only from the loaded request.

For an eligible request, the handler queries `riskScanSettlementAttempts` through the declared `by_idempotency_scope_and_key` index, equality-constraining `operation` to `risk_scan_settlement` and `idempotencyKeyHash` to the admitted value, then takes at most two rows.

The handler returns exactly one of:

```ts
{ status: "created", attemptId: Id<"riskScanSettlementAttempts">, state: "pending_reconciliation" }
{ status: "replayed", attemptId: Id<"riskScanSettlementAttempts">, state: "pending_reconciliation" }
```

The returned ID is opaque. No request ID, public ID, subject/context, payment payload/signature, credential, wallet/account, settlement/finality assertion, receipt/evidence reference, result, or financial field is returned.

## Transactional write behavior

With an eligible request, the writer forms one stored document by combining the loaded request `publicId`, the supplied `requestId`, and the admitted candidate document.

- If the bounded index lookup returns no rows, it inserts only that canonical document and returns `created` with the inserted ID and fixed state.
- If it returns exactly one row and all ten fields `publicId`, `requestId`, `operation`, `idempotencyKeyHash`, `network`, `state`, `candidateSettlementRef`, `nextReconciliationAt`, `createdAt`, and `updatedAt` exactly match, it performs no insertion and returns `replayed` with the existing ID and fixed state.
- If the request is absent or not in `payment_required`, the index returns two rows, the one returned row is malformed, or any of those ten fields differs, it throws a generic `RangeError` before an insertion. Errors must not expose stored or incoming values.

The writer has no clock, random-number, network, environment, payment, settlement, finality, verification, evidence, result, or UI dependency. It does not write another table or mutate an existing request or attempt.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/src/risk-scan-settlement-attempt-admission.ts`
- `packages/backend/convex/riskscan-settlement-attempts.ts`
- `packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs`
- `packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. The accepted schema and request writer are dependencies, not owned changes. Public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

## Acceptance evidence

- A backend test proves strict candidate admission returns only fresh frozen safe values and rejects unsafe object/field/value inputs without reading accessors.
- A backend test proves the export is an internal mutation with exactly the six required argument validators and an object return validator.
- Controlled handler tests prove invalid admission before storage access; missing/ineligible request rejection without index query or insert; canonical creation; exact replay without a second insert; duplicate-index and every protected-field conflict rejection without insertion; and exact safe returned fields.
- Backend typecheck, test, lint, local-reference guard, and independent review pass.
- No public command, generated output, API/UI wiring, runtime configuration, deployed-store assertion, payment payload/signature, credential, wallet/account material, settlement/finality claim, receipt/evidence record, result, or live claim is added.
