# Runtime file and resource ownership

CP-S00 reserves docs/work-queue, AI_USAGE.md, generated files, and lockfiles to the root integrator. Local task cards declare owned paths and resource locks before entering 10-ready.

M00-T070 reserves its card, qualification matrix, STATE.md, HUMAN-ACTIONS.md, DECISIONS.md, TASK-CATALOG.md, and AI_USAGE.md to the root integrator. M00-T080 reserves its card, STATE.md, FILE-OWNERSHIP.md, TASK-CATALOG.md, DECISIONS.md, HUMAN-ACTIONS.md, AI_USAGE.md, ORCHESTRATOR-RUNBOOK.md, and WORKTREE-POLICY.md to the root integrator.

P00-T010 reserves its card, docs/product/OVERVIEW.md, STATE.md, TASK-CATALOG.md, FILE-OWNERSHIP.md, DECISIONS.md, and AI_USAGE.md to the root integrator.

M01-T010 reserves its card, docs/specs/m01-root-workspace.md, docs/superpowers/plans/2026-09-04-m01-root-workspace.md, package.json, package-lock.json, .npmrc, README.md, and its root-integrator queue records.

M01-T090 is accepted; its record comprises its card, docs/specs/m01-queue-check.md, docs/superpowers/plans/2026-09-04-m01-queue-check.md, scripts/queue-check.mjs, tests/queue-check.test.mjs, and its root-integrator queue records. The root integrator alone owned the controlled parser change to package.json and package-lock.json.

M01-T011 is accepted; its record comprises its card, docs/specs/m01-node-runtime-selection.md, docs/superpowers/plans/2026-09-04-m01-node-runtime-selection.md, .nvmrc, README.md, and its root-integrator queue records.

M01-T020, M01-T030, and M01-T040 are accepted foundation records. The root integrator alone owns root package metadata, the lockfile, queue state, and integration evidence.

M02-T010, M02-T020, M02-T030, and M02-T040 are accepted delivery records. M02-T030 comprises its card, docs/specs/m02-riskscan-backend-projection.md, docs/superpowers/plans/2026-09-04-m02-riskscan-backend-projection.md, `packages/backend/src/risk-scan-projection.ts`, `packages/backend/src/index.ts`, and `packages/backend/tests/risk-scan-projection.test.mjs`. M02-T040 comprises its card, docs/ui/UI-S01.md, docs/superpowers/plans/2026-09-04-m02-ui-s01-landing-explore.md, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/explore/page.tsx`, `apps/web/src/components/landing/**`, `apps/web/src/components/discovery/**`, `apps/web/public/brand/mascot-wave.png`, and focused UI-S01 tests. The root alone owns package metadata, the lockfile, queue state, local UI ledgers, and integration evidence.

M02-T050 is an accepted delivery record comprising its card, docs/specs/m02-riskscan-quick.md, docs/superpowers/plans/2026-09-04-m02-riskscan-quick.md, `packages/core/src/risk-scan-quick.ts`, `packages/core/src/index.ts`, and `packages/core/test/risk-scan-quick.test.mjs`.

M02-T060 is an accepted delivery record comprising its card, docs/specs/m02-riskscan-x402-api.md, docs/superpowers/plans/2026-09-04-m02-riskscan-x402-api.md, `apps/web/src/app/api/riskscan/route.ts`, `apps/web/src/lib/riskscan-x402.ts`, and `apps/web/tests/riskscan-api.test.mjs`. The root retains package metadata, the lockfile, queue state, and integration evidence.

M02-T070 is an accepted delivery record comprising its card, docs/ui/UI-S02.md, docs/ui/IMPORT-LEDGER.md, docs/superpowers/plans/2026-09-05-m02-ui-s02-riskscan-detail.md, `apps/web/src/app/explore/riskscan/page.tsx`, `apps/web/src/components/riskscan/detail/**`, `apps/web/src/components/discovery/riskscan-discovery-card.tsx`, `apps/web/tests/riskscan-detail.test.mjs`, and `apps/web/tests/landing-explore.test.mjs`. The root retains queue records and shared UI ledger state.

M02-T080 is in module review for local UI-S03 delivery. Its implementation lane owns `apps/web/src/app/explore/riskscan/try/page.tsx`, `apps/web/src/components/riskscan/request/**`, `apps/web/tests/riskscan-request-state.test.mjs`, and `apps/web/tests/riskscan-try.test.mjs`; it may amend `apps/web/src/components/riskscan/detail/riskscan-detail.tsx` and `apps/web/tests/riskscan-detail.test.mjs` only for the committed local Try link. The root owns the card, UI-S03 manifest, UI ledger, plan, queue state, catalog, decisions, and integration evidence. The accepted API route and server-only x402 helper are not owned by this card.

Future active implementation cards must have disjoint owned paths and resource boundaries. Shared-file work is an explicit root integration reservation. Wallets, credentials, funded accounts, partner configuration, and deployments remain human-controlled resources; no card or agent infers authority over them.
