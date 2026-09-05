# RiskScan Internal Request Writer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one internal, idempotent Convex writer for a canonical initial RiskScan request.

**Architecture:** The internal mutation receives the six already-safe fields and delegates normalization to the accepted admission boundary. It queries `riskScanRequests` through the existing `by_request_ref` index, inserts one canonical `payment_required` document when absent, returns an exact replay without an insert, and rejects a conflicting reference before any insert. Handler tests use a controlled database context and prove code-level decisions only; they do not represent a configured runtime or a live durable store.

**Tech Stack:** TypeScript, Convex 1.45, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m04-riskscan-internal-request-writer.md`

## Global constraints

- Keep the writer internal-only. Do not add public functions, generated output, API/UI wiring, package or lockfile changes, runtime configuration, external-store assertions, payment/settlement behavior, accounts, wallets, deployment, evidence, or live claims.
- Route all input through `admitRiskScanDurableRequest`; do not duplicate its validation or relax its safe-object boundary.
- Treat a matching `requestRef` as replay only when all initial document fields match exactly. A conflict must throw a generic `RangeError` before an insertion and must not expose values.
- Use the local Node 22.21.1 runtime for all commands.

## File structure

- Create: `packages/backend/convex/riskscan-requests.ts`
- Modify: `packages/backend/convex/tsconfig.json`
- Create: `packages/backend/tests/risk-scan-internal-request-writer.test.mjs`

## Task 1: Register and verify the internal request writer

**Files:**

- Create: `packages/backend/convex/riskscan-requests.ts`
- Modify: `packages/backend/convex/tsconfig.json`
- Create: `packages/backend/tests/risk-scan-internal-request-writer.test.mjs`

- [ ] **Step 1: Write the failing executable contract first.**

  Import the missing mutation module and call its registered handler with this valid argument object:

  ```js
  const validArgs = {
    publicId: "risk_402",
    requestRef: " request-402 ",
    subjectRefHash: "a".repeat(64),
    inputHash: "b".repeat(64),
    createdAt: 1n,
    updatedAt: 1n,
  };
  ```

  Build a controlled `ctx.db` that records the query table, index name, equality key/value, inserts, and `unique()` result. Cover registration metadata and validator shape; canonical creation with only the seven safe document fields; exact replay without a second insertion; conflict rejection with zero insertion; and invalid admission rejection before either query or insert. Assert exact safe return keys for both `created` and `replayed` results.

- [ ] **Step 2: Run the focused test and confirm it is RED.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-internal-request-writer.test.mjs
  ```

  Expected: failure because the writer module does not exist yet.

- [ ] **Step 3: Implement the minimal internal mutation.**

  In `packages/backend/convex/riskscan-requests.ts`, import `internalMutationGeneric` and `v`, then import `admitRiskScanDurableRequest` plus its document type from the local source module using its `.ts` extension. Register `recordInitialRiskScanRequest` with four `v.string()` and two `v.int64()` arguments plus an object return validator containing `created`/`replayed`, an ID for `riskScanRequests`, and `payment_required`.

  The handler must admit the complete args object, query `riskScanRequests` with `by_request_ref` and canonical `requestRef`, then either insert the admitted document, return an exact replay, or throw `new RangeError("RiskScan request reference conflicts with a different durable request")`. Compare `publicId`, `requestRef`, `subjectRefHash`, `inputHash`, `state`, `createdAt`, and `updatedAt` exactly. Do not mutate an existing document or touch another table.

  Add `"allowImportingTsExtensions": true` to the Convex TypeScript compiler options so the direct local TypeScript import is checked correctly.

- [ ] **Step 4: Run focused and backend verification.**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-internal-request-writer.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/backend
  ```

- [ ] **Step 5: Review and commit the owned implementation only.**

  Verify no public surface, config, generated file, or external claim entered the diff. Run the enabled local-reference guard and `git diff --check`, then make the implementation commit:

  ```text
  feat: Add RiskScan Internal Request Writer
  ```

## Final verification

- [ ] Focused writer tests are green after the observed RED.
- [ ] The backend workspace typecheck, test, and lint commands are green on Node 22.21.1.
- [ ] Root typecheck, test, queue validation, local-reference guard, and diff checks are green before acceptance.
- [ ] Independent task review and two fresh independent Standards/Spec review generations find no Critical or Important issue.
- [ ] The completion record distinguishes local code-level handler coverage from runtime configuration, deployment, external-store proof, payment, settlement, verification, evidence, and live claims.
