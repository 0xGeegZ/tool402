# RiskScan Candidate Settlement-Attempt Writer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe candidate-settlement admission boundary and an internal idempotent Convex writer for an eligible durable RiskScan request.

**Architecture:** A pure module admits only bounded opaque candidate metadata and produces a fresh frozen candidate with fixed operation, state, and reconciliation time. The internal writer admits that candidate before storage access, loads a pre-existing initial request, derives its public ID, and uses a bounded idempotency-index lookup to create, exact-replay, or generically reject a candidate settlement attempt. Tests use a controlled database context and prove only code-level behavior, never a configured runtime or external settlement.

**Tech Stack:** TypeScript, Convex 1.45, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md`

## Global constraints

- Use the committed Node 22.21.1 runtime and add no dependency, package, lockfile, generated output, runtime configuration, public backend surface, API/UI wiring, external-store assertion, payment/settlement/finality action, receipt/evidence/result, account, wallet, deployment, or live claim.
- Keep `admitRiskScanSettlementAttempt` pure and route every writer invocation through it before any database access.
- Keep the mutation internal-only. It may read one existing request and write one attempt only; it never mutates an existing record or touches another table.
- Use a two-row idempotency-index bound, never an unconstrained uniqueness assumption. Duplicate rows and all conflicts must use static generic `RangeError` messages that contain no record or candidate values.
- Derive `publicId` from the loaded eligible request; never accept it from the caller.

## File structure

- Create: `packages/backend/src/risk-scan-settlement-attempt-admission.ts` — strict pure candidate admission and local types.
- Create: `packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs` — direct executable contract for the pure admission boundary.
- Create: `packages/backend/convex/riskscan-settlement-attempts.ts` — internal candidate-attempt writer and private exact-match helpers.
- Create: `packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs` — registered-function and controlled-handler contract.

### Task 1: Add strict candidate settlement-attempt admission

**Files:**

- Create: `packages/backend/src/risk-scan-settlement-attempt-admission.ts`
- Create: `packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs`

**Interfaces:**

- Produces `admitRiskScanSettlementAttempt(input: unknown): RiskScanSettlementAttemptCandidate`.
- Produces a candidate whose document has exactly `operation`, `idempotencyKeyHash`, `network`, `state`, `candidateSettlementRef`, `nextReconciliationAt`, `createdAt`, and `updatedAt`.
- Later writer code consumes the candidate document but supplies `publicId` and `requestId` itself.

- [ ] **Step 1: Write the failing pure admission contract.**

  Directly import the missing TypeScript module and use this canonical input:

  ```js
  const validInput = {
    idempotencyKeyHash: "a".repeat(64),
    network: "eip155:84532",
    candidateSettlementRef: "0xabc_123",
    createdAt: 1n,
    updatedAt: 1n,
  };
  ```

  Assert exactly this fresh frozen candidate output:

  ```js
  {
    status: "unpersisted_candidate",
    table: "riskScanSettlementAttempts",
    document: {
      operation: "risk_scan_settlement",
      idempotencyKeyHash: "a".repeat(64),
      network: "eip155:84532",
      state: "pending_reconciliation",
      candidateSettlementRef: "0xabc_123",
      nextReconciliationAt: 1n,
      createdAt: 1n,
      updatedAt: 1n,
    },
  }
  ```

  Assert exact own keys, frozen fresh outer/nested allocations, and absence of public ID, request ID, payment payload/signature, subject/context, credential, wallet/account, receipt/evidence, result, and financial fields. Add table-driven rejections for null, arrays, null/custom prototype, inherited values, symbols, hidden/extra fields, non-enumerable required fields, accessors without reads, malformed/uppercase hash, invalid/zero network, blank/unsafe/oversized candidate reference, number/negative/out-of-range timestamps, unequal timestamps, and caller-supplied public/request/state/payload fields.

- [ ] **Step 2: Run the focused admission test and confirm RED.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs
  ```

  Expected: failure because `packages/backend/src/risk-scan-settlement-attempt-admission.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure admission module.**

  Define an ordered readonly expected-key tuple and a `Set` for `idempotencyKeyHash`, `network`, `candidateSettlementRef`, `createdAt`, and `updatedAt`. Reject any non-`Object.prototype` input or unexpected `Reflect.ownKeys` result before reading values. Read each required property only through an own enumerable data descriptor; require `Object.hasOwn(descriptor, "value")` so a polluted descriptor prototype cannot pass an accessor. Use a shared `rejectInput()` that throws `new TypeError("Invalid RiskScan settlement-attempt admission input")`.

  Validate the hash with `/^[a-f0-9]{64}$/u`, the network with `/^eip155:[1-9]\\d*$/u`, and the opaque candidate reference with `/^[A-Za-z0-9:_-]{1,160}$/u`. Require equal nonnegative `bigint` timestamps through `9223372036854775807n`. Construct fresh frozen document and candidate objects with fixed operation `risk_scan_settlement`, state `pending_reconciliation`, and `nextReconciliationAt` equal to the admitted timestamp. Export only the function and its necessary candidate/document interfaces from this local source module.

- [ ] **Step 4: Run focused and backend validation.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
  ```

- [ ] **Step 5: Self-review and commit Task 1 only.**

  Ensure the two-file diff has no database, Convex registration, public export entry, I/O, runtime configuration, or live claim. Stage only the source and its test, run the enabled reference guard and cached diff check, then commit:

  ```text
  feat: Add RiskScan Settlement Attempt Admission
  ```

### Task 2: Add the internal candidate settlement-attempt writer

**Files:**

- Create: `packages/backend/convex/riskscan-settlement-attempts.ts`
- Create: `packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs`

**Interfaces:**

- Consumes `admitRiskScanSettlementAttempt` and `RiskScanSettlementAttemptCandidateDocument` from `../src/risk-scan-settlement-attempt-admission.ts`.
- Consumes the accepted `riskScanRequests` and `riskScanSettlementAttempts` schema tables and their `by_idempotency_scope_and_key` index.
- Produces internal `recordInitialRiskScanSettlementAttempt` with six exact Convex arguments and `{ status, attemptId, state }` return values.

- [ ] **Step 1: Write the failing internal-writer contract.**

  Import the missing writer module. Use this canonical argument object:

  ```js
  const validArgs = {
    requestId: "riskScanRequests:request",
    idempotencyKeyHash: "a".repeat(64),
    network: "eip155:84532",
    candidateSettlementRef: "0xabc_123",
    createdAt: 1n,
    updatedAt: 1n,
  };
  ```

  Build a controlled `ctx.db` with `get`, `query().withIndex().take`, and `insert` recording each table, key equality, take limit, and document. Use an eligible request with `publicId: "risk_402"` and `state: "payment_required"`.

  Assert internal registration and the exact six validators (`requestId` ID target, three strings, two int64 values), plus an object return validator with `created`/`replayed`, a settlement-attempt ID, and `pending_reconciliation`. Assert invalid candidate input makes no database call; missing and non-`payment_required` requests make no index query or insert; creation queries `by_idempotency_scope_and_key` with operation `risk_scan_settlement` plus the admitted hash and takes two; insertion contains exactly ten expected fields; exact replay does not insert; duplicate rows and every one of the ten protected-field mismatches throw a generic `RangeError` with no insert; and result objects have exactly status, opaque attempt ID, and fixed state.

- [ ] **Step 2: Run the focused writer test and confirm RED.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs
  ```

  Expected: failure because `packages/backend/convex/riskscan-settlement-attempts.ts` does not exist.

- [ ] **Step 3: Implement the minimal internal mutation.**

  Import `internalMutationGeneric`, `v`, and the local admission function/type using the `.ts` extension already supported by the committed Convex TypeScript configuration. Register `recordInitialRiskScanSettlementAttempt` with `requestId: v.id("riskScanRequests")`, three `v.string()` candidate fields, and two `v.int64()` timestamps. Its return validator is an object with a union of `created`/`replayed`, `v.id("riskScanSettlementAttempts")`, and literal `pending_reconciliation`.

  First admit exactly the five non-ID args. Then call `ctx.db.get("riskScanRequests", args.requestId)`. Reject a null request or any state other than `payment_required` with `new RangeError("RiskScan request is not eligible for a settlement attempt")` before an index query. Build a document from `publicId: request.publicId`, `requestId: args.requestId`, and the admitted candidate. Query `riskScanSettlementAttempts`, constrain the declared index to operation then idempotency hash, and call `.take(2)`. Insert only when zero rows exist. For exactly one row, compare all ten stored document fields exactly; replay only if every comparison succeeds. For two rows, an unexpected one-row value, or any mismatch, throw `new RangeError("RiskScan settlement attempt conflicts with a different durable attempt")` before insertion. Do not read or write any other table or mutate an existing record.

- [ ] **Step 4: Run focused and backend validation.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
  ```

- [ ] **Step 5: Self-review and commit Task 2 only.**

  Ensure the two-file diff remains internal-only and has no public API/UI, runtime, payment, settlement, verification, evidence, result, account, wallet, deployment, or live behavior. Stage only the writer and its test, run the enabled reference guard and cached diff check, then commit:

  ```text
  feat: Add RiskScan Candidate Settlement Attempt Writer
  ```

## Final verification

- [ ] Both focused suites are green after their observed RED runs.
- [ ] The backend workspace typecheck, test, and lint commands are green on Node 22.21.1.
- [ ] Root typecheck, test, queue validation, local-reference guard, and diff checks are green before acceptance.
- [ ] Independent task review and two fresh independent Standards/Spec review generations find no Critical or Important issue.
- [ ] The completion record separates local handler coverage from runtime configuration, deployment, external-store proof, payment, settlement, finality, verification, evidence, and live claims.
