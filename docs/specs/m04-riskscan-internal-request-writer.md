# M04 RiskScan internal request writer contract

## Delivery boundary

This contract registers one real Convex `internalMutationGeneric` writer for the initial `riskScanRequests` document. It is internal-only: no public mutation, query, action, HTTP handler, generated API output, API route, or browser client is added.

The writer runs transactionally only when a configured Convex runtime invokes it. Its local tests prove registration and handler decisions against a controlled database context; they do not prove an external store exists, a deployment happened, a record is durable in a live environment, a payment settled, a result completed, or evidence was captured.

## Input and registration boundary

`recordInitialRiskScanRequest` accepts only these arguments:

- `publicId`: string;
- `requestRef`: string;
- `subjectRefHash`: string;
- `inputHash`: string;
- `createdAt`: `int64`;
- `updatedAt`: `int64`.

Its Convex args validators are `v.string()` for the four opaque strings and `v.int64()` for both timestamps. The handler passes the complete argument object to `admitRiskScanDurableRequest`; that accepted local contract remains the authority for exact object/descriptors, canonicalization, hash format, timestamp range/equality, and the fixed `payment_required` state.

The writer returns exactly one of:

```ts
{ status: "created", requestId: Id<"riskScanRequests">, state: "payment_required" }
{ status: "replayed", requestId: Id<"riskScanRequests">, state: "payment_required" }
```

The returned ID is an opaque internal document identifier. No raw subject reference, context, request body, payment payload/signature, credential, signer, wallet/account data, settlement reference, evidence, result, receipt, or financial field is accepted or returned.

## Transactional write behavior

After admission, the handler queries `riskScanRequests` through the declared `by_request_ref` index using the canonical request reference.

- If no record exists, it inserts only the admitted candidate document and returns `created` with the inserted ID and `payment_required` state.
- If a record exists and its `publicId`, `requestRef`, `subjectRefHash`, `inputHash`, `state`, `createdAt`, and `updatedAt` exactly match the admitted candidate, it performs no insertion and returns `replayed` with the existing ID and `payment_required` state.
- If a record exists but any of those seven fields differs, it throws a generic `RangeError` before an insertion. It must not expose the existing or incoming values in the error.

The writer has no clock, random-number, network, environment, payment, settlement, verification, evidence, result, or UI dependency. It does not write any other table or mutate an existing request.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/convex/riskscan-requests.ts`
- `packages/backend/convex/tsconfig.json`
- `packages/backend/tests/risk-scan-internal-request-writer.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. The accepted schema and admission module remain dependencies, not owned changes. Backend public exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, accounts, wallets, payment/settlement actions, deployment, external resources, and live evidence are excluded.

## Acceptance evidence

- A backend test proves the export is an internal mutation with exactly the six required argument validators and an object return validator.
- Controlled handler tests prove canonical insertion, exact replay, conflict rejection without insertion, and invalid-admission rejection before query/insert access.
- Tests prove only safe document fields are supplied to the insert call and only safe status/ID/state fields are returned.
- Backend typecheck, test, lint, local-reference guard, and independent review pass.
- No public command, generated output, API/UI wiring, runtime configuration, deployed-store assertion, payment payload, credential, wallet/account material, settlement/evidence record, result, or live claim is added.
