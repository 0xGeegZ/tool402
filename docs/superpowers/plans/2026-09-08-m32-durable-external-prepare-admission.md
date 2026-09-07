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
- Before any `ctx.db` access, re-parse M26, recompute M30's exact JCS/Keccak
  payload hash, require exact derived replay identity, byte-equal canonical
  command/payload expiry, and all four server-clock rules. Use no caller-
  supplied clock.
- Only `NEW` creates one `PREPARED` attempt, but every fully valid fresh nonce
  is atomically claimed: an exact idempotency repeat links its claim to the
  existing attempt and a conflict records an unlinked claim. A later reuse of
  either nonce is `COMMAND_REPLAYED`.
- Store M26 target/hash solely as opaque signed context. Do not compare them to
  a target policy or turn them into executable configuration.
- Use only `internalMutationGeneric` and `internalQueryGeneric` with exact args
  and returns validators. Every table read must use its declared index and a
  bounded `take(2)`.
- Do not create authority records, publish Convex functions, read env/config,
  add HTTP, invoke a provider, or perform an external action.

---

### Task 1: Record the post-acceptance compatibility corrections

**Files:**

- Modify: `docs/specs/m31-external-prepare-command-admission.md`
- Modify: `docs/work-queue/queue/60-done/M31-T010-external-prepare-command-admission.md`
- Modify: `docs/superpowers/plans/2026-09-07-m31-external-prepare-command-admission.md`
- Modify: `docs/work-queue/queue/60-done/M04-T010-riskscan-durable-schema.md`
- Modify: `docs/superpowers/plans/2026-09-05-m04-riskscan-durable-schema.md`

- [ ] Amend only the later durable-contract wording: a fresh valid nonce is
  always claimed; only `NEW` creates a `PREPARED` attempt. Record that the M31
  source and its accepted synchronous behavior remain unchanged.
- [ ] Amend the M04 historical card/plan to define its preserved boundary as
  the exact `riskScan*` namespace, allowing separately owned non-RiskScan
  tables and rejecting any unlisted RiskScan table.
- [ ] Commit this documentation-only correction before the RED contract. It
  does not authorize production code, Convex publication, authority
  provisioning, or an external action.

### Task 2: Test-only RED schema and durable-boundary contract

**Files:**

- Modify: `packages/backend/tests/risk-scan-schema.test.mjs`
- Create: `packages/backend/tests/external-prepare-command-durable-schema.test.mjs`
- Create: `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- Create: `packages/backend/tests/external-prepare-command-recovery.test.mjs`

- [ ] Change the M04 focused test to enumerate all exported `riskScan*` tables
  and exactly assert the unchanged six-table set; it must reject an extra or
  changed RiskScan table, field, optionality, ID target, or index while
  allowing M32 non-RiskScan tables.
- [ ] Add an M32 schema test that dynamically imports the existing schema and
  fails until exactly `commandAuthorities`,
  `externalPrepareCommandReplayClaims`, and
  `externalPrepareCommandAttempts` exist with concrete literal/union,
  optionality, document-ID-target, int64, field, and index shapes.
- [ ] Add focused mutation/query tests that dynamically import the absent
  internal modules and build controlled `ctx.db` objects. Specify current
  authority rechecks; zero database access for malformed serialized command,
  M26, hash, replay identity, expiry-equality, or server-clock failures;
  replay-first behavior; exact context matching; linked fresh-nonce idempotent
  claims; unlinked conflict claims; opaque target/hash handling;
  malformed/duplicate-row failures; and full stored-payload recovery reads.
- [ ] Add static scope checks for underscore-safe filenames, internal-only
  functions, and absence of provider/wallet/ATS/HTTP/configuration/public API
  behavior.
- [ ] Run the focused tests and confirm RED is limited to the absent M32 schema
  and modules. Commit tests only:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-schema.test.mjs packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  git add packages/backend/tests/risk-scan-schema.test.mjs packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  git commit -m "test: Add Durable Command Admission RED Contract"
  ```

### Task 3: Add the generic durable data plane

**Files:**

- Modify: `packages/backend/convex/schema.ts`
- Create: `packages/backend/convex/external_prepare_command_admission.ts`
- Create: `packages/backend/convex/external_prepare_command_recovery.ts`
- Test: the focused Task 2 tests

- [ ] Add only the three M32 tables and indexes from the local contract;
  preserve every existing M04 RiskScan definition exactly.
- [ ] Implement the internal admission mutation with closed validators, full
  rebinding before database access, current-authority revalidation, replay-
  first lookup, exact idempotency/context comparison, and atomic fresh-nonce
  claim insertion. Only `NEW` adds a `PREPARED` attempt.
- [ ] Implement the internal recovery query with a bounded idempotency index
  read, full stored M26 reconstruction/re-hash, and exact stored-context
  comparison. It does not re-read authority or reapply expiry to a committed
  attempt.
- [ ] Use the exact mutation return union: `NEW` and
  `IDEMPOTENCY_REPLAYED` carry only `attemptId` and literal `PREPARED`;
  `COMMAND_REPLAYED` and `IDEMPOTENCY_CONFLICT` carry status only. The recovery
  result is either `null` or the exact persisted `PREPARED` snapshot. Never
  expose a raw body, signature, key, provider result, target authorization, or
  external capability.
- [ ] Run GREEN focused tests and backend quality. Commit only M32 production
  paths and focused tests:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/risk-scan-schema.test.mjs packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  git add packages/backend/convex/schema.ts packages/backend/convex/external_prepare_command_admission.ts packages/backend/convex/external_prepare_command_recovery.ts packages/backend/tests/risk-scan-schema.test.mjs packages/backend/tests/external-prepare-command-durable-schema.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs packages/backend/tests/external-prepare-command-recovery.test.mjs
  git commit -m "feat: Add Durable Command Admission"
  ```

### Task 4: Verify and review

- [ ] Run complete local quality gates:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run queue:check
  git diff --check
  ```

- [ ] Obtain an independent task review of serialized rebinding, authority
  freshness, full time rules, replay/idempotency ordering and fresh-nonce
  consumption, schema compatibility, opaque claims, recovery, scope
  exclusions, and RED chronology.
- [ ] Obtain two fresh clean Standards-and-Spec module-review generations.
  Resolve every Critical, Important, and Minor finding before queue acceptance.
