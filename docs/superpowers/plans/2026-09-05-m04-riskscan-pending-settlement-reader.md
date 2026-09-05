# RiskScan Internal Pending-Settlement Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one internal read-only query that returns a coherent pending-verification candidate settlement record for an eligible durable attempt, or `null` when no such candidate exists.

**Architecture:** The internal query derives network and candidate transaction reference only from a safely loaded pending-reconciliation attempt. It performs two ordered bounded record-index reads, returns a narrow candidate projection only when both identify the same canonical safe record, and otherwise returns `null` for absence or generically rejects unsafe/conflicting data. Controlled tests prove only registration and local handler decisions.

**Tech Stack:** TypeScript, Convex 1.45, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m04-riskscan-pending-settlement-reader.md`

## Global constraints

- Use committed Node 22.21.1 and add no dependency, package, lockfile, schema, generated output, runtime configuration, public backend surface, API/UI wiring, external-store assertion, payment/settlement/finality action, receipt/evidence/result, account, wallet, deployment, or live claim.
- Register exactly one `internalQueryGeneric` query. It reads only `riskScanSettlementAttempts` and `riskScanSettlementRecords`; it performs no insert, patch, replace, delete, scheduling, action, network, clock, random, or environment access.
- Treat all durable IDs as opaque nonempty data strings. Do not parse, normalize, synthesize, or expose attempt/request/public IDs.
- Derive network and transaction reference only from a safe stored attempt; do not accept them from the query caller.
- Every required loaded field must be an own enumerable data property whose descriptor owns `value` through `Object.hasOwn(descriptor, "value")`. Accessors, inherited properties, non-enumerable fields, and inherited descriptor-prototype values reject without getter reads.
- Use `.take(2)` for both record indexes in order. Duplicate, malformed, divergent, mismatched, advanced, or finality-bearing rows fail with only static generic `RangeError` messages.
- The returned projection represents only candidate metadata. It must not assert payment, transaction verification, settlement, finality, evidence, a result, a configured store, deployment, or live behavior.

## File structure

- Create: `packages/backend/convex/riskscan-pending-settlement-reader.ts` — internal descriptor-safe candidate reader.
- Create: `packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs` — registration and controlled-handler contract.

### Task 1: Add the internal pending-settlement candidate reader

**Files:**

- Create: `packages/backend/convex/riskscan-pending-settlement-reader.ts`
- Create: `packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs`

**Interfaces:**

- Consumes accepted `riskScanSettlementAttempts`, `riskScanSettlementRecords`, `by_attempt`, and `by_network_and_transaction_ref` schema authorities.
- Produces `readRiskScanPendingSettlementCandidate`, an internal query accepting `attemptId: v.id("riskScanSettlementAttempts")`.
- Produces `null` or exactly `{ recordId, network, transactionRef, verificationState: "pending_verification", observedAt }`.

- [ ] **Step 1: Write the failing internal-query contract.**

  Directly import the missing query module. Use:

  ```js
  const validArgs = { attemptId: "riskScanSettlementAttempts:attempt" };
  const storedAttempt = {
    _id: validArgs.attemptId,
    _creationTime: 0,
    operation: "risk_scan_settlement",
    state: "pending_reconciliation",
    network: "eip155:84532",
    candidateSettlementRef: "0xabc_123",
  };
  const canonicalRecord = {
    attemptId: validArgs.attemptId,
    network: storedAttempt.network,
    transactionRef: storedAttempt.candidateSettlementRef,
    verificationState: "pending_verification",
    observedAt: 1n,
  };
  ```

  Build a controlled `ctx.db` whose `get` and `query().withIndex().take` record table names, IDs, ordered equality clauses, and take limits, and whose writes throw if touched. Assert the export is only an internal query with the exact attempt-ID validator and a `null` or exact candidate-projection return validator. Assert an absent attempt produces `null` after exactly one attempt lookup and no index access. Assert a safe attempt with both empty record indexes produces `null` after ordered `by_attempt` then `by_network_and_transaction_ref` calls with two-row bounds. Assert two separate safe records with the same opaque ID produce exactly the candidate projection and no write.

  Add table-driven rejections for null/array/missing/inherited/non-enumerable/accessor/wrong-ID/wrong-operation/wrong-state/wrong-network/malformed-candidate attempts; for duplicate, one-sided, divergent-ID, malformed, inherited/non-enumerable/accessor, protected-field-mismatched, wrong-state, negative/out-of-range timestamp, and finality-bearing record rows. Temporarily define `Object.prototype.value` in `try`/`finally` and prove both stored attempt and record accessors reject without invoking any getter; restore the original descriptor in `finally`. Assert every ineligible attempt fails before index access, every record conflict reads both indexes but returns no write, and outputs omit attempt/request/public IDs, payment, signature, credential, wallet/account, finality, receipt/evidence, result, and financial fields.

- [ ] **Step 2: Run the focused test and confirm RED.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs
  ```

  Expected: failure because `packages/backend/convex/riskscan-pending-settlement-reader.ts` does not exist.

- [ ] **Step 3: Implement the minimal internal query.**

  Import `internalQueryGeneric`, `IndexRange`, `v`, and `GenericId`. Register:

  ```ts
  export const readRiskScanPendingSettlementCandidate = internalQueryGeneric({
    args: { attemptId: v.id("riskScanSettlementAttempts") },
    returns: v.union(
      v.null(),
      v.object({
        recordId: v.id("riskScanSettlementRecords"),
        network: v.string(),
        transactionRef: v.string(),
        verificationState: v.literal("pending_verification"),
        observedAt: v.int64(),
      }),
    ),
    handler: async (ctx, args) => { /* bounded logic below */ },
  });
  ```

  First call `ctx.db.get("riskScanSettlementAttempts", args.attemptId)`. Return `null` if it is absent. For any present value, use `Object.getOwnPropertyDescriptor` and `Object.hasOwn(descriptor, "value")` to read `_id`, `operation`, `state`, `network`, and `candidateSettlementRef` without invoking accessors. Require the opaque ID to equal `args.attemptId`, operation `risk_scan_settlement`, state `pending_reconciliation`, network `/^eip155:[1-9]\\d*$/u`, and transaction reference `/^[A-Za-z0-9:_-]{1,160}$/u`; otherwise throw `new RangeError("RiskScan settlement attempt is not eligible for pending-settlement read")` before a record query.

  Query `riskScanSettlementRecords` first with `by_attempt`/`attemptId`, then `by_network_and_transaction_ref`/derived network and transaction reference, using `.take(2)` each time. Return `null` only if both arrays are empty. Otherwise require exactly one independently safe record from each lookup, the same opaque nonempty record ID, no own `finalityBoundary`, matching `attemptId`, derived network, derived transaction reference, exact `pending_verification` state, and a nonnegative `bigint` through `9223372036854775807n`. Return only the five approved projection fields. Any other indexed outcome throws `new RangeError("RiskScan pending settlement record conflicts with a different durable record")` without a write.

- [ ] **Step 4: Run focused and backend validation.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
  ```

- [ ] **Step 5: Self-review and commit Task 1 only.**

  Inspect the exact two-file diff. Stage only the source and test, run the enabled local-reference guard and cached diff check, and commit:

  ```text
  feat: Add RiskScan Pending Settlement Reader
  ```

## Final verification

- [ ] The focused reader suite is green after its observed missing-module RED run.
- [ ] Backend and root Node 22.21.1 typecheck/test/lint, queue validation, local-reference guard, whitespace check, and production Webpack build are green.
- [ ] Independent task review and two fresh independent Standards/Spec review generations find no Critical, Important, or Minor issue.
- [ ] Completion records distinguish controlled internal-query coverage from configured runtime, external storage, payment, settlement, transaction verification, finality, evidence, result, deployment, and live claims.
