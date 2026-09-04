# Runtime file and resource ownership

CP-S00 reserves docs/work-queue, AI_USAGE.md, generated files, and lockfiles to the root integrator. Local task cards declare owned paths and resource locks before entering 10-ready.

M00-T070 reserves its card, qualification matrix, STATE.md, HUMAN-ACTIONS.md, DECISIONS.md, TASK-CATALOG.md, and AI_USAGE.md to the root integrator. M00-T080 reserves its card, STATE.md, FILE-OWNERSHIP.md, TASK-CATALOG.md, DECISIONS.md, HUMAN-ACTIONS.md, AI_USAGE.md, ORCHESTRATOR-RUNBOOK.md, and WORKTREE-POLICY.md to the root integrator.

P00-T010 reserves its card, docs/product/OVERVIEW.md, STATE.md, TASK-CATALOG.md, FILE-OWNERSHIP.md, DECISIONS.md, and AI_USAGE.md to the root integrator.

M01-T010 reserves its card, docs/specs/m01-root-workspace.md, docs/superpowers/plans/2026-09-04-m01-root-workspace.md, package.json, package-lock.json, .npmrc, README.md, and its root-integrator queue records.

M01-T090 is accepted; its record comprises its card, docs/specs/m01-queue-check.md, docs/superpowers/plans/2026-09-04-m01-queue-check.md, scripts/queue-check.mjs, tests/queue-check.test.mjs, and its root-integrator queue records. The root integrator alone owned the controlled parser change to package.json and package-lock.json.

M01-T011 is accepted; its record comprises its card, docs/specs/m01-node-runtime-selection.md, docs/superpowers/plans/2026-09-04-m01-node-runtime-selection.md, .nvmrc, README.md, and its root-integrator queue records.

M01-T020 reserves its card, docs/specs/m01-core-workspace.md, and packages/core/**. M01-T030 reserves its card, docs/specs/m01-backend-workspace.md, and packages/backend/**. M01-T040 reserves its card, docs/specs/m01-web-workspace.md, and apps/web/**. The root integrator alone owns root package metadata, the lockfile, queue state, and integration evidence.

Two active implementation cards must have disjoint owned paths and resource boundaries. Shared-file work is an explicit root integration reservation. Wallets, credentials, funded accounts, partner configuration, and deployments remain human-controlled resources; no card or agent infers authority over them.
