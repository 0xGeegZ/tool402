# RiskScan Durable Request Admission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict, pure admission boundary that converts a safe initial RiskScan request record into a frozen unpersisted candidate for a later writer.

**Architecture:** One backend module owns exact-object inspection, canonical string/hash/timestamp validation, and construction of the only permitted initial `riskScanRequests` candidate. It has no database context or registration. One Node built-in test imports the module directly and proves the safe candidate shape, defensive object boundary, deterministic initial state, frozen/fresh return values, and rejection of every prohibited input class.

**Tech Stack:** TypeScript, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m04-riskscan-durable-request-admission.md`

## Global Constraints

- Use the committed Node 22.21.1 runtime and add no dependency.
- Create only `packages/backend/src/risk-scan-durable-request-admission.ts` and `packages/backend/tests/risk-scan-durable-request-admission.test.mjs` for implementation.
- Accept exactly six own enumerable data fields on an `Object.prototype` object; reject all other object shapes, inherited values, symbols, accessors, and caller-supplied state.
- Bound `publicId` to `[A-Za-z0-9_-]+` and 1–96 characters; trim/bound `requestRef` to 1–96 characters; require lowercase 64-character hexadecimal hashes; require equal nonnegative signed-64-bit `bigint` timestamps.
- Return only a newly allocated frozen `{ status: "unpersisted_candidate", table: "riskScanRequests", document }` with fixed `payment_required` state.
- Add no database function, schema/generated output, package or lockfile change, projection/API/UI feature, runtime configuration, external-store connection, payment/settlement action, wallet/account action, deployment, or live assertion.
- Do not accept or return raw subject/context/request/input/evidence data, payment payload/signature, protected response, credential, private key, signer, wallet/account data, recipient, provider response, settlement, receipt, result, or financial field.
- Run the enabled local-reference guard before every non-empty commit.

---

## File structure

- `packages/backend/src/risk-scan-durable-request-admission.ts` owns exact input inspection and pure candidate construction.
- `packages/backend/tests/risk-scan-durable-request-admission.test.mjs` owns admission positive/negative regression coverage through the module's direct export.

### Task 1: Add the pure durable-request admission boundary

**Files:**

- Create: `packages/backend/src/risk-scan-durable-request-admission.ts`
- Create: `packages/backend/tests/risk-scan-durable-request-admission.test.mjs`

**Interfaces:**

- Consumes: `unknown` caller input only; no existing module, database context, environment, or framework API.
- Produces: `admitRiskScanDurableRequest(input: unknown): RiskScanDurableRequestCandidate`, where the candidate has fixed `status`, `table`, and `document.state` literals plus the six schema-compatible document fields.

- [ ] **Step 1: Write the failing admission contract**

Create a direct-import Node test with a canonical input:

```js
const validInput = {
  publicId: "risk_402",
  requestRef: " request-402 ",
  subjectRefHash: "a".repeat(64),
  inputHash: "b".repeat(64),
  createdAt: 1n,
  updatedAt: 1n,
};

const first = admitRiskScanDurableRequest(validInput);
const second = admitRiskScanDurableRequest(validInput);

assert.deepEqual(first, {
  status: "unpersisted_candidate",
  table: "riskScanRequests",
  document: {
    publicId: "risk_402",
    requestRef: "request-402",
    subjectRefHash: "a".repeat(64),
    inputHash: "b".repeat(64),
    state: "payment_required",
    createdAt: 1n,
    updatedAt: 1n,
  },
});
assert.equal(Object.isFrozen(first), true);
assert.equal(Object.isFrozen(first.document), true);
assert.notEqual(first, second);
assert.notEqual(first.document, second.document);
```

Add table-driven `assert.throws` cases for null, arrays, a null/custom prototype, missing/extra/symbol/accessor fields, raw `subjectRef`/`context`/`state`/payload keys, blank/invalid/oversized identifiers, invalid request references, uppercase/short/non-string hashes, number/negative/over-64-bit timestamps, and unequal timestamps. Assert the document keys are exactly the seven schema fields and do not contain forbidden field names.

- [ ] **Step 2: Run the focused backend test to verify RED**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-durable-request-admission.test.mjs
```

Expected: FAIL because the admission module does not yet exist.

- [ ] **Step 3: Write the minimal pure admission module**

Create the exported candidate types and `admitRiskScanDurableRequest`. Use `Object.getPrototypeOf`, `Reflect.ownKeys`, and own data-property descriptors to require the exact input shape before reading values. Implement a trimmed bounded string validator, opaque-public-ID regular-expression check, lowercase SHA-256-shaped hash check, and nonnegative signed-64-bit `bigint` validator. Reject differing timestamps, then create fresh nested/outer objects with `Object.freeze`:

```ts
return Object.freeze({
  status: "unpersisted_candidate",
  table: "riskScanRequests",
  document: Object.freeze({
    publicId,
    requestRef,
    subjectRefHash,
    inputHash,
    state: "payment_required",
    createdAt,
    updatedAt,
  }),
});
```

Do not export the module through `packages/backend/src/index.ts`; it is an internal local writer-preparation boundary, not a public backend API. Do not import the schema, core, Convex, Node crypto, or any runtime adapter.

- [ ] **Step 4: Run focused GREEN checks**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-durable-request-admission.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
```

Expected: PASS. Valid input produces only a frozen unpersisted initial candidate; every malformed, raw, sensitive, or noncanonical input is rejected without a database interaction or public state claim.

- [ ] **Step 5: Commit the isolated backend change**

Run:

```bash
git add packages/backend/src/risk-scan-durable-request-admission.ts packages/backend/tests/risk-scan-durable-request-admission.test.mjs
sh .git/tool402-local-guards/reference-check --staged
git diff --cached --check
git commit -m "feat: Add RiskScan Durable Request Admission"
```

Expected: one conventional commit containing only the owned backend source and test files.

## Plan self-review

- Spec coverage: Task 1 covers exact input shape, canonical fields/limits, initial state, frozen/fresh output, raw/sensitive exclusion, no-persistence boundary, and all acceptance checks.
- Placeholder scan: no placeholder marker or deferred implementation instruction remains.
- Type consistency: input/output names, literal values, field names, timestamp limits, and rejection boundaries match the local specification throughout.
