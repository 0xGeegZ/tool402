# B01 Convex Module-Naming Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize the five existing internal Convex module filenames so the
development-only Convex tooling can load them, without changing any backend
function behavior or public surface.

**Architecture:** The change is a strict file-location amendment. A new
directory/import test declares the canonical underscore paths and unchanged
exports before the filenames move. The existing function-specific tests then
follow only their module URLs. No application code invokes a deployment.

**Tech Stack:** TypeScript 5.9, Convex 1.45, Node 22.21.1 built-in test runner,
and the existing backend workspace.

**Spec:** `docs/specs/b01-convex-module-naming-compatibility.md`

## Global constraints

- Depend on accepted M01-T030 and M04-T010 through M04-T070 records only as
  stable owned-function context; do not reopen their domain behavior.
- Rename only the five listed Convex function files. Update only their direct
  test import URLs, the new compatibility test, and code-styled current module
  paths in the five M04 specs, five M04 plans, five accepted M04 cards, and
  `docs/work-queue/FILE-OWNERSHIP.md`.
- Preserve function exports, handler bodies, validators, schema, indexes,
  public backend barrel, package metadata, and lockfile exactly.
- Before GREEN, establish that outside the five declared direct test imports,
  tracked production code contains no consumer of a legacy internal module
  address. The Human Ops diagnostic records that publication stopped before any
  function was published; the post-fix development-only publication check
  remains separate evidence.
- Do not run `convex dev`, read ignored configuration, publish/deploy, or claim
  that a local rename proves a configured development runtime. Human Ops owns
  that separate action.
- Keep the local reference guard enabled before every non-empty commit.

## Task 1: Test-only RED contract

**Files:**

- Create: `packages/backend/tests/convex-module-naming-compatibility.test.mjs`

- [ ] **Step 1: Define canonical module filename and export expectations.**

Read only the direct Convex TypeScript directory. Assert the five
underscore-separated function filenames from the local B01 contract are
present, their legacy hyphenated names are absent, and every filename matches
`/^[A-Za-z0-9_.]+\\.ts$/u`; do not assert an exact directory set. Dynamically
import each canonical function module and assert it has only its documented
export. Scan tracked Markdown records for each legacy module pathname and
require no result after GREEN.

- [ ] **Step 2: Observe RED.**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \\
  node --test packages/backend/tests/convex-module-naming-compatibility.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \\
  npm run typecheck --workspace @tool402/backend
```

Expected: the focused test fails because the canonical underscore modules do
not yet exist; backend typecheck remains green.

- [ ] **Step 3: Commit the observed RED contract.**

```bash
git add packages/backend/tests/convex-module-naming-compatibility.test.mjs
git commit -m "test: Add Convex Module Naming RED Contract"
```

## Task 2: Minimal compatibility rename

**Files:**

- Rename exactly the five module files in the B01 contract to their canonical
  underscore filenames.
- Modify only the five existing backend test import URLs that reference the
  renamed modules, plus current code-styled module path literals in the
  explicitly bounded M04 records.

- [ ] **Step 1: Move only the five module files.**

Use Git-aware renames so their contents remain unchanged. Do not rename
`convex.config.ts`, `schema.ts`, test names, function exports, or any source
identifier.

- [ ] **Step 2: Update only direct test module URLs.**

Point each existing function test to its corresponding canonical underscore
filename. Do not change its assertions except where a URL literal requires the
new name. Change only source-location literals in the five M04 specs, five M04
plans, five accepted M04 cards, and `docs/work-queue/FILE-OWNERSHIP.md`; do not
alter their behavioral text or acceptance outcomes.

- [ ] **Step 3: Verify GREEN.**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \\
  node --test packages/backend/tests/convex-module-naming-compatibility.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \\
  npm run typecheck --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \\
  npm run test --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \\
  npm run lint --workspace @tool402/backend
git diff --find-renames=100% --summary -- packages/backend/convex
git diff --find-renames=100% --numstat -- packages/backend/convex
```

Expected source audit: exactly five 100% source renames and no source hunks.
Verify the compatibility test confirms no legacy module pathname remains in the
bounded tracked Markdown records and no unlisted production or internal-address
consumer uses a legacy module address.

- [ ] **Step 4: Commit the minimal compatibility implementation.**

```bash
git add packages/backend/convex packages/backend/tests \\
  docs/specs/m04-riskscan-internal-request-writer.md \\
  docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md \\
  docs/specs/m04-riskscan-pending-verification-settlement-record-writer.md \\
  docs/specs/m04-riskscan-pending-settlement-reader.md \\
  docs/specs/m04-riskscan-pending-reconciliation-selector.md \\
  docs/superpowers/plans/2026-09-05-m04-riskscan-internal-request-writer.md \\
  docs/superpowers/plans/2026-09-05-m04-riskscan-candidate-settlement-attempt-writer.md \\
  docs/superpowers/plans/2026-09-05-m04-riskscan-pending-verification-settlement-record-writer.md \\
  docs/superpowers/plans/2026-09-05-m04-riskscan-pending-settlement-reader.md \\
  docs/superpowers/plans/2026-09-05-m04-riskscan-pending-reconciliation-selector.md \\
  docs/work-queue/queue/60-done/M04-T030-riskscan-internal-request-writer.md \\
  docs/work-queue/queue/60-done/M04-T040-riskscan-candidate-settlement-attempt-writer.md \\
  docs/work-queue/queue/60-done/M04-T050-riskscan-pending-verification-settlement-record-writer.md \\
  docs/work-queue/queue/60-done/M04-T060-riskscan-pending-settlement-reader.md \\
  docs/work-queue/queue/60-done/M04-T070-riskscan-pending-reconciliation-selector.md \\
  docs/work-queue/FILE-OWNERSHIP.md
git commit -m "fix: Normalize Convex Module Names"
```

## Task 3: Integration evidence

- [ ] Run root typecheck, test, lint, clean-install dry run, queue check,
  reference guard, and whitespace check under Node 22.21.1.
- [ ] Obtain an independent task review of the exact renamed files, imports,
  canonical-name test, and no-behavior-change boundary.
- [ ] Record local code acceptance only after all local checks pass. Keep the
  development-only publish verification in `HA-CONVEX-DEV-001` for Human Ops;
  do not invoke it from this task.
