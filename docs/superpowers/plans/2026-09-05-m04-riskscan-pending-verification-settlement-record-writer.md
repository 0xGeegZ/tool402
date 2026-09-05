# RiskScan Pending-Verification Settlement-Record Writer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a strict candidate-record admission boundary and an internal idempotent Convex writer for a safe existing RiskScan settlement attempt.

**Architecture:** A pure module accepts only an opaque transaction reference and candidate timestamp, then returns a frozen record fragment with fixed `pending_verification` state. An internal writer admits that fragment before database access, validates a loaded durable attempt through safe own data descriptors, derives network, correlates its stored candidate reference, and uses two bounded record indexes to create, exact-replay, or generically reject. Controlled tests prove only local handler behavior, never a configured runtime or external transaction.

**Tech Stack:** TypeScript, Convex 1.45, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m04-riskscan-pending-verification-settlement-record-writer.md`

## Global constraints

- Use committed Node 22.21.1 and add no dependency, package, lockfile, schema, generated output, runtime configuration, public backend surface, API/UI wiring, external-store assertion, payment/settlement/finality action, receipt/evidence/result, account, wallet, deployment, or live claim.
- Keep `admitRiskScanSettlementRecord` pure and invoke it before every database access.
- Keep the mutation internal-only. It reads one attempt and one table through exactly two declared indexes; it inserts one record only and never mutates an existing record, attempt, or request.
- Treat `transactionRef` as an opaque candidate correlation. It must match the safe stored candidate reference but must never be represented as externally verified.
- Every unsafe value from a controlled input or loaded durable document must be read through own enumerable data descriptors whose own `value` field is checked with `Object.hasOwn(descriptor, "value")`; accessors, inherited properties, and inherited descriptor-prototype values must reject without a getter read.
- Use bounded `.take(2)` lookups. Duplicate, malformed, divergent, or conflict results use only static generic `RangeError` messages.

## File structure

- Create: `packages/backend/src/risk-scan-settlement-record-admission.ts` — strict pure candidate-record admission and local types.
- Create: `packages/backend/tests/risk-scan-settlement-record-admission.test.mjs` — direct executable contract for pure admission.
- Create: `packages/backend/convex/riskscan-settlement-records.ts` — internal writer and descriptor-safe durable record helpers.
- Create: `packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs` — registration and controlled-handler contract.

### Task 1: Add strict candidate settlement-record admission

**Files:**

- Create: `packages/backend/src/risk-scan-settlement-record-admission.ts`
- Create: `packages/backend/tests/risk-scan-settlement-record-admission.test.mjs`

**Interfaces:**

- Produces `admitRiskScanSettlementRecord(input: unknown): RiskScanSettlementRecordCandidate`.
- Produces a candidate document with exactly `transactionRef`, `verificationState`, and `observedAt`.
- Later writer code supplies `attemptId` and derives `network` from a durable attempt.

- [ ] **Step 1: Write the failing pure-admission contract.**

  Directly import the missing TypeScript module. Use:

  ```js
  const validInput = { transactionRef: "0xabc_123", observedAt: 1n };
  ```

  Assert exactly this fresh frozen output:

  ```js
  {
    status: "unpersisted_candidate",
    table: "riskScanSettlementRecords",
    document: {
      transactionRef: "0xabc_123",
      verificationState: "pending_verification",
      observedAt: 1n,
    },
  }
  ```

  Assert exact outer/document keys, independent frozen allocations for two calls, and no attempt/network/finality/request/public/payment/signature/credential/wallet/evidence/result/financial field. Add table-driven rejections for null, arrays, null/custom prototype, inherited values, symbols, missing/extra/hidden/non-enumerable fields, accessors without reads, caller-supplied `attemptId`, `network`, `verificationState`, `finalityBoundary`, or payload, blank/space/unsafe/oversized/non-string transaction references, and number/negative/out-of-range timestamps. Temporarily define `Object.prototype.value` in a `try`/`finally` block and prove a required accessor is still rejected without invocation; restore the original descriptor in `finally`.

- [ ] **Step 2: Run the focused test and confirm RED.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-settlement-record-admission.test.mjs
  ```

  Expected: failure because the source module does not exist.

- [ ] **Step 3: Implement the minimal pure module.**

  Define the readonly key tuple `transactionRef`, `observedAt` plus its `Set`. Reject every non-`Object.prototype` input and unexpected `Reflect.ownKeys` result before reading values. Read required values only using own enumerable data descriptors with `Object.hasOwn(descriptor, "value")`; `rejectInput()` throws `new TypeError("Invalid RiskScan settlement-record admission input")`. Validate `/^[A-Za-z0-9:_-]{1,160}$/u` and a nonnegative `bigint` through `9223372036854775807n`. Return fresh frozen candidate/document objects with only the fixed `pending_verification` state.

- [ ] **Step 4: Run focused and backend validation.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-settlement-record-admission.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
  ```

- [ ] **Step 5: Self-review and commit Task 1 only.**

  Stage only the source and test, run the enabled local-reference guard and cached diff check, and commit:

  ```text
  feat: Add RiskScan Settlement Record Admission
  ```

### Task 2: Add the internal pending-verification settlement-record writer

**Files:**

- Create: `packages/backend/convex/riskscan-settlement-records.ts`
- Create: `packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs`

**Interfaces:**

- Consumes `admitRiskScanSettlementRecord` and `RiskScanSettlementRecordCandidateDocument` from `../src/risk-scan-settlement-record-admission.ts`.
- Consumes accepted `riskScanSettlementAttempts`, `riskScanSettlementRecords`, `by_attempt`, and `by_network_and_transaction_ref` schema authorities.
- Produces internal `recordInitialRiskScanSettlementRecord` with three exact Convex arguments and `{ status, recordId, verificationState }` results.

- [ ] **Step 1: Write the failing internal-writer contract.**

  Import the missing writer module. Use:

  ```js
  const validArgs = {
    attemptId: "riskScanSettlementAttempts:attempt",
    transactionRef: "0xabc_123",
    observedAt: 1n,
  };
  ```

  Build a controlled `ctx.db` whose `get`, `query().withIndex().take`, and `insert` record table names, IDs, ordered equality clauses, take limits, and documents. Its eligible attempt has own data `_id` matching `attemptId`, operation `risk_scan_settlement`, state `pending_reconciliation`, network `eip155:84532`, and candidate reference `0xabc_123`.

  Assert internal registration and exactly three validators (`attemptId` ID target, one string, one int64), plus a return object with `created`/`replayed`, a settlement-record ID, and literal `pending_verification`. Assert invalid candidate input makes no database call; absent, array, inherited/accessor/malformed/wrong-ID/wrong-operation/wrong-state/wrong-network/mismatched-candidate attempts make no index query or insert. Temporarily define `Object.prototype.value` in `try`/`finally` and prove required accessor fields on a loaded attempt and an indexed record remain rejected without getter invocation; restore the descriptor in `finally`. Assert creation calls `by_attempt` first with `attemptId`, then `by_network_and_transaction_ref` with derived network and candidate transaction reference, both with `.take(2)`, and inserts exactly the five canonical fields. Assert exact replay needs both lookups to return the same safe record ID and makes no insert. Assert two rows, lookup disagreement, malformed/accessor rows, present finality boundary, and every protected-field mismatch throw the static conflict before insert. Results expose only `status`, `recordId`, and `verificationState`.

- [ ] **Step 2: Run the focused writer test and confirm RED.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs
  ```

  Expected: failure because the writer module does not exist.

- [ ] **Step 3: Implement the minimal internal mutation.**

  Register `recordInitialRiskScanSettlementRecord` using `internalMutationGeneric`, `v.id("riskScanSettlementAttempts")`, `v.string()`, and `v.int64()`. Its return validator is an object with a `created`/`replayed` union, `v.id("riskScanSettlementRecords")`, and literal `pending_verification`.

  First admit only `{ transactionRef, observedAt }`. Then call `ctx.db.get("riskScanSettlementAttempts", args.attemptId)` and safely read its own enumerable data descriptors, requiring `Object.hasOwn(descriptor, "value")` for every field before its value is used. Reject all unsafe/ineligible forms with `new RangeError("RiskScan settlement attempt is not eligible for a settlement record")` before queries. Form the five-field document from `args.attemptId`, derived stored network, and the candidate. Query `riskScanSettlementRecords` with `by_attempt`/`attemptId` and then `by_network_and_transaction_ref`/derived network plus candidate reference; call `.take(2)` each time. Insert only when both are empty. Replay only when both are one, parse every required record descriptor through the same `Object.hasOwn(descriptor, "value")` rule, use the same opaque nonempty ID, exactly match all five canonical fields, and omit own `finalityBoundary`. Otherwise throw `new RangeError("RiskScan settlement record conflicts with a different durable record")` before insertion. Do not query/write another table or mutate any existing data.

- [ ] **Step 4: Run focused and backend validation.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
  ```

- [ ] **Step 5: Self-review and commit Task 2 only.**

  Stage only the writer and its test, run the enabled local-reference guard and cached diff check, and commit:

  ```text
  feat: Add RiskScan Pending Verification Settlement Record Writer
  ```

## Final verification

- [ ] Both focused suites are green after observed RED runs.
- [ ] Backend and root Node 22.21.1 typecheck/test/lint, queue validation, local-reference guard, whitespace check, and production webpack build are green.
- [ ] Independent task review, scoped re-reviews when necessary, and two fresh independent Standards/Spec review generations find no Critical, Important, or Minor issue.
- [ ] The completion record distinguishes controlled handler coverage from configured runtime, external storage, payment, settlement, finality, verification, evidence, result, deployment, and live claims.
