# M21 Clearing-Split Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one closed pure-Core clearing-split lifecycle that can begin
only from an exact accepted paid-task `result_valid` state, without calculating
or performing a split.

**Architecture:** The lifecycle receives a one-time internal capability
handoff from the accepted paid-task state machine and snapshots only task
correlation. Its own issued state identities move through required, submitted,
unknown, and confirmed. Unknown is deliberately non-retryable until an
explicit non-execution event returns it to required. A tiny direct-source
handoff helper is preferable to structurally trusting a public state object;
the helper remains outside the public barrel.

**Tech Stack:** TypeScript 5.9, Node 22, the existing dependency-free Core
package, Node built-in test runner, and `@tool402/core`.

**Spec:** `docs/specs/m21-clearing-split-lifecycle.md`

## Global constraints

- Depend functionally only on the accepted M19 `result_valid` issuance
  boundary. M16 economics is available context but is not an M21 input; do
  not calculate money, allocation, cap, or maturity here.
- Retain exactly `taskRef`, `offeringVersion`, `requirementsDigest`, and
  `expiresAt` plus the closed split state. Do not retain raw requirements,
  result, payment, amount, terms, account, recipient, asset, network,
  transaction, or receipt data.
- Start only by an exact issued M19 `result_valid` capability handoff. Reject
  forged, copied, proxied, accessor-backed, or wrong-state inputs before a
  caller field is trusted, and prevent a second start from the same result.
- Accept only exact ordinary one-field event records through descriptor
  snapshots. Do not invoke event getters or add a generic validation
  framework.
- Preserve the legal table: required -> submitted -> confirmed or unknown;
  unknown -> confirmed or required only through explicit non-execution. Never
  allow direct retry/replacement from unknown.
- Do not add I/O, persistence, generic attempts, idempotency storage,
  protocol parsing, configuration, ATS, accounts, wallets, signers, payment,
  transaction, settlement, receipt/finality verification, clearing transfer,
  HCS, payout, deployment, or live behavior.
- Commit the test-only RED contract before any production module, paid-task
  handoff amendment, or public barrel export, preserving durable
  RED-before-GREEN history.

---

## File structure

- Create `packages/core/src/clearing-split-lifecycle.ts`: issued lifecycle
  states, exact event capture, start, and transition functions.
- Modify `packages/core/src/paid-task-lifecycle.ts`: one narrow non-barrel
  issued-result capability handoff only.
- Modify `packages/core/src/index.ts`: documented split lifecycle values and
  types only.
- Create `packages/core/test/clearing-split-lifecycle.test.mjs`: runtime
  contract.
- Create `packages/core/test/clearing-split-lifecycle.types.ts`: public type
  contract.

### Task 1: Test-only RED contract

**Files:**

- Create: `packages/core/test/clearing-split-lifecycle.test.mjs`
- Create: `packages/core/test/clearing-split-lifecycle.types.ts`

**Interfaces:**

- Consumes: the existing public paid-task lifecycle values/types through
  `../src/index.ts`.
- Produces: public expectations for `createClearingSplit`,
  `transitionClearingSplit`, and documented split types only.

- [ ] **Step 1: Write the failing runtime contract**

Build an exact issued `result_valid` state through the public paid-task API,
then start one split and assert the frozen five-field required snapshot. Cover
the complete transition table, source consumption after success, rejected
event preservation, duplicate start rejection, wrong M19 state rejection,
forged/copy/proxy rejection, and terminal behavior.

Assert that `split_outcome_unknown` rejects a direct `submit` or any duplicate
event, reaches `split_confirmed` only through `confirm`, and returns to a new
`split_required` state only through `non_execution_proven`. Add descriptor
safe event cases: missing/extra/symbol/inherited/nonenumerable/accessor and
throwing-reflection records must reject, and accessor counters remain zero.
Assert output keys never contain raw requirements, payment, amount, terms,
account, recipient, transaction, or receipt data.

- [ ] **Step 2: Write the failing compile-time fixture**

```ts
const split: ClearingSplitRequired = createClearingSplit(result);
const next: ClearingSplitState = transitionClearingSplit(split, {
  type: "submit",
});
const digest: RequirementsDigest = next.requirementsDigest;
void digest;

// @ts-expect-error Split lifecycle states do not carry an external amount.
const amount: Tinybar = split.amount;
// @ts-expect-error Unknown events are not part of the closed public union.
transitionClearingSplit(split, { type: "retry" });
```

Construct `result` through a helper typed from the existing public M19 API;
import all values/types only from `../src/index.ts` and use every declaration
so the fixture checks the public barrel.

- [ ] **Step 3: Run and preserve the RED result**

Run `node --test packages/core/test/clearing-split-lifecycle.test.mjs` and
`npm run typecheck --workspace @tool402/core`. Both must fail only because the
new public split API/types are absent. Record the exact result before source,
handoff, or barrel work.

- [ ] **Step 4: Commit the observed RED contract**

```bash
git add packages/core/test/clearing-split-lifecycle.test.mjs packages/core/test/clearing-split-lifecycle.types.ts
git commit -m "test: Add Clearing Split Lifecycle RED Contract"
```

### Task 2: Minimal pure lifecycle implementation

**Files:**

- Create: `packages/core/src/clearing-split-lifecycle.ts`
- Modify: `packages/core/src/paid-task-lifecycle.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**

- Consumes: the exact internal capability handoff from the accepted M19
  `result_valid` state.
- Produces: only the documented public split lifecycle values and types.

- [ ] **Step 1: Add the narrow paid-task capability handoff**

Keep M19's issued-state provenance private. Add a non-barrel helper that
checks exact issuance and `result_valid` state using private identity records,
rejects a used/transitioning/wrong/forged source without normal caller
property reads, marks a successful source consumed, and returns a fresh frozen
correlation snapshot. Do not expose this helper from `index.ts` or create a
new public M19 contract.

- [ ] **Step 2: Issue immutable split states and exact events**

Use private weak identity records for issued split states, consumption, and
any transition lock. Implement a module-private descriptor snapshot for the
exact one-field ordinary event record. Use it to map only `submit`, `confirm`,
`outcome_unknown`, and `non_execution_proven`; never invoke an accessor or
accept a default/unknown event.

- [ ] **Step 3: Implement the legal transition table**

`createClearingSplit` claims the M19 source and issues `split_required`.
`submit` advances required to submitted; submitted can confirm or become
unknown; unknown can confirm or return to required only via explicit
non-execution. Issue the successor before consuming its source. Reject every
other edge, structural state copy, duplicate transition, and terminal event.
Do not calculate an allocation or read any field from untrusted caller data.

- [ ] **Step 4: Export only the documented public surface**

Export the two documented functions and split public types through
`packages/core/src/index.ts`. Keep capability-transfer and event-capture
helpers module-private to the Core source graph.

- [ ] **Step 5: Run the GREEN contract**

Run the focused runtime test, Core typecheck, Core suite, and Core lint. Each
must pass with the existing no-I/O Core boundary.

- [ ] **Step 6: Commit the minimal GREEN implementation**

```bash
git add packages/core/src/clearing-split-lifecycle.ts packages/core/src/paid-task-lifecycle.ts packages/core/src/index.ts
git commit -m "feat: Add Clearing Split Lifecycle"
```

### Task 3: Verification and review package

**Files:**

- Verify: `packages/core/src/clearing-split-lifecycle.ts`
- Verify: `packages/core/src/paid-task-lifecycle.ts`
- Verify: `packages/core/src/index.ts`
- Verify: `packages/core/test/clearing-split-lifecycle.test.mjs`
- Verify: `packages/core/test/clearing-split-lifecycle.types.ts`

**Interfaces:**

- Consumes: the completed public Core split lifecycle.
- Produces: verification and review evidence only; a confirmed defect restarts
  a bounded RED/GREEN loop.

- [ ] **Step 1: Run the quality suite**

Run the focused M21 test, Core and root typecheck/test/lint, clean-install dry
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

- Spec coverage: Task 1 proves issued provenance and recovery rules; Task 2
  creates only a local state machine; Task 3 verifies chronology, quality,
  guard, and review gates.
- Placeholder scan: no unfinished marker, deferred validation, or unspecified
  interface.
- Type consistency: the plan uses the same `ClearingSplitState`,
  `ClearingSplitEvent`, `createClearingSplit`, and `transitionClearingSplit`
  names throughout.

## Execution handoff

Execute only after this authority is committed, independently reviewed, moved
through the queue, and activated. Use a fresh implementation worker for the
RED contract and a separate review boundary before root acceptance.
