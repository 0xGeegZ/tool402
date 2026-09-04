# M01 Root Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking.

**Goal:** Deliver the minimum Node 22/npm 10 root workspace boundary for M01-T010 without adding application behavior or dependencies.

**Architecture:** A private root manifest declares only the two future workspace globs and fans quality commands out to workspaces with --if-present. Root configuration enforces the toolchain and exact dependency policy. The queue-validation entry point intentionally fails until the later validator task creates its implementation.

**Tech Stack:** Node 22, npm 10, npm workspaces.

**Spec:** [M01 Root Workspace Foundation Specification](../../specs/m01-root-workspace.md)

## Global Constraints

- Work in the current checkout; no Git worktree is authorized.
- Use a Node 22/npm 10 runtime for every npm command.
- Create only the root manifest, root lockfile, root npm configuration, and README update in the scaffold task.
- Declare workspaces exactly as apps/* then packages/*.
- Add no dependency, application/package directory, build orchestrator, queue-validator file, product behavior, credential, or external side effect.
- Each root quality command may no-op only while both workspace roots are absent; once either exists, it must fan out to declared workspaces.
- The deferred queue-validation command must remain nonzero until M01-T090.
- Every tracked document reference resolves in the commit that introduces it.

---

### Task 1: Root workspace scaffold

**Files:**

- Create: package.json
- Create: package-lock.json
- Create: .npmrc
- Modify: README.md

**Interfaces:**

- Consumes: the workspace and smoke contract in [M01 Root Workspace Foundation Specification](../../specs/m01-root-workspace.md).
- Produces: exact apps/* / packages/* workspace declaration; root typecheck, lint, test, build, and queue-validation scripts; Node/npm engine boundary.

- [ ] **Step 1: Capture the RED scaffold condition**

Run:

    npm pkg get workspaces
    npm run typecheck

Expected: both commands exit nonzero because no root npm workspace manifest exists.

- [ ] **Step 2: Create the constrained root records**

Create the root manifest with exactly this behavior:

    {
      "name": "tool402",
      "version": "0.0.0",
      "private": true,
      "packageManager": "npm@10.9.4",
      "engines": {
        "node": ">=22 <23",
        "npm": ">=10 <11"
      },
      "workspaces": [
        "apps/*",
        "packages/*"
      ],
      "scripts": {
        "build": "if [ -d apps ] || [ -d packages ]; then npm run --workspaces --if-present build; fi",
        "lint": "if [ -d apps ] || [ -d packages ]; then npm run --workspaces --if-present lint; fi",
        "queue:check": "node scripts/queue-check.mjs",
        "test": "if [ -d apps ] || [ -d packages ]; then npm run --workspaces --if-present test; fi",
        "typecheck": "if [ -d apps ] || [ -d packages ]; then npm run --workspaces --if-present typecheck; fi"
      }
    }

Create the root npm configuration:

    engine-strict=true
    save-exact=true

Generate only lockfile metadata:

    npm install --package-lock-only --ignore-scripts

Update the README to state that the root workspace has no application/package implementation yet, requires Node 22/npm 10, and has a deliberately unavailable queue-validation command until M01-T090.

- [ ] **Step 3: Run the GREEN and negative checks**

Run:

    node --version
    npm --version
    npm pkg get workspaces
    npm run typecheck
    npm --workspace=@tool402/not-present run typecheck
    node -e 'const p=require("./package.json"); const sections=[p.dependencies,p.devDependencies,p.optionalDependencies,p.peerDependencies].filter(Boolean); if (sections.flatMap(Object.values).some((v) => /^[~^*<>=]/.test(v))) process.exit(1)'
    npm run queue:check
    git diff --check

Expected: the runtime reports Node 22/npm 10; the workspace query and root typecheck pass; the unknown-workspace and queue-validation commands exit nonzero; the exact-version check and whitespace check pass.

- [ ] **Step 4: Review and commit the scaffold**

Obtain an independent task review against the specification. The root integrator then stages only the four root records and commits:

    git add package.json package-lock.json .npmrc README.md
    git commit -m "chore: Establish M01 root workspace boundary"

### Task 2: Accept the reviewed foundation card

**Files:**

- Modify: local queue state, catalog, decisions, ownership, and AI ledger records
- Move: the active M01-T010 card to its committed 60-done queue location

**Interfaces:**

- Consumes: the accepted Task 1 review and its command evidence.
- Produces: M01-T010 acceptance; M01-T090 as the only next technical gate.

- [ ] **Step 1: Verify the reviewed scaffold evidence**

Run the Task 1 commands again with the Node 22/npm 10 runtime and confirm the expected passing and nonzero outcomes. Run the local reference guard and whitespace check on the staged acceptance records.

- [ ] **Step 2: Record acceptance**

Move the card to 60-done, record the independent review outcome, and state that M01-T090 is next. Record exact newly created root paths in ownership only in this acceptance commit.

- [ ] **Step 3: Commit the queue integration**

    git add AI_USAGE.md docs/work-queue
    git commit -m "chore: Accept M01 root workspace foundation"

## Plan self-review

- Spec coverage: Task 1 covers the toolchain, exact workspace layout, no-workspace script guard, deferred validator, RED/GREEN smoke, negative checks, and root-only file boundary. Task 2 covers independent review, local acceptance, ownership, and the next gate.
- Placeholder scan: no open placeholder or unspecified implementation step remains.
- Interface consistency: Task 1 produces the named root scripts and evidence that Task 2 consumes; Task 2 does not create product behavior or widen the root boundary.
