# M01 Queue Check Foundation Specification

## Status and authority

This is the minimum local validation specification for M01-T090. It governs only deterministic checks of committed local repository records. It does not authorize product behavior, external integration, accounts, funding, wallets, payments, testnet activity, deployment, narration, or submission.

M01-T010 is accepted. M01-T090 is the required validation gate before any broader M01 scaffold card may be evaluated for readiness.

## Outcome

The root queue:check command becomes a real, fail-closed validator. It replaces the prior intentional missing-file failure with an explicit success signal for a coherent local foundation state or stable diagnostics for an invalid one.

## Inputs and boundary

The validator reads only:

1. The root package manifest.
2. The local queue state and task catalog.
3. Local task cards named by the catalog.
4. The local specification paths named by queue state.
5. Relative Markdown links in local Markdown files under docs and in root Markdown records.
6. The exact local Markdown parser declared by the root package boundary.

It does not make network requests, inspect Git remotes, read credentials, write repository files, invoke a package installation, or make a runtime/product claim.

## Required checks

The validator must report all detected failures in one run. A valid repository produces exactly QUEUE_CHECK_OK on standard output and exits zero. Any invalid state writes one or more CODE: message diagnostics to standard error and exits one.

### Root package boundary

The manifest must remain private, use npm 10.9.4, require Node >=22 <23 and npm >=10 <11, and declare exactly apps/* then packages/*. It must expose typecheck, lint, test, build, and queue:check scripts. The queue:check script must target the local validator path. Its sole allowed dependency declaration is exact devDependency `marked` at `18.0.11`; runtime, optional, peer, bundled, and all other development dependency declarations must be absent.

### Catalog and task-card coherence

The catalog has exactly the established nine columns and each task identifier is unique. Every catalog local-record path is repository-relative, exists as a regular file, and is inside the queue directory matching its catalog state. Each named card declares the same queue state and tier as its catalog row.

Allowed card states are 00-inbox, 10-ready, 20-active, 30-task-review, 40-module-review, 50-blocked, 60-done, and 90-cancelled.

### Dependencies and state

Each dependency expressed as a task identifier followed by accepted must name a distinct catalog task in 60-done. A task cannot depend on itself. The current task recorded in queue state must exist in the catalog and use the same state.

Every comma-separated local specification path in queue state must be repository-relative, remain inside the repository, and exist as a regular file. The value none is permitted only when no local specification is active.

### Local Markdown links

For local Markdown files under docs and root Markdown records, use the exact parser to resolve standard relative Markdown links, including inline destinations, titles, references, escaped text, nested link text, and code semantics. Ignore fragment-only, mail, and web links. A local link must remain inside the repository and name an existing file after its optional fragment is removed. Resolve original decoded path components in order: inspect every existing component physically before processing a later `..` component, so a symlink traversal outside the repository is always an escape. A missing or escaping target is invalid.

## Required diagnostics

Use these stable diagnostic codes:

- PACKAGE_CONTRACT_INVALID
- CATALOG_PARSE_ERROR
- DUPLICATE_TASK_ID
- LOCAL_RECORD_MISSING
- TASK_STATE_MISMATCH
- TASK_TIER_MISMATCH
- DEPENDENCY_NOT_ACCEPTED
- CURRENT_TASK_MISMATCH
- LOCAL_SPECIFICATION_MISSING
- LOCAL_REFERENCE_MISSING
- LOCAL_REFERENCE_ESCAPE
- ARGUMENT_ERROR

## Tests and evidence

Use the Node native test runner. The validator may use only the exact parser declared above; no other dependency is authorized. The executable RED contract must assert that a coherent temporary repository exits zero before the validator exists; it fails by assertion while the validator is absent. The GREEN suite must cover:

1. A coherent temporary repository that exits zero and prints QUEUE_CHECK_OK.
2. A root package contract drift that reports PACKAGE_CONTRACT_INVALID.
3. A catalog/card state mismatch that reports TASK_STATE_MISMATCH.
4. A dependency that is not accepted that reports DEPENDENCY_NOT_ACCEPTED.
5. A missing local specification path that reports LOCAL_SPECIFICATION_MISSING.
6. A broken relative Markdown link that reports LOCAL_REFERENCE_MISSING.

Run the targeted Node native test file, npm run queue:check, npm root quality commands, and git diff --check. The local reference guard must pass before every non-empty commit.

## Failure semantics

The validator never masks malformed input, parser failures, a missing file, an escaping component, or an unknown argument as success. It emits only local paths and diagnostic codes, never credentials or external-source values. A failure blocks the current card's acceptance and must be fixed through the RED/GREEN/review sequence.
