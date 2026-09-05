# RiskScan Receipt/Evidence Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a completed RiskScan state structurally depend on receipt and evidence artifacts bound to the exact verified settlement that authorizes it.

**Architecture:** Keep the work inside the pure core lifecycle. A private identity registry records frozen receipt/evidence artifacts and the exact verified-settlement object that issued each one; completion consumes that capability instead of accepting redundant correlation strings from the caller. No server, browser, persistence, payment, or external-evidence path changes in this task.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 native type stripping, npm workspaces, Node test runner.

**Spec:** [M03 RiskScan verified receipt/evidence binding contract](../../specs/m03-riskscan-receipt-evidence.md)

## Global Constraints

- Use Node 22.21.1 and npm 10.9.4; do not modify dependencies, package metadata, or the lockfile.
- Keep `packages/core` free of I/O, framework, database, protocol, network, wallet, and adapter imports.
- Treat receipt and evidence references as nonblank trimmed opaque strings; do not claim external verification or require the two values to differ.
- Completion must require the exact verified-settlement object and a frozen artifact registered for that same object, not merely matching visible strings.
- Do not alter the backend projection, API route, server helper, browser flow, runtime configuration, or human-only boundaries.

## File Structure

- `packages/core/src/risk-scan.ts`: private artifact identity registry, artifact binder, completion input split, and completed transition.
- `packages/core/src/index.ts`: public exports for the binder and its types.
- `packages/core/test/risk-scan.test.mjs`: public RED/GREEN lifecycle and adversarial identity contracts.

---

### Task 1: Bind receipt/evidence artifacts to verified settlements

**Files:**
- Modify: `packages/core/src/risk-scan.ts:31-55,185-279`
- Modify: `packages/core/src/index.ts:4-28`
- Modify: `packages/core/test/risk-scan.test.mjs:143-281`

**Interfaces:**
- Consumes: `RiskScanVerifiedSettlement` created by `createRiskScanVerifiedSettlement(state, { requestRef, settlementRef })`.
- Produces: `bindRiskScanReceiptEvidence(settlement, { receiptRef, evidenceRef }): RiskScanBoundReceiptEvidence` and `completeRiskScanRequest(settlement, artifacts, { resultRef, salientReasons, limitations }): RiskScanCompleted`.

- [ ] **Step 1: Write the failing public-entry tests**

Replace the existing direct completion-input setup with this public API shape, then add the negative identity cases in `packages/core/test/risk-scan.test.mjs`:

```js
const artifacts = core.bindRiskScanReceiptEvidence(settlement, {
  receiptRef: " receipt-46 ",
  evidenceRef: " evidence-46 ",
});

assert.equal(typeof core.bindRiskScanReceiptEvidence, "function");
assert.equal(Object.isFrozen(artifacts), true);
assert.deepEqual(artifacts, {
  requestRef: "request-46",
  settlementRef: "settlement-46",
  receiptRef: "receipt-46",
  evidenceRef: "evidence-46",
});

assert.deepEqual(
  core.completeRiskScanRequest(settlement, artifacts, {
    resultRef: "result-46",
    salientReasons: ["bounded input was assessed"],
    limitations: ["source coverage is limited"],
  }),
  {
    state: "completed",
    requestRef: "request-46",
    subjectRef: "wallet:0x789",
    context: "bounded assessment",
    settlementRef: "settlement-46",
    result: {
      resultRef: "result-46",
      salientReasons: ["bounded input was assessed"],
      limitations: ["source coverage is limited"],
    },
    receiptRef: "receipt-46",
    evidenceRef: "evidence-46",
  },
);
```

Add assertions that `bindRiskScanReceiptEvidence` rejects `"   "` for each artifact field; that `Object.defineProperties({}, Object.getOwnPropertyDescriptors(artifacts))` is rejected by completion; and that an artifact created from one of two distinct verified-settlement objects is rejected when passed with the other, even when both settlements use `request-identity` and `settlement-identity`.

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/core
```

Expected: FAIL because `core.bindRiskScanReceiptEvidence` is not exported and the existing completion transition accepts only two arguments.

- [ ] **Step 3: Add the minimum opaque artifact capability**

In `packages/core/src/risk-scan.ts`, add these registries beside `verifiedRiskScanSettlements` and use them only through the binder and completion transition:

```ts
const boundRiskScanReceiptEvidence = new WeakSet<object>();
const verifiedSettlementByReceiptEvidence = new WeakMap<
  object,
  RiskScanVerifiedSettlement
>();
```

Define `RiskScanReceiptEvidenceInput`, `RiskScanBoundReceiptEvidence`, and `RiskScanAssessmentCompletionInput` exactly as the specification declares. Implement this binder after `requireVerifiedRiskScanSettlement`:

```ts
export function bindRiskScanReceiptEvidence(
  settlement: RiskScanVerifiedSettlement,
  input: RiskScanReceiptEvidenceInput,
): RiskScanBoundReceiptEvidence {
  const verifiedSettlement = requireVerifiedRiskScanSettlement(settlement);
  const artifacts = Object.freeze({
    requestRef: verifiedSettlement.requestRef,
    settlementRef: verifiedSettlement.settlementRef,
    receiptRef: requiredTrimmedString(input.receiptRef, "receiptRef"),
    evidenceRef: requiredTrimmedString(input.evidenceRef, "evidenceRef"),
  }) as RiskScanBoundReceiptEvidence;

  boundRiskScanReceiptEvidence.add(artifacts);
  verifiedSettlementByReceiptEvidence.set(artifacts, verifiedSettlement);
  return artifacts;
}
```

Change `completeRiskScanRequest` to accept `(settlement, artifacts, completion)`. Require the settlement first, reject an artifact that is not registered or whose `WeakMap` value is not the exact `verifiedSettlement` object, then copy request, settlement, receipt, and evidence values only from the validated capability objects. Retain the existing result validation unchanged. Re-export the new function and types from `packages/core/src/index.ts`; remove `RiskScanCompletionInput` from the public type export.

- [ ] **Step 4: Run GREEN and the scoped package checks**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/core
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/core
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/core
```

Expected: all core commands exit 0, the completed lifecycle still has its established shape, and the boundary lint reports no forbidden dependency.

- [ ] **Step 5: Commit the reviewed implementation candidate**

```bash
git add packages/core/src/risk-scan.ts packages/core/src/index.ts packages/core/test/risk-scan.test.mjs
git commit -m "feat: Bind RiskScan Receipt Evidence"
```

The commit contains only the three owned core files. The root will run the local-reference guard, package compatibility checks, task review, module reviews, queue transition, and push after acceptance.

## Plan Self-Review

- Spec coverage: the task covers the pure boundary, trusted settlement capability, frozen registered artifact, exact-identity completion requirement, rejected forged/copy/wrong-settlement cases, public exports, unchanged external boundaries, and concrete core validation.
- Placeholder scan: no deferred implementation step, generic validation instruction, or unnamed interface remains.
- Type consistency: the binder returns `RiskScanBoundReceiptEvidence`; the three-argument completion consumes that exact type and `RiskScanAssessmentCompletionInput`; all names match the specification.
