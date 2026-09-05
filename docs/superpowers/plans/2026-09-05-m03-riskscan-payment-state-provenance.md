# RiskScan Payment-State Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent forged required or pending lifecycle objects from minting a verified RiskScan settlement capability.

**Architecture:** Keep provenance entirely inside `packages/core/src/risk-scan.ts` with private `WeakSet` registries. The public functions retain their existing names and state shapes, but capability-bearing required and pending objects are frozen at issuance and later transitions require their exact registered identity.

**Tech Stack:** TypeScript, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m03-riskscan-payment-state-provenance.md`

## Global Constraints

- Use the committed Node 22.21.1 runtime and no new dependency.
- Modify only `packages/core/src/risk-scan.ts` and `packages/core/test/risk-scan.test.mjs` for implementation.
- Preserve the existing lifecycle names, returned field shapes, and multiple-settlement behavior for one issued pending state.
- Do not add I/O, persistence, API/UI behavior, protocol parsing, wallet/account activity, payment activity, receipt/evidence capture, deployment behavior, or a live claim.
- Run the enabled local-reference guard before every non-empty commit.

---

## File structure

- `packages/core/src/risk-scan.ts` owns private issued-state registries, frozen capability issuance, and exact-identity checks before lifecycle advancement.
- `packages/core/test/risk-scan.test.mjs` owns adversarial provenance regressions and legitimate-flow compatibility coverage.

### Task 1: Harden issued payment-state provenance

**Files:**

- Modify: `packages/core/src/risk-scan.ts`
- Modify: `packages/core/test/risk-scan.test.mjs`

**Interfaces:**

- Consumes: `startRiskScanRequest(input)`, `markRiskScanPaymentPending(state)`, and `createRiskScanVerifiedSettlement(state, correlation)` from the accepted core lifecycle.
- Produces: the same public function names and state shapes, with readonly/frozen issued `RiskScanPaymentRequired` and `RiskScanPaymentPending` values.

- [ ] **Step 1: Write the failing provenance tests**

Add a focused test after the existing non-completed lifecycle test. It must create a genuine required state and pending state, assert that each is frozen, and exercise both an object spread and a reflective property-descriptor copy:

```js
const required = core.startRiskScanRequest(validInput);
assert.equal(Object.isFrozen(required), true);
assert.throws(
  () => core.markRiskScanPaymentPending({ ...required }),
  /issued payment requirement/u,
);

const pending = core.markRiskScanPaymentPending(required);
assert.equal(Object.isFrozen(pending), true);
assert.throws(
  () => core.createRiskScanVerifiedSettlement({ ...pending }, validCorrelation),
  /issued payment pending state/u,
);
```

Also assert that copies produced with `Object.defineProperties({}, Object.getOwnPropertyDescriptors(...))` are rejected, then prove the original pending object still creates a verified settlement accepted by the existing execution-failure, binder, and completion tests.

- [ ] **Step 2: Run the focused core test to verify it fails**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/core
```

Expected: FAIL because the current structural transitions accept the forged required or pending objects and issued objects are not frozen.

- [ ] **Step 3: Add the private registries and identity guards**

In `risk-scan.ts`, add `WeakSet<object>` registries for issued required and pending states next to the existing verified-settlement registry. Change the two interfaces to readonly fields. Freeze and register the required state inside `startRiskScanRequest`; validate registry membership before `markRiskScanUnavailable`, `markRiskScanPaymentPending`, and `markRiskScanPaymentFailed`; freeze and register pending inside `markRiskScanPaymentPending`; and require registered pending identity before `createRiskScanVerifiedSettlement` checks `requestRef`.

Use helpers with these exact failure boundaries:

```ts
function requireIssuedRiskScanPaymentRequired(
  state: unknown,
): RiskScanPaymentRequired

function requireIssuedRiskScanPaymentPending(
  state: unknown,
): RiskScanPaymentPending

function requireIssuedRiskScanPaymentState(
  state: unknown,
): RiskScanPaymentRequired | RiskScanPaymentPending
```

The helpers must reject non-objects and every object not present in their private registry. They must never treat matching public fields as provenance.

- [ ] **Step 4: Run the focused core checks to verify GREEN**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/core
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/core
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/core
```

Expected: PASS. The valid lifecycle remains compatible, while literal and reflective copies cannot advance.

- [ ] **Step 5: Commit the isolated core change**

Run:

```bash
git add packages/core/src/risk-scan.ts packages/core/test/risk-scan.test.mjs
sh .git/tool402-local-guards/reference-check --staged
git diff --cached --check
git commit -m "feat: Harden RiskScan Payment State Provenance"
```

Expected: one conventional commit containing only the owned core source and test files.

## Plan self-review

- Spec coverage: Task 1 covers private identity registries, freezing, every constrained transition, adversarial copies, valid-flow compatibility, retained multiple-settlement semantics, and focused checks.
- Placeholder scan: no placeholder markers or deferred implementation instructions remain.
- Type consistency: the helper names, required/pending types, and existing public lifecycle functions are identical across the specification and task.
