# M04 RiskScan pending-verification settlement-record writer contract

## Delivery boundary

This contract adds one strict local candidate-admission module and one internal Convex writer for an initial `riskScanSettlementRecords` document. The writer is internal-only: it adds no public mutation, query, action, HTTP handler, generated API output, API route, browser client, runtime configuration, or deployment.

The writer is transactional only when a configured Convex runtime invokes it. Its local tests prove admission, registration, and controlled handler decisions. They do not prove a configured store, a deployment, a payment or transaction, settlement, finality, verification, receipt/evidence capture, result completion, or any live state.

## Candidate-admission boundary

`admitRiskScanSettlementRecord` accepts exactly one `Object.prototype` object with precisely these two enumerable own data fields:

- `transactionRef`; and
- `observedAt`.

It rejects null, arrays, custom or null prototypes, inherited values, symbols, missing/extra keys, non-enumerable properties, and accessor properties without invoking them. Every required descriptor must itself own its `value` field through `Object.hasOwn(descriptor, "value")`; an inherited descriptor-prototype value must not turn an accessor into accepted data. It rejects caller-supplied attempt/public/request IDs, network, verification state, finality boundary, payment payload/signature, request body, subject/context, credential, wallet/account, receipt/evidence, result, or financial field.

- `transactionRef` is an opaque one to 160 character value matching `[A-Za-z0-9:_-]` exactly.
- `observedAt` is a nonnegative `bigint` at most `9223372036854775807n`. It is caller-supplied candidate metadata, not a verified external observation.

For valid input, it returns fresh frozen objects exactly:

```ts
{
  status: "unpersisted_candidate",
  table: "riskScanSettlementRecords",
  document: {
    transactionRef,
    verificationState: "pending_verification",
    observedAt,
  },
}
```

It has no clock, random, I/O, database, framework, network, environment, payment, settlement, finality, verification, evidence, or UI dependency. It deliberately omits `attemptId`, `network`, and `finalityBoundary` because the writer derives or excludes them.

## Internal writer boundary

`recordInitialRiskScanSettlementRecord` accepts only these Convex arguments:

- `attemptId`: `v.id("riskScanSettlementAttempts")`;
- `transactionRef`: `v.string()`; and
- `observedAt`: `v.int64()`.

The handler passes exactly the two non-ID fields as one complete object to `admitRiskScanSettlementRecord` before any database access. It then loads `riskScanSettlementAttempts` by `attemptId` and accepts that loaded value only when it is a non-array object whose own enumerable data fields establish all of the following. Each required descriptor must itself own `value` through `Object.hasOwn(descriptor, "value")`; inherited descriptor-prototype values and accessors reject without a getter read:

- the loaded `_id` is the same opaque ID as `attemptId`;
- `operation` is exactly `risk_scan_settlement`;
- `state` is exactly `pending_reconciliation`;
- `network` is a valid `eip155:` network with a nonzero decimal chain ID; and
- `candidateSettlementRef` is exactly the admitted `transactionRef`.

Missing, inherited, accessor-backed, malformed, wrong-ID, wrong-operation, wrong-state, wrong-network, or mismatched-candidate attempts must throw `new RangeError("RiskScan settlement attempt is not eligible for a settlement record")` before an index query or insertion. The writer derives network only from the accepted stored attempt and never receives it from the caller.

## Transactional write behavior

For an eligible attempt, form exactly this canonical record:

```ts
{
  attemptId,
  network: storedAttempt.network,
  transactionRef: admittedCandidate.document.transactionRef,
  verificationState: "pending_verification",
  observedAt: admittedCandidate.document.observedAt,
}
```

The writer first queries `riskScanSettlementRecords` through `by_attempt`, equality-constraining `attemptId` and taking at most two rows. It then queries the same table through `by_network_and_transaction_ref`, equality-constraining the derived network and admitted transaction reference and taking at most two rows.

- If both bounded lookups return no rows, insert only the canonical record and return `created`.
- If both return exactly one safe record, the two records have the same opaque ID, each record has exactly matching `attemptId`, `network`, `transactionRef`, `verificationState`, and `observedAt` own data values whose descriptors themselves own `value` through `Object.hasOwn(descriptor, "value")`, and neither has an own `finalityBoundary`, return `replayed` without an insertion.
- If either lookup returns two rows, either sole row is malformed, the lookups disagree, a required field differs, a finality boundary is present, or an ID is missing/non-string, throw `new RangeError("RiskScan settlement record conflicts with a different durable record")` before an insertion.

The writer returns exactly one of:

```ts
{ status: "created", recordId: Id<"riskScanSettlementRecords">, verificationState: "pending_verification" }
{ status: "replayed", recordId: Id<"riskScanSettlementRecords">, verificationState: "pending_verification" }
```

The returned ID is opaque. It must not return an attempt/request/public ID, transaction data beyond the state boundary, payment payload/signature, credential, wallet/account, settlement/finality assertion, receipt/evidence reference, result, or financial field. It does not read/write another table, mutate an existing record/attempt/request, or use a clock, random number, network, environment, payment, settlement, finality, verification, evidence, result, or UI dependency.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/src/risk-scan-settlement-record-admission.ts`
- `packages/backend/convex/riskscan-settlement-records.ts`
- `packages/backend/tests/risk-scan-settlement-record-admission.test.mjs`
- `packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. The accepted schema and candidate settlement-attempt writer are dependencies, not owned changes. Public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

## Acceptance evidence

- A backend test proves strict candidate admission returns only fresh frozen safe values and rejects unsafe object/field/value inputs, including descriptor-prototype pollution, without reading accessors.
- A backend test proves the export is an internal mutation with exactly the three required argument validators and an object return validator.
- Controlled handler tests prove invalid admission before storage access; unsafe/ineligible attempt rejection without index query or insert; descriptor-prototype-polluted attempt/record accessor rejection without getter reads; exact two-index creation; exact replay without a second insert; duplicate/divergent/malformed index rejection; every protected-field conflict; no finality boundary; and exact safe returned fields.
- Backend typecheck, test, lint, local-reference guard, independent task review, and two fresh final Standards/Spec review generations pass.
- No public command, generated output, API/UI wiring, runtime configuration, deployed-store assertion, payment payload/signature, credential, wallet/account material, settlement/finality claim, receipt/evidence record, result, or live claim is added.
