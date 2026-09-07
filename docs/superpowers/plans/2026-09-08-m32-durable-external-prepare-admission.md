# M32 Durable External-Prepare Admission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox syntax for tracking.

**Goal:** Add an internal Convex generic durable admission/recovery data plane
for an already authenticated external-prepare command, without claiming that a
serialized input retains M25/M31 process-local provenance or enabling any
external operation.

**Architecture:** A separate set of generic tables holds the current
server-side authority record, replay claims, and one generic `PREPARED`
attempt. An internal mutation revalidates its serialized input against the
current authority and durable clock, then applies replay before idempotency in
one transaction. An internal query supports exact-context recovery. A narrow
M04 test/spec amendment changes only global-schema assertion ownership, not
RiskScan behavior.

**Tech Stack:** TypeScript 5.9, Convex 1.45 internal generic functions,
Node 22.21.1 built-in test runner, existing Core M26 parser, no new package,
no generated output, and no publication.

**Spec:** docs/specs/m32-durable-external-prepare-admission.md

## Global constraints

- Modify only the M32 authority/queue records, the narrow M04 schema-test/spec
  compatibility amendment, `packages/backend/convex/schema.ts`, two new
  underscore-safe internal Convex modules, and focused backend tests.
- Treat serialized input as data, never as M25/M31 capability proof. Do not
  fake an M31 synchronous `NEW` result before durable work completes.
- Re-read exactly one current authority row within the mutation. Require exact
  signer, principal, role, authority version, enabled state, and ownership
  predicate before replay or idempotency handling.
- Recheck canonical command expiry against the Convex server clock before a
  write. Use no caller-supplied clock.
- Use M31's accepted rule: only `NEW` writes one replay claim and one
  `PREPARED` attempt; exact idempotency replay and conflict write nothing.
- Store M26 target/hash solely as opaque signed context. Do not compare them to
  a target policy or turn them into executable configuration.
- Use only `internalMutationGeneric` and `internalQueryGeneric` with exact args
  and returns validators. Every table read must use its declared index and a
  bounded `take(2)`.
- Do not create authority records, publish Convex functions, read env/config,
  add HTTP, invoke a provider, or perform an external action.

---

### Task 1: Test-only RED schema and durable-boundary contract

**Files:**

- Modify: `docs/specs/m04-riskscan-durable-schema.md`
- Modify: `packages/backend/tests/risk-scan-schema.test.mjs`
- Create: `packages/backend/tests/external-prepare-command-durable-schema.test.mjs`
- Create: `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- Create: `packages/backend/tests/external-prepare-command-recovery.test.mjs`

- [ ] Change the M04 focused test to extract and exactly assert the unchanged
  six-table RiskScan subset; it must still reject a changed RiskScan table,
  field, optionality, ID target, or index.
- [ ] Add an M32 schema test that dynamically imports the existing schema and
  fails until exactly `commandAuthorities`,
  `externalPrepareCommandReplayClaims`, and
  `externalPrepareCommandAttempts` exist with the contract fields/indexes.
- [ ] Add focused mutation/query tests that dynamically import the absent
  internal modules and build controlled `ctx.db` objects. Specify current
  authority rechecks, durable expiry rejection before a query/write,
  replay-first behavior, exact context matching, only-NEW writes, opaque
  target/hash handling, malformed/duplicate-row failures, and recovery reads.
- [ ] Add static scope checks for underscore-safe filenames, internal-only
  functions, and absence of provider/wallet/ATS/HTTP/configuration/public API
  behavior.
- [ ] Run the focused tests and confirm RED is limited to the absent M32 schema
  and modules. Commit tests only:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  git add docs/specs/m04-riskscan-durable-schema.md packages/backend/tests/risk-scan-schema.test.mjs packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  git commit -m "test: Add Durable Command Admission RED Contract"
  ```

### Task 2: Add the generic durable data plane

**Files:**

- Modify: `packages/backend/convex/schema.ts`
- Create: `packages/backend/convex/external_prepare_command_admission.ts`
- Create: `packages/backend/convex/external_prepare_command_recovery.ts`
- Test: the focused Task 1 tests

- [ ] Add only the three M32 tables and indexes from the local contract;
  preserve every existing M04 RiskScan definition exactly.
- [ ] Implement the internal admission mutation with closed validators,
  canonical-data checks, current-authority revalidation, server-clock expiry,
  replay-first lookup, exact idempotency/context comparison, and only-NEW
  atomic attempt plus replay-claim insertion.
- [ ] Implement the internal recovery query with a bounded idempotency index
  read and exact stored-context comparison.
- [ ] Return only the documented closed statuses/attempt shape; never expose a
  raw body, signature, key, provider result, target authorization, or external
  capability.
- [ ] Run GREEN focused tests and backend quality. Commit only M32 production
  paths and focused tests:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  git add packages/backend/convex/schema.ts packages/backend/convex/external_prepare_command_admission.ts packages/backend/convex/external_prepare_command_recovery.ts packages/backend/tests/risk-scan-schema.test.mjs packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  git commit -m "feat: Add Durable Command Admission"
  ```

### Task 3: Verify and review

- [ ] Run complete local quality gates:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run queue:check
  git diff --check
  ```

- [ ] Obtain an independent task review of authority freshness, expiry,
  replay/idempotency ordering, schema compatibility, opaque claims, recovery,
  scope exclusions, and RED chronology.
- [ ] Obtain two fresh clean Standards-and-Spec module-review generations.
  Resolve every Critical, Important, and Minor finding before queue acceptance.
