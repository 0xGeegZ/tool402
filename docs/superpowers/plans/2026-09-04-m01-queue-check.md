# M01 Queue Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking.

**Goal:** Deliver a Node validator that uses one exact local Markdown parser to make the local queue state mechanically trustworthy before broader M01 scaffolds begin.

**Architecture:** A Node command reads only local files and builds a list of stable diagnostics. `marked@18.0.11` tokenizes local Markdown, while a small physical path resolver preserves component order and rejects symlink escapes. Its command-line interface resolves a repository root, emits QUEUE_CHECK_OK for a coherent state, and otherwise exits one after writing all diagnostics. Node native tests create isolated temporary repositories and exercise the executable interface rather than a mock.

**Tech Stack:** Node 22, npm 10, Node native test runner, exact devDependency `marked@18.0.11`.

**Spec:** [M01 Queue Check Foundation Specification](../../specs/m01-queue-check.md)

## Global Constraints

- Work in the current checkout; no Git worktree is authorized.
- Use Node 22/npm 10 for every command.
- Create only the validator and its Node native test records; root queue controls remain the root integrator's responsibility.
- The root integrator alone may add the exact parser devDependency and lockfile record authorized by the amended local specification. Do not modify npm configuration, README, product files, or application/package directories.
- Check local repository state only. Do not make network calls, inspect remotes, read credentials, or output external-source values.
- A valid queue prints exactly QUEUE_CHECK_OK and exits zero. Invalid state emits stable local diagnostic codes and exits one.
- Every tracked document reference resolves in the commit that introduces it.

---

### Task 1: Fail-closed queue validator

**Files:**

- Create: scripts/queue-check.mjs
- Create: tests/queue-check.test.mjs

**Interfaces:**

- Consumes: root package manifest, queue state, task catalog, catalog-named cards, local specification paths, and relevant local Markdown links.
- Produces: an executable queue:check target with --root PATH support for tests; exact zero/one exit behavior; stable diagnostics from the specification.

- [ ] **Step 1: Write the RED executable contract**

Create the Node native test file first. It must build a temporary coherent repository with:

    package.json
    README.md
    docs/work-queue/STATE.md
    docs/work-queue/TASK-CATALOG.md
    docs/work-queue/queue/60-done/P00-T010.md
    docs/work-queue/queue/00-inbox/M01-T090.md

The fixture manifest uses the exact toolchain, workspace, script, and no-dependency contract from the specification. The catalog has the established nine columns. The active card depends on P00-T010 accepted, and the current task is M01-T090 in 00-inbox.

Invoke the absent validator through a child Node process with --root set to the temporary repository. Assert that the coherent fixture exits zero and prints QUEUE_CHECK_OK.

Run:

    node --test tests/queue-check.test.mjs

Expected: the assertion fails because scripts/queue-check.mjs does not exist yet.

- [ ] **Step 2: Implement the smallest validator**

Create scripts/queue-check.mjs with these pure stages, each appending diagnostic objects with a code and local message:

1. Parse only --root PATH; reject an unknown or incomplete argument with ARGUMENT_ERROR.
2. Read and validate the root package contract. On any drift append PACKAGE_CONTRACT_INVALID.
3. Parse the catalog table into exactly nine fields per data row. Reject malformed rows with CATALOG_PARSE_ERROR and duplicate identifiers with DUPLICATE_TASK_ID.
4. For every catalog row, resolve its local-record path inside the repository, require the queue-state directory to match, read its card, and compare Queue state and Tier. Use LOCAL_RECORD_MISSING, TASK_STATE_MISMATCH, or TASK_TIER_MISMATCH as appropriate.
5. Parse accepted dependencies, reject a self-dependency, unknown dependency, or anything not in 60-done with DEPENDENCY_NOT_ACCEPTED.
6. Parse CURRENT_TASK and local specification paths from queue state. Use CURRENT_TASK_MISMATCH or LOCAL_SPECIFICATION_MISSING for any invalid value.
7. Recursively scan local Markdown files under docs and root Markdown records with the exact parser, resolve relative links through a component-preserving physical resolver, and use LOCAL_REFERENCE_ESCAPE or LOCAL_REFERENCE_MISSING for invalid targets.
8. Print exactly QUEUE_CHECK_OK and exit zero when no diagnostics exist. Otherwise print every CODE: message line to standard error and exit one.

Keep all filesystem resolution inside the requested root and never write to it.

- [ ] **Step 3: Make the full positive and negative suite GREEN**

Extend the Node native test fixture to assert each specification case through the command interface:

    coherent fixture => status 0 and stdout QUEUE_CHECK_OK
    altered package workspace list => status 1 and PACKAGE_CONTRACT_INVALID
    card Queue state differing from catalog => status 1 and TASK_STATE_MISMATCH
    dependency card outside 60-done => status 1 and DEPENDENCY_NOT_ACCEPTED
    missing local specification path => status 1 and LOCAL_SPECIFICATION_MISSING
    Markdown link to a missing local file => status 1 and LOCAL_REFERENCE_MISSING

Run:

    node --test tests/queue-check.test.mjs
    npm run queue:check
    npm run typecheck
    npm run lint
    npm run test
    npm run build
    git diff --check

Expected: every positive command exits zero; each negative case is asserted by the Node test suite rather than ignored.

### Task 1A: Controlled Markdown-parser migration

**Files:**

- Modify: package.json
- Modify: package-lock.json
- Modify: scripts/queue-check.mjs
- Modify: tests/queue-check.test.mjs

- [ ] **Step 1: Add RED parser and confinement cases**

Add executable cases for titled inline links, escaped punctuation, unmatched code delimiters, nested link text, and raw traversal through an outward symlink followed by `..`. Each case must fail against the preceding scanner implementation.

- [ ] **Step 2: Add the exact parser through root integration**

The root integrator installs only `marked@18.0.11` as an exact devDependency, updates the lockfile, and confirms that no other direct dependency section appears. The validator replaces handwritten Markdown tokenization with parser tokens and retains only a small component-preserving filesystem resolver.

- [ ] **Step 3: Verify and review the migration**

Run the native suite, queue command, root quality commands, dependency-boundary assertion, whitespace check, and local reference guard under Node 22/npm 10. Obtain fresh independent review before acceptance.

- [ ] **Step 4: Review and commit the validator**

Obtain an independent task review against the specification. The root integrator stages only the validator and test records and commits:

    git add scripts/queue-check.mjs tests/queue-check.test.mjs
    git commit -m "feat: Add M01 queue validation gate"

### Task 2: Accept the reviewed validation gate

**Files:**

- Modify: local queue state, catalog, decisions, ownership, and AI ledger records
- Move: the active M01-T090 card to its committed 60-done queue location

**Interfaces:**

- Consumes: accepted Task 1 review and fresh command evidence.
- Produces: M01-T090 acceptance and a fact-based evaluation point for the next dependency-satisfied M01 scaffold card.

- [ ] **Step 1: Verify fresh evidence**

Re-run the targeted Node native tests, npm run queue:check, npm root quality commands, local reference guard, and whitespace check at the reviewed candidate head.

- [ ] **Step 2: Record acceptance**

Move the card to 60-done, record the independent review outcome, and record exact validator/test ownership only in this acceptance commit. Re-scan the local inbox and accepted dependencies before selecting the next card.

- [ ] **Step 3: Commit the queue integration**

    git add AI_USAGE.md docs/work-queue
    git commit -m "chore: Accept M01 queue validation gate"

## Plan self-review

- Spec coverage: Task 1 covers command behavior, package boundary, catalog/card coherence, dependencies, state, local specifications, Markdown links, all required diagnostics, and positive/negative tests. Task 2 covers independent review and root-only acceptance.
- Placeholder scan: no open placeholder or unspecified implementation step remains.
- Interface consistency: Task 1 produces the command and evidence Task 2 consumes; Task 2 does not change validator behavior or widen the implementation boundary.
