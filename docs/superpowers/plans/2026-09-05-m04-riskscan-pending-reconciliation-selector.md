# M04-T070 RiskScan internal pending-reconciliation selector implementation plan

> **Execution note:** Use the committed local specification and this plan as
> the authority. The task runs in the existing repository workspace because
> local policy prohibits creating a worktree without explicit human direction.
> The root owns queue changes, integration, and pushes. The implementer owns
> only the two code paths named below.

## Goal

Add one narrow internal read-only query that identifies at most one safely
shaped stored `pending_reconciliation` attempt no later than an explicit
cutoff. It returns only an opaque attempt ID for a later internal consumer. It
does not treat the cutoff as a clock, schedule or execute reconciliation, read
settlement records, modify any state, or establish an external/live fact.

## Binding references

- Local contract:
  `docs/specs/m04-riskscan-pending-reconciliation-selector.md`
- Accepted dependencies:
  `docs/work-queue/queue/60-done/M04-T010-riskscan-durable-schema.md`,
  `docs/work-queue/queue/60-done/M04-T040-riskscan-candidate-settlement-attempt-writer.md`,
  and
  `docs/work-queue/queue/60-done/M04-T060-riskscan-pending-settlement-reader.md`
- Schema index:
  `riskScanSettlementAttempts.by_state_and_next_reconciliation`

## Owned implementation paths

- `packages/backend/convex/riskscan-pending-reconciliation-selector.ts`
- `packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs`

Do not modify schema, accepted M04 source/tests, public exports, generated
output, package/config/lock files, documentation, queue records, or any other
path while implementing the task.

## Task 1 — Internal pending-reconciliation selector

### Step 1: Write and observe the RED contract

Before creating the selector source, create
`packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs`.
Import the not-yet-existing selector module and define a controlled `ctx.db`
double that records `query`, `withIndex`, `eq`, `lte`, and `take` calls; throws
on `get`, all writes, scheduling, action calls, and any other table; and feeds
the bounded selector result. Run:

```sh
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs
```

Record the missing-module failure as RED. Do not create the source module until
the test fails for that reason.

The RED contract must cover:

1. exactly one `internalQueryGeneric` registration named
   `selectRiskScanPendingReconciliationAttempt`, with
   `{ beforeOrAt: v.int64() }` args and a return validator of either `null` or
   exactly `{ attemptId: v.id("riskScanSettlementAttempts") }`;
2. invalid direct cutoff values (non-bigint, negative, and above signed int64)
   throwing the exact cutoff error before a database call;
3. an empty bounded index result returning `null`;
4. one valid multi-digit-network candidate at an equal cutoff returning only
   its opaque attempt ID;
5. the exact single table/index/constraint order: query
   `riskScanSettlementAttempts`, `withIndex` by
   `by_state_and_next_reconciliation`, `eq("state",
   "pending_reconciliation")`, `lte("nextReconciliationAt", beforeOrAt)`,
   then `take(2)`;
6. no other table access, no `get`, no write, scheduling, action, network,
   clock, or random call; and
7. generic unsafe-attempt rejection for a two-row result and every malformed,
   inherited, non-enumerable, accessor-backed, descriptor-prototype-polluted,
   array, wrong-ID, wrong-operation/state/network/reference, missing,
   negative, oversized, or cutoff-exceeding selected field. Restore any
   temporary `Object.prototype.value` descriptor in `finally` and assert zero
   getter reads.

### Step 2: Implement the smallest internal query

Create `packages/backend/convex/riskscan-pending-reconciliation-selector.ts`.
Use `internalQueryGeneric`, `v`, and `GenericId` only. Define a signed int64
maximum of `9_223_372_036_854_775_807n` and a helper that obtains a field only
through `Object.getOwnPropertyDescriptor`; it accepts solely own enumerable
data descriptors whose descriptor itself owns `value`.

The handler must:

1. validate `args.beforeOrAt` as a nonnegative in-range bigint before calling
   `ctx.db` and throw exactly
   `RangeError("RiskScan reconciliation cutoff is invalid")` otherwise;
2. query only `riskScanSettlementAttempts` using the declared index with the
   exact state equality, `nextReconciliationAt` upper bound, and `.take(2)`;
3. return `null` only for an empty result;
4. reject a result whose length is not exactly one, or whose row fails the
   safe-field and canonical candidate checks, with exactly
   `RangeError("RiskScan pending reconciliation selector encountered an unsafe durable attempt")`; and
5. return exactly `{ attemptId }` for the one safe row, without reading or
   returning any unrelated field after validation.

Do not call `Date`, timers, randomness, fetch, environment APIs, record-table
queries, mutations, actions, schedulers, public API registration, or generated
code. Do not add abstractions outside the owned module.

### Step 3: Turn the contract GREEN

Run the targeted test and then the backend checks:

```sh
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
```

Inspect the exact two-file diff. Stage only those two paths, run the enabled
local-reference guard and cached whitespace check, and commit:

```text
feat: Add RiskScan Pending Reconciliation Selector
```

The implementation report must state the observed RED result, GREEN commands
and outcomes, commit SHA, exact changed paths, self-review, and preserved
constraints. It must state only controlled local behavior and no configured
runtime/store, payment, settlement, verification, finality, evidence, result,
deployment, or live claim.

## Root-owned integration after Task 1

1. Generate a frozen review package from the task base through the task commit.
2. Obtain an independent task review. Resolve any finding with a scoped
   correction and fresh re-review before acceptance.
3. Run root Node 22.21.1 `npm run typecheck`, `npm test`, and `npm run lint`.
   Run `npx --no-install next build --webpack` in `apps/web` after root
   typecheck. Run `npm run queue:check`, the enabled local-reference guard,
   and whitespace checks.
4. Obtain two fresh final Standards/Spec review generations against the exact
   module diff.
5. If every required result is clean, move the card to `60-done`, record
   validation and review evidence without claiming external/live behavior,
   commit root integration, push, and verify the remote `main` SHA.
