# M19 Paid Task Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure task-local lifecycle that binds a quoted task to a
canonical requirements digest and makes payment, execution, result, failure,
and unknown workflow states explicit without external authority.

**Architecture:** A new Core module snapshots bounded opaque task and
offering-version correlations plus a digest produced by the accepted canonical
requirements boundary. A private issued-state registry makes every frozen state
an identity capability, and consumes the exact source only after an allowed
successor is issued. No raw requirements, financial value, receipt, or result
is retained.

**Tech Stack:** TypeScript 5.9, Node 22, existing Core canonical requirements
hashing, Node built-in test runner, and `@tool402/core`.

**Spec:** `docs/specs/m19-paid-task-lifecycle.md`

## Global Constraints

- Reuse canonical requirements/digest behavior only; never reuse the
  offering-purchase quote because it models funding allocation rather than
  service usage.
- Keep Core dependency-free and free of non-relative runtime imports.
- Do not read a clock, environment, storage, or network. Use explicit
  canonical UTC event values only.
- Do not add payment, receipt, result, split, ATS, wallet, signer, account,
  transaction, persistence, HCS, deployment, or live behavior.
- Commit the test-only RED contract before any production module or barrel
  export, preserving a durable RED-before-GREEN history.

---

## File structure

- Create `packages/core/src/paid-task-lifecycle.ts`: input snapshotting, UTC
  parsing, issued-state ownership, drift comparison, and closed async table.
- Modify `packages/core/src/index.ts`: documented values/types only.
- Create `packages/core/test/paid-task-lifecycle.test.mjs`: runtime contract.
- Create `packages/core/test/paid-task-lifecycle.types.ts`: public type contract.

### Task 1: Test-only RED contract

**Files:**

- Create: `packages/core/test/paid-task-lifecycle.test.mjs`
- Create: `packages/core/test/paid-task-lifecycle.types.ts`

**Interfaces:**

- Consumes: accepted `sha256Requirements` and `RequirementsDigest`.
- Produces: public expectations for `createPaidTask`, `transitionPaidTask`,
  `PaidTaskState`, `PaidTaskEvent`, and the named state variants.

- [ ] **Step 1: Write the failing runtime contract**

```js
const task = await createPaidTask({
  taskRef: "task-1",
  offeringVersion: "risk-v1",
  requirements: { x402Version: 2, payment: { asset: "tinybar", amount: "20" } },
  expiresAt: "2026-09-07T00:00:00.000Z",
});

assert.equal(task.state, "quoted");
assert.equal(Object.isFrozen(task), true);
assert.equal(
  (await transitionPaidTask(task, {
    type: "payment_submitted",
    observedAt: "2026-09-06T23:59:59.999Z",
    requirements: { payment: { amount: "20", asset: "tinybar" }, x402Version: 2 },
  })).state,
  "payment_submitted",
);
```

Add table-driven coverage for every legal edge; reject execution before
settlement, result before execution, skipped/duplicate edges, and any retry
after either unknown state. Assert changed, added, removed, malformed,
accessor-backed, or hostile requirements reject at submission while reordered
equivalent keys succeed. Assert exact-expiry only permits `expire`. Assert
copied, frozen-lookalike, proxied, and accessor-backed states reject before
visible fields are trusted. Add a nested getter transition and a concurrent
transition during requirements hashing; both nested uses reject and only the
successful outer call consumes its source.

- [ ] **Step 2: Write the failing compile-time fixture**

```ts
const quoted: PaidTaskQuoted = await createPaidTask({
  taskRef: "task-1",
  offeringVersion: "risk-v1",
  requirements: { x402Version: 2 },
  expiresAt: "2026-09-07T00:00:00.000Z",
});
const state: PaidTaskState = await transitionPaidTask(quoted, {
  type: "payment_submitted",
  observedAt: "2026-09-06T23:59:59.999Z",
  requirements: { x402Version: 2 },
});
const digest: RequirementsDigest = state.requirementsDigest;

// @ts-expect-error A digest is not a tinybar amount.
const amount: Tinybar = state.requirementsDigest;
// @ts-expect-error A payment-submitted event always carries requirements.
const missingRequirements: PaidTaskEvent = {
  type: "payment_submitted",
  observedAt: "2026-09-06T23:59:59.999Z",
};
```

Import values and types from `../src/index.ts`; add positive narrowing for
`payment_settled` and `result_valid` plus `void` uses so TypeScript checks only
the public entry point.

- [ ] **Step 3: Run and preserve the RED result**

Run `node --test packages/core/test/paid-task-lifecycle.test.mjs` and
`npm run typecheck --workspace @tool402/core`. Both must fail only because the
new public API is absent. Record the exact output before source or barrel work.

- [ ] **Step 4: Commit the observed RED contract**

```bash
git add packages/core/test/paid-task-lifecycle.test.mjs packages/core/test/paid-task-lifecycle.types.ts
git commit -m "test: Add Paid Task Lifecycle RED Contract"
```

### Task 2: Minimal pure lifecycle implementation

**Files:**

- Create: `packages/core/src/paid-task-lifecycle.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**

- Consumes: `sha256Requirements` and `RequirementsDigest`.
- Produces: the exact M19 public state, event, and function surface.

- [ ] **Step 1: Implement input snapshotting and UTC parsing**

Validate `taskRef` and `offeringVersion` as trimmed nonblank strings no longer
than 96 characters. Hash the full untrusted requirements object through
`sha256Requirements`. Validate expiry with the documented regular expression,
`Date.parse`, and `toISOString` round trip. Freeze a `quoted` state containing
only `taskRef`, `offeringVersion`, `requirementsDigest`, and `expiresAt`.

- [ ] **Step 2: Implement issued-state ownership and the closed table**

Use a private state-to-snapshot registry, consumed-state set, and
transitioning-state set. Require exact issued identity before state field reads;
hold the lock across the async requirements hash; issue the successor before
consuming the source; release the lock in `finally`. Permit only the nine
documented edges. Re-hash submitted requirements, require strict-before-expiry
submission and at-or-after-expiry expiration, and reject every omitted edge
without consuming the source.

- [ ] **Step 3: Export only the documented public surface**

Export the two functions and every documented state/input/event type from
`packages/core/src/index.ts`. Do not expose the registry, UTC helper, or a
future-module verifier.

- [ ] **Step 4: Run the GREEN contract**

Run the focused runtime test, Core typecheck, Core suite, and Core lint. Each
must pass together with the existing Core boundary check.

- [ ] **Step 5: Commit the minimal GREEN implementation**

```bash
git add packages/core/src/paid-task-lifecycle.ts packages/core/src/index.ts
git commit -m "feat: Add Paid Task Lifecycle"
```

### Task 3: Verification and review package

**Files:**

- Verify: `packages/core/src/paid-task-lifecycle.ts`
- Verify: `packages/core/src/index.ts`
- Verify: `packages/core/test/paid-task-lifecycle.test.mjs`
- Verify: `packages/core/test/paid-task-lifecycle.types.ts`

**Interfaces:**

- Consumes: the completed public Core boundary.
- Produces: verification and review evidence only; a confirmed defect restarts
  a bounded RED/GREEN loop.

- [ ] **Step 1: Run the quality suite**

Run the focused M19 test, Core and root typecheck/test/lint, clean-install dry
run, and `npm run queue:check`.

- [ ] **Step 2: Run repository-boundary checks**

Run the enabled reference guard against staged files, `git diff --check` from
the merge base through HEAD, and `git status --short --branch`. Expect guard
success, no whitespace error, a clean queue, and no unowned change.

- [ ] **Step 3: Obtain independent reviews**

Request one task review against the card/spec/plan/owned paths, then two fresh
Standards/Specification module-review generations after the final production
change. Every valid finding returns to a bounded RED/GREEN loop; root cannot
accept until both final generations are clean.

## Self-review

- Spec coverage: Task 1 covers every legal/negative edge; Task 2 creates the
  identity-bound async machine; Task 3 verifies chronology, quality, guard,
  and review gates.
- Placeholder scan: no unfinished marker, deferred validation, or unspecified
  interface.
- Type consistency: all tasks use the same `PaidTaskInput`, `PaidTaskSnapshot`,
  `PaidTaskState`, `PaidTaskEvent`, and function names. `RequirementsDigest`
  remains the distinct accepted Core brand.

## Execution handoff

Execute only after this authority is committed, independently reviewed, moved
through the queue, and activated. Use a fresh implementation worker for the
RED contract and a separate review boundary before root acceptance.
