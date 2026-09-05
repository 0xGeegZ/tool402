# M04 RiskScan durable request-admission contract

## Delivery boundary

This contract creates a pure local admission/normalization function for the first `riskScanRequests` document described by the accepted schema. It produces an explicitly unpersisted candidate only. It does not register or invoke a database mutation, query, action, HTTP handler, writer, reader, generated API output, external-store connection, deployment, payment action, settlement assertion, receipt/evidence claim, or live result.

The candidate is a local value that a later separately specified internal writer may consume. Returning it does not prove a record exists, is durable, is idempotent, is verified, is replay-safe, has settled, has evidence, or is publicly visible.

## Input boundary

`admitRiskScanDurableRequest` accepts `unknown` and permits exactly one plain object with these enumerable data properties:

- `publicId`: a trimmed opaque identifier, one to 96 characters, matching `[A-Za-z0-9_-]+`;
- `requestRef`: a trimmed opaque request reference, one to 96 characters;
- `subjectRefHash`: exactly 64 lowercase hexadecimal characters;
- `inputHash`: exactly 64 lowercase hexadecimal characters;
- `createdAt`: a nonnegative `bigint` no greater than `9223372036854775807n`;
- `updatedAt`: the same bounded `bigint` value as `createdAt`.

The input must have `Object.prototype` as its prototype, no symbol keys, no inherited values, no accessor properties, and no key other than those six. Values are read only from own data-property descriptors. A blank/non-string/oversized identifier or request reference, an invalid hash, a non-`bigint`/negative/out-of-range timestamp, mismatched timestamps, a missing key, an extra key, a symbol key, an accessor, or a non-plain object is rejected.

The function must not accept a caller-supplied state. It alone fixes the initial record state to `payment_required`.

## Output boundary

The function returns a newly allocated frozen object with exactly:

```ts
{
  status: "unpersisted_candidate",
  table: "riskScanRequests",
  document: {
    publicId: string,
    requestRef: string,
    subjectRefHash: string,
    inputHash: string,
    state: "payment_required",
    createdAt: bigint,
    updatedAt: bigint,
  },
}
```

The outer candidate and nested `document` are frozen. The output has no raw subject reference, context, request body, declaration, payment payload/signature, protected response, credential, private key, signer, wallet/account data, recipient, provider response, evidence, settlement reference, result, receipt, or financial field.

Repeated valid admissions return distinct frozen candidate/document objects with equivalent values. The function has no clock, random-number, I/O, database, framework, network, or environment dependency.

## Scope and ownership

Only these implementation paths belong to this card:

- `packages/backend/src/risk-scan-durable-request-admission.ts`
- `packages/backend/tests/risk-scan-durable-request-admission.test.mjs`

The root owns this specification, plan, card, queue state, catalog, file ownership, decisions, and integration evidence. The accepted schema, existing projection/public package entry, generated output, database functions, package metadata, lockfile, runtime configuration, external resources, accounts, wallets, payment/settlement actions, deployment, and live evidence are excluded.

## Acceptance evidence

- Tests prove a valid six-field input returns only the canonical initial `riskScanRequests` candidate and no durable/live assertion.
- Tests prove the output is frozen, newly allocated per admission, and excludes every raw/sensitive/extra field.
- Tests reject invalid object shape/prototype/descriptor/key inputs, identifier/request-reference violations, hash violations, timestamp type/range/mismatch violations, and a caller-supplied `state`.
- Backend typecheck, test, lint, local-reference guard, and independent review pass.
- No database function, generated output, external action, payment payload, credential, wallet/account material, receipt/evidence record, result, or live claim is added.
