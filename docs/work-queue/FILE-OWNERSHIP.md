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

M02-T080 is an accepted UI-S03 delivery record comprising its card, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md, docs/superpowers/plans/2026-09-05-m02-ui-s03-riskscan-request-flow.md, `apps/web/src/app/explore/riskscan/try/page.tsx`, `apps/web/src/components/riskscan/request/**`, `apps/web/tests/riskscan-request-state.test.mjs`, `apps/web/tests/riskscan-try.test.mjs`, and the constrained local Try link/test amendments in the accepted detail surface. The root owns queue state, catalog, decisions, and integration evidence. The accepted API route and server-only x402 helper are not owned by this card.

M03-T010 is an accepted pure core receipt/evidence binding record comprising its card, `docs/specs/m03-riskscan-receipt-evidence.md`, `docs/superpowers/plans/2026-09-05-m03-riskscan-receipt-evidence.md`, `packages/core/src/risk-scan.ts`, `packages/core/src/index.ts`, and `packages/core/test/risk-scan.test.mjs`. The root owns its queue state, catalog, decisions, and integration evidence. The accepted backend projection, API route, server helper, browser flow, package metadata, lockfile, runtime configuration, and external resources are not owned by this card.

M03-T020 is an accepted pure payment-state provenance record comprising its card, `docs/specs/m03-riskscan-payment-state-provenance.md`, `docs/superpowers/plans/2026-09-05-m03-riskscan-payment-state-provenance.md`, `packages/core/src/risk-scan.ts`, and `packages/core/test/risk-scan.test.mjs`. The root owns its queue state, catalog, decisions, and integration evidence. Backend, API, UI, package metadata, lockfile, runtime configuration, and external resources are excluded.

M03-T030 is an accepted local settlement-observer record comprising its card, `docs/specs/m03-riskscan-settlement-observer.md`, `docs/superpowers/plans/2026-09-05-m03-riskscan-settlement-observer.md`, `apps/web/src/lib/riskscan-x402.ts`, and `apps/web/tests/riskscan-api.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. Persistence, backend projection, UI, package metadata, lockfile, runtime configuration, accounts, wallets, live resources, and external evidence are excluded.

M04-T010 is an accepted durable-schema record comprising its card, `docs/specs/m04-riskscan-durable-schema.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-durable-schema.md`, `packages/backend/convex/schema.ts`, and `packages/backend/tests/risk-scan-schema.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. Existing backend projection/public boundaries, generated output, package metadata, lockfile, runtime configuration, external stores, API/UI behavior, accounts, wallets, payment material, deployment, and live evidence are excluded.

M04-T020 reserves its card, `docs/specs/m04-riskscan-durable-request-admission.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-durable-request-admission.md`, `packages/backend/src/risk-scan-durable-request-admission.ts`, and `packages/backend/tests/risk-scan-durable-request-admission.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted schema, current backend projection/public entry, generated output, database functions, package metadata, lockfile, runtime configuration, external stores, API/UI behavior, accounts, wallets, payment material, deployment, verification/finality, and live evidence are excluded.

M04-T030 reserves its card, `docs/specs/m04-riskscan-internal-request-writer.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-internal-request-writer.md`, `packages/backend/convex/riskscan_requests.ts`, `packages/backend/convex/tsconfig.json`, and `packages/backend/tests/risk-scan-internal-request-writer.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted schema and admission modules are dependencies, not owned changes; public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement actions, deployment, verification/finality, evidence capture, and live evidence are excluded.

M04-T040 is an accepted record comprising its card, `docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-candidate-settlement-attempt-writer.md`, `packages/backend/src/risk-scan-settlement-attempt-admission.ts`, `packages/backend/convex/riskscan_settlement_attempts.ts`, `packages/backend/tests/risk-scan-settlement-attempt-admission.test.mjs`, and `packages/backend/tests/risk-scan-candidate-settlement-attempt-writer.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted schema and request writer are dependencies, not owned changes; public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M04-T050 is an accepted record comprising its card, `docs/specs/m04-riskscan-pending-verification-settlement-record-writer.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-pending-verification-settlement-record-writer.md`, `packages/backend/src/risk-scan-settlement-record-admission.ts`, `packages/backend/convex/riskscan_settlement_records.ts`, `packages/backend/tests/risk-scan-settlement-record-admission.test.mjs`, and `packages/backend/tests/risk-scan-pending-verification-settlement-record-writer.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted schema and candidate attempt writer are dependencies, not owned changes; public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M04-T060 is an accepted record comprising its card, `docs/specs/m04-riskscan-pending-settlement-reader.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-pending-settlement-reader.md`, `packages/backend/convex/riskscan_pending_settlement_reader.ts`, and `packages/backend/tests/risk-scan-pending-settlement-reader.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted schema and candidate settlement-attempt/record writers are dependencies, not owned changes; public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M04-T070 is an accepted record comprising its card, `docs/specs/m04-riskscan-pending-reconciliation-selector.md`, `docs/superpowers/plans/2026-09-05-m04-riskscan-pending-reconciliation-selector.md`, `packages/backend/convex/riskscan_pending_reconciliation_selector.ts`, and `packages/backend/tests/risk-scan-pending-reconciliation-selector.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted schema, candidate settlement-attempt writer, and pending-settlement reader are dependencies, not owned changes; public backend exports, generated output, package metadata, lockfile, runtime configuration, API/UI behavior, external-store proof, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M05-T010 is an accepted record comprising its card, `docs/specs/m05-riskscan-tool-directory.md`, `docs/superpowers/plans/2026-09-05-m05-riskscan-tool-directory.md`, `apps/web/src/lib/tool-directory.ts`, `apps/web/src/app/api/tools/route.ts`, and `apps/web/tests/tool-directory-api.test.mjs`. The root owns queue state, catalog, decisions, and integration evidence. The accepted RiskScan Quick/x402 API boundaries are dependencies, not owned changes; existing RiskScan route/source/tests, UI behavior, core/backend persistence, generated output, package metadata, lockfile, runtime configuration, external directory registration, accounts, wallets, payment/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M05-T020 is an accepted discovery-only record comprising its card, `docs/specs/m05-tool-loop-agent-discovery.md`, `docs/superpowers/plans/2026-09-05-m05-tool-loop-agent-discovery.md`, `apps/agent/package.json`, `apps/agent/tsconfig.json`, `apps/agent/src/riskscan-tool-directory.ts`, `apps/agent/test/riskscan-tool-directory.test.mjs`, `apps/agent/test/boundary.test.mjs`, and `package-lock.json`. The root owns queue state, catalog, decisions, and integration evidence. The accepted Tool Directory, Quick, and x402 API boundaries are dependencies, not owned changes; core/backend/web/UI source, existing package metadata, runtime configuration, external directory registration, accounts, wallets, payment/signing/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M05-T030 is an accepted challenge-observation record comprising its card, `docs/specs/m05-tool-loop-agent-challenge-observation.md`, `docs/superpowers/plans/2026-09-05-m05-tool-loop-agent-challenge-observation.md`, `apps/agent/src/riskscan-tool-challenge.ts`, `apps/agent/test/riskscan-tool-challenge.test.mjs`, and `apps/agent/test/riskscan-tool-challenge-boundary.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, and any package/lockfile decision. The accepted Tool Directory, discovery, Quick, and x402 API boundaries are dependencies, not owned changes; core/backend/web/UI source, existing agent source/tests, package metadata, lockfile, runtime configuration, external directory registration, accounts, wallets, payment/signing/settlement/finality actions, deployment, verification/evidence capture, and live evidence are excluded.

M06-T010 is an accepted native x402 compatibility record comprising its card, `docs/specs/m06-riskscan-hedera-x402.md`, `docs/superpowers/plans/2026-09-05-m06-riskscan-hedera-x402.md`, the current M02/M05 configuration-contract amendments, `apps/web/package.json`, `package-lock.json`, `apps/web/src/lib/riskscan-x402.ts`, `apps/web/src/lib/tool-directory.ts`, focused web x402/directory tests, `apps/agent/src/riskscan-tool-directory.ts`, and focused Agent directory/boundary tests. The root owns all package/lockfile integration, queue records, review, decisions, and evidence. The accepted Quick route, settlement observer semantics, challenge-observation source, backend persistence, UI, generated output, runtime secrets/configuration, external facilitator/account/wallet/signer resources, payment/transaction/finality actions, deployment, and live evidence remain dependencies or excluded resources.

M07-T010 is an accepted ToolLoopAgent composition record comprising its card, `docs/specs/m07-tool-loop-agent-flow.md`, `docs/superpowers/plans/2026-09-06-m07-tool-loop-agent-flow.md`, `apps/agent/src/riskscan-tool-flow.ts`, `apps/agent/test/riskscan-tool-flow.test.mjs`, and `apps/agent/test/riskscan-tool-flow-boundary.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. The accepted directory/challenge modules are dependencies, not owned changes; web, core, backend, UI, package metadata, lockfile, runtime configuration, external facilitator/account/wallet/signer resources, payment/transaction/finality actions, receipt/evidence/result material, deployment, and live evidence are excluded.

M08-T010 is an accepted Browser ToolLoop RiskScan journey record comprising its card, `docs/specs/m08-browser-tool-loop-journey.md`, `docs/ui/UI-S04.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m08-browser-tool-loop-journey.md`, root-owned `apps/agent/package.json`, `apps/web/package.json`, `apps/web/next.config.ts`, and `package-lock.json`, plus `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`, `apps/web/src/components/riskscan/tool-loop/**`, `apps/web/tests/riskscan-tool-loop.test.mjs`, and the constrained ToolLoop detail-link/test amendment. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted Agent source/tests, API/x402 helpers, current Try flow, core, backend, runtime configuration, external facilitator/account/wallet/signer resources, payment/transaction/finality actions, receipt/evidence/result material, deployment, and live evidence are excluded.

M09-T010 is an accepted Browser RiskScan Directory inspection record comprising its card, `docs/specs/m09-native-directory-discovery.md`, `docs/ui/UI-S05.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m09-native-directory-discovery.md`, root-owned `apps/agent/package.json`, `apps/web/src/app/explore/page.tsx`, `apps/web/src/components/discovery/riskscan-directory-discovery.tsx`, `apps/web/src/components/discovery/riskscan-directory-state.ts`, `apps/web/tests/riskscan-directory-discovery.test.mjs`, and the constrained `apps/web/tests/landing-explore.test.mjs` amendment. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted Agent directory source/tests, API/x402 helpers, core, backend, static UI-S01 card source, ToolLoop/Try flows, runtime configuration, external facilitator/account/wallet/signer resources, payment/transaction/finality actions, receipt/evidence/result material, deployment, and live evidence are excluded.

M10-T010 is an accepted exact-value boundary record comprising its card, `docs/specs/m10-exact-value-boundary.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m10-exact-value-boundary.md`, `packages/core/src/value.ts`, `packages/core/src/index.ts`, `packages/core/test/value.test.mjs`, `packages/core/test/value.types.ts`, and `packages/core/tsconfig.json`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Existing RiskScan lifecycle/Quick source/tests, Web, Agent, backend, package metadata apart from the M10 compile-time fixture inclusion, lockfile, runtime configuration, accounts, wallets, payment/transaction/finality actions, deployment, and live evidence are excluded.

M11-T010 is an accepted public-landing record comprising its card, `docs/specs/m11-product-landing.md`, `docs/ui/UI-S06.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m11-product-landing.md`, `apps/web/src/app/page.tsx`, `apps/web/src/components/landing/**`, and `apps/web/tests/product-landing.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Layout, local navigation, the accepted landing/Explore test, Explore/RiskScan/API/Agent/core/backend source, runtime configuration, identity/session/provider surfaces, accounts, wallets, payment/transaction/finality actions, deployment, and live evidence are excluded.

M11-T020 is an accepted application-workspace record comprising its card, `docs/specs/m11-application-shell.md`, `docs/ui/UI-S07.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m11-application-shell.md`, `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/components/workspace/**`, `apps/web/src/components/discovery/local-navigation.tsx`, `apps/web/tests/workspace-shell.test.mjs`, and the constrained `apps/web/tests/landing-explore.test.mjs` navigation assertion amendment. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Landing, layout, Explore/RiskScan/API/Agent/core/backend source apart from that constrained test assertion, runtime configuration, identity/session/provider surfaces, accounts, wallets, payment/transaction/finality actions, deployment, and live evidence are excluded.

M12-T010 reserves its card, `docs/specs/m12-riskscan-native-quote-eligibility.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m12-riskscan-native-quote-eligibility.md`, `packages/core/src/riskscan-native-quote-eligibility.ts`, `packages/core/src/index.ts`, `packages/core/test/riskscan-native-quote-eligibility.test.mjs`, and `packages/core/test/riskscan-native-quote-eligibility.types.ts`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. The accepted value parser module is a dependency, not an owned change. Agent, web, backend, package metadata, lockfile, runtime configuration, accounts, wallets, signers, payment/header/client behavior, transactions, settlement, deployment, and live evidence are excluded.

M12-T020 reserves its card, `docs/specs/m12-tool-loop-agent-native-quote-evaluation.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m12-tool-loop-agent-native-quote-evaluation.md`, `apps/agent/src/riskscan-tool-native-quote-evaluation.ts`, `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`, and `apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs`. The root alone reserves the matching `apps/agent/package.json` public-subpath/dependency update, `package-lock.json`, `apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`, queue state, catalog, decisions, integration evidence, reviews, and pushes. The accepted Agent directory source/tests and core native-quote source/tests are dependencies, not owned changes. Existing Agent flow/challenge modules, web, backend, UI, runtime configuration, recipient/facilitator, payment/header/client behavior, wallets, accounts, signers, keys, transactions, settlement, persistence, deployment, and live evidence are excluded.

M13-T010 reserves its card, `docs/specs/m13-browser-native-quote-compatibility.md`, `docs/ui/UI-S08.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m13-browser-native-quote-compatibility.md`, `apps/web/src/app/dashboard/riskscan/compatibility/page.tsx`, `apps/web/src/components/riskscan/native-quote/**`, and `apps/web/tests/riskscan-native-quote-compatibility.test.mjs`. It also reserves only the constrained local route-map amendment in `apps/web/src/components/workspace/workspace-navigation.tsx` and its matching assertion amendment in `apps/web/tests/workspace-shell.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. The accepted guest workspace, Agent directory/native-quote boundaries, Core evaluator, global navigation, landing, Explore, ToolLoop, API, backend, package metadata, lockfile, runtime configuration, session/provider surfaces, accounts, wallets, signers, payment/header/client behavior, transactions, settlement, persistence, deployment, and live evidence are dependencies or excluded.

M14-T010 reserves its card, `docs/specs/m14-guest-riskscan-workbench.md`, `docs/ui/UI-S09.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m14-guest-riskscan-workbench.md`, `apps/web/src/app/dashboard/riskscan/page.tsx`, `apps/web/src/components/workspace/guest-riskscan-workbench.tsx`, and `apps/web/tests/guest-riskscan-workbench.test.mjs`. It also reserves only the constrained local route-map amendment in `apps/web/src/components/workspace/workspace-navigation.tsx` and its matching assertion amendment in `apps/web/tests/workspace-shell.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted Directory, native-compatibility, and ToolLoop components/tests, Agent/Core/API boundaries, landing, Explore, backend, package metadata, lockfile, runtime configuration, session/provider surfaces, accounts, wallets, signers, payment/header/client behavior, transactions, settlement, persistence, deployment, and live evidence are dependencies or excluded.

M15-T010 reserves its card, `docs/specs/m15-guest-riskscan-quick-preflight.md`, `docs/ui/UI-S10.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m15-guest-riskscan-quick-preflight.md`, `apps/web/src/app/dashboard/riskscan/preflight/page.tsx`, `apps/web/src/components/riskscan/preflight/**`, and `apps/web/tests/riskscan-quick-preflight.test.mjs`. It also reserves only the constrained local route-map amendment in `apps/web/src/components/workspace/workspace-navigation.tsx` and its matching assertion amendment in `apps/web/tests/workspace-shell.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted Core Quick source/tests, existing request/ToolLoop/Directory/compatibility UI, Agent/API boundaries, guest workspace, landing, Explore, backend, package metadata, lockfile, runtime configuration, session/provider surfaces, accounts, wallets, signers, payment/header/client behavior, transactions, settlement, persistence, deployment, and live evidence are dependencies or excluded.

M16-T010 is an accepted record comprising its card, `docs/specs/m16-offering-terms-and-revenue-math.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m16-offering-terms-and-revenue-math.md`, `packages/core/src/offering-economics.ts`, `packages/core/src/index.ts`, `packages/core/test/offering-economics.test.mjs`, and `packages/core/test/offering-economics.types.ts`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. The accepted exact-value parser is a dependency, not an owned change. Accepted RiskScan lifecycle/Quick/native-quote sources/tests, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, persistence, HCS, deployment, and live evidence are excluded.

M17-T010 is an accepted record comprising its card, `docs/specs/m17-requirements-bound-offering-quote.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m17-requirements-bound-offering-quote.md`, `packages/core/src/requirements-offering-quote.ts`, `packages/core/src/index.ts`, `packages/core/test/requirements-offering-quote.test.mjs`, and `packages/core/test/requirements-offering-quote.types.ts`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted M10 exact values and M16 allocation are dependencies, not owned changes. Accepted RiskScan lifecycle/Quick/native-quote sources/tests, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, protocol adapters, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, persistence, HCS, deployment, and live evidence are excluded.

M18-T010 is an accepted record comprising its card, `docs/specs/m18-offering-purchase-lifecycle.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-06-m18-offering-purchase-lifecycle.md`, `packages/core/src/offering-purchase-lifecycle.ts`, `packages/core/src/index.ts`, `packages/core/test/offering-purchase-lifecycle.test.mjs`, and `packages/core/test/offering-purchase-lifecycle.types.ts`. It additionally owns only a narrow non-barrel issuance-verifier amendment in `packages/core/src/requirements-offering-quote.ts`, required to reject forged, copied, proxied, or mutable JavaScript quote lookalikes before M18 reads quote fields. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted M16 terms/allocation and M17 canonical quote boundaries are dependencies; their remaining behavior is not owned. Existing RiskScan lifecycle/Quick/native-quote sources/tests, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, protocol adapters, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, persistence, clearing, HCS, deployment, and live evidence are excluded.

M19-T010 is an accepted record comprising its card, `docs/specs/m19-paid-task-lifecycle.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m19-paid-task-lifecycle.md`, `packages/core/src/paid-task-lifecycle.ts`, `packages/core/src/index.ts`, `packages/core/test/paid-task-lifecycle.test.mjs`, and `packages/core/test/paid-task-lifecycle.types.ts`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted M17 canonicalization/digest behavior is the only dependency; its remaining behavior is not owned. Accepted M18 funding-purchase behavior is a sequencing boundary, not an M19 input. Existing RiskScan lifecycle/Quick/native-quote sources/tests, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, protocol adapters, offering schema, generic external attempt model, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt/result handling, persistence, clearing, HCS, deployment, and live evidence are excluded.

M20-T010 is an accepted record comprising its card, `docs/specs/m20-offering-definition-schema.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m20-offering-definition-schema.md`, `packages/core/src/offering-definition.ts`, `packages/core/src/index.ts`, `packages/core/test/offering-definition.test.mjs`, and `packages/core/test/offering-definition.types.ts`. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted M16 terms/economics are the sole dependency and are not owned changes; M17 through M19 are sequencing context only. Existing RiskScan lifecycle/Quick/native-quote sources/tests, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, protocol adapters, generic external attempt model, ATS/configuration, offering publication, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt/result handling, persistence, clearing, HCS, deployment, and live evidence are excluded.

M21-T010 is an accepted record comprising its card, `docs/specs/m21-clearing-split-lifecycle.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m21-clearing-split-lifecycle.md`, `packages/core/src/clearing-split-lifecycle.ts`, `packages/core/test/clearing-split-lifecycle.test.mjs`, and `packages/core/test/clearing-split-lifecycle.types.ts`. It owns one narrow non-barrel provenance-handoff amendment in `packages/core/src/paid-task-lifecycle.ts`; the `packages/core/src/index.ts` amendment is a root integration record. The root owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted M19 issued-result provenance is the sole dependency and is not an owned behavior change; M16 and M20 are sequencing context only. Existing RiskScan lifecycle/Quick/native-quote sources/tests, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, protocol adapters, offering calculation/definition behavior, generic external attempt model, ATS/configuration, offering publication, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt/result/non-execution handling, persistence, clearing, HCS, deployment, and live evidence are excluded.

M22-T010 is an accepted record comprising its card, `docs/specs/m22-ingress-envelope.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m22-ingress-envelope.md`, `packages/core/src/ingress-envelope.ts`, `packages/core/test/ingress-envelope.test.mjs`, and `packages/core/test/ingress-envelope.types.ts`. The root records the `packages/core/src/index.ts` public-barrel amendment and owns queue state, catalog, decisions, integration evidence, reviews, and pushes. Accepted M16–M21 contracts are dependency context and not owned behavior changes. Existing Core, backend, Agent, Web/UI, package metadata, lockfile, runtime configuration, HMAC/key behavior, replay storage, HTTP/command behavior, generic attempts, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, persistence, clearing, HCS, deployment, and live evidence are excluded.

M23-T010 is an accepted record comprising its card, `docs/specs/m23-protected-ingress-verifier.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m23-protected-ingress-verifier.md`, `packages/backend/src/ingress/protected-ingress-verifier.ts`, and `packages/backend/tests/protected-ingress-verifier.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, commits, and pushes. M01-T030 is the accepted backend package foundation and M22-T010 is the accepted envelope dependency; neither is an owned behavior change. Existing Core, public backend exports, Convex schema/functions, RiskScan persistence, Agent, Web/UI, package metadata, lockfile, runtime configuration, key/configuration provisioning, replay storage, HTTP/command behavior, generic attempts, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, clearing, HCS, deployment, and live evidence are excluded.

M24-T010 is an accepted record comprising its card, `docs/specs/m24-protected-replay-claim.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m24-protected-replay-claim.md`, `packages/backend/src/ingress/protected-replay-claim.ts`, and `packages/backend/tests/protected-replay-claim.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, commits, and pushes. Accepted M01-T030, M22-T010, and M23-T010 are dependencies, not owned behavior changes. Existing Core, public backend exports, Convex schema/functions, RiskScan persistence, Agent, Web/UI, package metadata, lockfile, runtime configuration, key/configuration provisioning, replay storage implementation, HTTP/command behavior, generic attempts, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, clearing, HCS, deployment, and live evidence are excluded.

M25-T010 is an accepted implementation record comprising its card, `docs/specs/m25-claimed-protected-body.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m25-claimed-protected-body.md`, accepted `packages/backend/src/ingress/claimed-protected-body.ts`, and accepted `packages/backend/tests/claimed-protected-body.test.mjs`. The root owns queue state, catalog, decisions, integration evidence, reviews, commits, and pushes. Accepted M01-T030, M22-T010, M23-T010, and M24-T010 are dependencies, not owned behavior changes. Existing Core, public backend exports, Convex schema/functions, RiskScan persistence, Agent, Web/UI, package metadata, lockfile, runtime configuration, key/configuration provisioning, replay storage implementation, HTTP/command behavior, command schemas, generic attempts, ATS/configuration, accounts, assets, wallets, signers, funding/payment/transfer behavior, transactions, settlement/receipt handling, clearing, HCS, deployment, and live evidence are excluded.

M26-T010 is an accepted implementation record comprising its card, `docs/specs/m26-external-prepare-payload.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m26-external-prepare-payload.md`, and accepted `packages/core/src/external-prepare-payload.ts`, `packages/core/src/index.ts`, `packages/core/test/external-prepare-payload.test.mjs`, and `packages/core/test/external-prepare-payload.types.ts` paths. The root owns queue state, catalog, decisions, integration evidence, reviews, commits, and pushes. Accepted M01-T020 and M10-T010 are dependencies, not owned behavior changes; accepted economics, ingress, and byte-binding records are sequencing context only. Existing Core behavior outside the accepted parser/barrel paths, backend, Convex schema/functions, RiskScan persistence, Agent, Web/UI, package metadata, lockfile, raw JSON/bytes, signed command/authentication, principal/role/signer handling, replay/idempotency storage, generic attempts, configuration, ATS/provider behavior, accounts, assets, wallets, funding/payment/transfer behavior, transactions, settlement/receipt handling, clearing, HCS, payout, deployment, and live evidence are excluded.

M27-T010 is an accepted control record comprising only its card,
`docs/work-queue/evidence/HA-COMMAND-AUTHORITY-001-template.md`,
`docs/work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md`,
`docs/work-queue/evidence/HA-COMMAND-AUTHORITY-001-review.md`,
`docs/work-queue/HUMAN-ACTIONS.md`, `docs/work-queue/STATE.md`,
`docs/work-queue/TASK-CATALOG.md`, this ownership record, and
`docs/work-queue/DECISIONS.md`. The root owns every listed control record,
reviews, commits, and pushes. Accepted M22 through M25 are protected-byte
provenance context and M26 is detached payload context; none grants canonical
wallet-command, principal, signer, role, command nonce/expiry, or durable-claim
authority.
No implementation paths are reserved. Core, backend, Convex, Agent, Web/UI,
packages, lockfiles, raw-body decoding, JSON, command parsing, wallet/provider
handling, wallet-command signature verification, principal/role lookup, replay or idempotency
storage, generic attempts, ATS/configuration, accounts, assets, funding,
payment, transactions, settlement, clearing, HCS, payout, deployment, and live
evidence are excluded until a future separately accepted local authority says
otherwise.

The completed HA-COMMAND-AUTHORITY-001 decision and independent review are now
also owned M27 evidence. The earlier statement that no implementation path was
reserved was true only before the decision; M27 is now closed, and no behavior
is granted by that control record itself.

M30-T010 is an accepted authority record comprising its card, M30 specification,
specification-import ledger row, M30 implementation plan, M30 authority review,
packages/backend/package.json,
package-lock.json, packages/backend/src/ingress/authenticated-external-prepare-normalizer.ts,
and packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs
plus root queue records. The root owns queue state, catalog, human-action
records, decisions, review records, commits, and pushes. M25 and M26 are
accepted consumed boundaries only; M22 through M24 remain unchanged upstream
context. Existing backend modules, backend public barrel, Convex, Core, Agent,
Web/UI, browser provider selection, configuration, environment, storage,
replay/idempotency claims, durable attempts, prepared state, ATS
target/parameter authority, ATS/provider SDKs, account/wallet action, funding,
payment, transaction, settlement, clearing, HCS, payout, deployment, and live
evidence are excluded. This acceptance grants no durable replay/idempotency
claim, attempt, prepared state, ATS target/parameter authority, provider or
wallet action, funding, payment, transaction, deployment, or external action.

M31-T010 is an accepted implementation record comprising its card,
`docs/specs/m31-external-prepare-command-admission.md`,
`docs/imports/SPEC-IMPORT-LEDGER.md`,
`docs/superpowers/plans/2026-09-07-m31-external-prepare-command-admission.md`,
and root queue records. Its accepted implementation paths are only
`packages/backend/src/ingress/external-prepare-command-admission.ts` and
`packages/backend/tests/external-prepare-command-admission.test.mjs`; its
execution remains limited to test-only RED followed by the declared minimal
internal adapter.
The root owns queue state, catalog, decisions, reviews, commits, and pushes.
M25, M26, and M30 are accepted consumed boundaries only. Existing backend
modules, the backend public barrel, packages, lockfiles, Convex, RiskScan
persistence/reconciliation, Core, Agent, Web/UI, configuration, environment,
storage, replay/idempotency claims, generic attempts, prepared state, ATS
target/parameter authority, providers, wallets, funding, payment,
transactions, settlement, clearing, HCS, payout, deployment, and live evidence
are excluded. This acceptance grants no durable replay/idempotency claim,
attempt, prepared state, ATS target/parameter authority, provider or wallet
action, funding, payment, transaction, deployment, or external action.

M28-T010 is an accepted authority record comprising its card,
`docs/specs/m28-agent-directory-record-candidate-schema.md`,
`docs/imports/SPEC-IMPORT-LEDGER.md`,
`docs/superpowers/plans/2026-09-07-m28-agent-directory-record-candidate-schema.md`,
this ownership record, queue state, catalog, and decisions. Its accepted
implementation paths are only `packages/core/src/agent-directory-record-candidate.ts`,
`packages/core/src/index.ts`,
`packages/core/test/agent-directory-record-candidate.test.mjs`, and
`packages/core/test/agent-directory-record-candidate.types.ts`; the root owns
all listed control records, reviews, commits, and pushes. M10 is the direct
syntax dependency; M16 through M19 and M21 are accepted source-sequencing
context only. Existing Core modules, Agent Directory source/tests, backend,
Convex, Web/UI, package metadata, lockfiles, command/signature/principal/role
handling, publication, provider/ATS behavior, payment, accounts, wallets,
transactions, settlement, receipts, persistence, replay/idempotency storage,
generic attempts, clearing, HCS, payout, deployment, and live evidence are
excluded.

B01-T010 is an accepted record comprising its card, `docs/specs/b01-convex-module-naming-compatibility.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-b01-convex-module-naming-compatibility.md`, the five canonical underscore-named `packages/backend/convex/` source files, their five direct existing backend tests, `packages/backend/tests/convex-module-naming-compatibility.test.mjs`, and code-styled current module-path literals in the five M04 specifications, five M04 plans, five accepted M04 cards, and this file. The root owns queue state, catalog, human-action records, decisions, integration evidence, reviews, commits, and pushes. Accepted M01-T030 and M04-T010 through M04-T070 provide stable backend-function context, not reopened behavior. Existing function exports/bodies/validators/schema/indexes, all other Convex files, Core, Agent, Web/UI, package metadata, lockfile, runtime configuration, ignored configuration, generated output, public endpoints, deployment, external-store proof, payment, settlement, ATS, funding, accounts, wallets, signers, transactions, clearing, HCS, payout, and live evidence are excluded.

M29-T010 is an accepted record comprising its card, `docs/specs/m29-shell-accessibility-amendment.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/ui/UI-S00.md`, `docs/ui/IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-m29-shell-accessibility-amendment.md`, `apps/web/src/app/globals.css`, and `apps/web/tests/shell-accessibility.test.mjs`. The root owns queue state, catalog, decisions, browser evidence, reviews, commits, and pushes. UI-S00 and M11-T020 are accepted shared-shell context, not reopened route behavior. All other Web/UI paths, route business logic, package metadata, lockfile, runtime configuration, client state, identity/session/provider/wallet/signer/payment surfaces, Core, Agent, backend, persistence, accounts, transactions, reserve, allocation, clearing, ATS, HCS, payout, deployment, and live evidence are excluded.

S13-T010 is a ready root-owned presentation record comprising its card,
`docs/ui/UI-S13.md`, `docs/ui/IMPORT-LEDGER.md`, its intake-amendment evidence,
queue state, catalog, decisions, reviews, commits, and pushes. It exclusively
owns the new `apps/web/src/components/ui/status.tsx`,
`apps/web/src/components/ui/state-panel.tsx`,
`apps/web/tests/status.test.mjs`, and
`apps/web/tests/state-panel.test.mjs`. Under one explicit root integration
reservation, it may amend only the outcome-rendering lines of
`apps/web/src/app/globals.css`,
`apps/web/src/components/riskscan/request/riskscan-request-flow.tsx`,
`apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx`,
`apps/web/src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx`,
`apps/web/src/components/riskscan/preflight/riskscan-quick-preflight.tsx`, and
`apps/web/src/components/discovery/riskscan-directory-discovery.tsx`. M29-T010,
M02-T080, M08-T010, M13-T010, M15-T010, and M09-T010 remain accepted owners;
their state, outcome wording, live-region semantics, domain logic, and focused
tests are not reopened. Every other Web/UI, route, package/lockfile,
configuration, identity/provider/payment, backend, Agent, account, transaction,
deployment, and live-evidence path remains excluded.

M32-T010 is an accepted implementation record comprising its card,
`docs/specs/m32-durable-external-prepare-admission.md`,
`docs/superpowers/plans/2026-09-08-m32-durable-external-prepare-admission.md`,
`docs/imports/SPEC-IMPORT-LEDGER.md`, the narrow shared-schema compatibility
amendments in `docs/specs/m04-riskscan-durable-schema.md`,
`docs/work-queue/queue/60-done/M04-T010-riskscan-durable-schema.md`, and
`docs/superpowers/plans/2026-09-05-m04-riskscan-durable-schema.md`, the narrow
post-acceptance durable-replay clarifications in
`docs/specs/m31-external-prepare-command-admission.md`,
`docs/work-queue/queue/60-done/M31-T010-external-prepare-command-admission.md`,
and `docs/superpowers/plans/2026-09-07-m31-external-prepare-command-admission.md`,
`packages/backend/convex/schema.ts`,
`packages/backend/convex/external_prepare_command_admission.ts`,
`packages/backend/convex/external_prepare_command_recovery.ts`,
`packages/backend/tests/risk-scan-schema.test.mjs`, and the focused M32
schema/admission/recovery tests. The root owns queue state, catalog, decisions,
reviews, commits, and integration evidence. Its accepted implementation paths
are limited to the listed schema, two internal Convex modules, and focused
tests. Existing M04 RiskScan functions, writers, readers, records, and
reconciliation are dependencies and may not change; accepted M31 source and
tests are also dependencies and may not change. Public APIs, generated output,
authority provisioning, configuration, publication, HTTP/BFF adapters,
provider/wallet, ATS target/parameter resolution, funding, payment,
transaction, deployment, and live evidence are excluded. This acceptance
grants no authority provisioning, publication, ATS target/parameter authority,
provider or wallet action, funding, payment, transaction, deployment, or live
behavior.

HI-001 is a resolved human intake record comprising its card, `docs/work-queue/DECISIONS.md`, `docs/work-queue/HUMAN-ACTIONS.md`, `docs/work-queue/STATE.md`, and `docs/work-queue/TASK-CATALOG.md`. The root owns all of them. It records a human scope ruling and four external observations; it owns no source, test, configuration, or external resource, and it authorizes no action.

B02-T010 is an accepted record comprising its card, `docs/specs/b02-riskscan-route-settlement-evidence.md`, `docs/imports/SPEC-IMPORT-LEDGER.md`, `docs/superpowers/plans/2026-09-07-b02-riskscan-route-settlement-evidence.md`, `apps/web/src/lib/riskscan-settlement-evidence.ts`, and `apps/web/tests/riskscan-settlement-evidence.test.mjs`. `apps/web/src/lib/riskscan-x402.ts` is an accepted M03-T030 path reserved to this card as an explicit root integration reservation while B02-T010 was active; M03-T030 is accepted and has no active lane, so the reservation creates no ownership conflict. The root owns queue state, catalog, ownership, decisions, reviews, commits, and pushes. M02-T060, M03-T030, and M06-T010 are accepted context, not reopened behavior. The M03 correlation rules, `apps/web/tests/riskscan-api.test.mjs`, route files, the Tool Directory, Core, Agent, backend, persistence, package metadata, lockfile, runtime configuration, generated output, public read surfaces, receipt and evidence binding, payment clients, accounts, wallets, signers, transactions, reserve, allocation, clearing, ATS, HCS, payout, deployment, and live evidence are excluded.

B03-T010 is a locally green but human-blocked record comprising its card,
`docs/specs/b03-riskscan-agent-payment-client.md`,
`docs/superpowers/plans/2026-09-08-b03-riskscan-agent-payment-client.md`,
`apps/agent/src/riskscan-tool-payment.ts`,
`apps/agent/src/riskscan-pay-cli.ts`,
`apps/agent/test/riskscan-tool-payment.test.mjs`,
`apps/agent/test/riskscan-tool-payment-boundary.test.mjs`,
`apps/agent/package.json`, and the root `package-lock.json`. The Agent manifest
change is limited to the `./riskscan-tool-payment` public export, the
`riskscan:pay` script, and direct `@x402/core@2.25.0` and
`@x402/hedera@2.25.0` dependencies. The root owns queue state, catalog,
ownership, decisions, reviews, commits, and pushes. M05-T020, M05-T030,
M06-T010, M12-T020, and B02-T010 are accepted context, not reopened behavior.
The accepted M05 challenge-observation module and its tests, the Tool Directory,
Core, backend, Web and UI paths, S12-T010's boundary routes and assets, runtime
configuration, key material, accounts, wallets, deployment, and live evidence
are excluded.

S12-T010 is an accepted record comprising its card, `docs/ui/UI-S12.md`,
`docs/superpowers/plans/2026-09-08-s12-deploy-readiness.md`, move-only input
paths `apps/web/public/brand/icon.svg` and
`apps/web/public/brand/apple-icon.png`, retained
`apps/web/public/brand/mascot-flag.png`, final metadata paths
`apps/web/src/app/icon.svg` and `apps/web/src/app/apple-icon.png`,
`apps/web/src/app/not-found.tsx`, `apps/web/src/app/error.tsx`,
`apps/web/src/app/robots.ts`,
`apps/web/src/components/boundary/not-found-boundary.tsx`,
`apps/web/src/components/boundary/error-boundary.tsx`, and
`apps/web/tests/deploy-readiness.test.mjs`. The two icon inputs must be absent
after their move; the mascot is referenced only by the accepted not-found
boundary. The root owns queue state, catalog, ownership, the UI slice ledger,
decisions, reviews, commits, and pushes. M02-T020, M02-T040, and M11-T010 are
accepted context, not reopened behavior. Layout, navigation, shared UI,
package metadata, lockfile, runtime configuration, public APIs, all other Web
paths, identity/provider/payment surfaces, domain state, deployment, and live
evidence are excluded.

Future active implementation cards must have disjoint owned paths and resource boundaries. Shared-file work is an explicit root integration reservation. Wallets, credentials, funded accounts, partner configuration, and deployments remain human-controlled resources; no card or agent infers authority over them.

M33-T010 is a root-owned accepted authority record comprising its card,
`docs/specs/m33-ats-prepare-authority-gate.md`,
`docs/superpowers/plans/2026-09-08-m33-ats-prepare-authority-gate.md`,
`docs/imports/SPEC-IMPORT-LEDGER.md`,
`docs/work-queue/evidence/HA-ATS-AUTHORITY-001-decision.md`,
`docs/work-queue/evidence/M33-T010-authority-review.md`, this ownership
record, queue state, catalog, human-action record, and decisions. Its only
candidate implementation paths are
`packages/backend/convex/ats_prepare_authority.ts`,
`packages/backend/convex/external_prepare_command_admission.ts`,
`packages/backend/tests/ats-prepare-authority.test.mjs`, and
`packages/backend/tests/external-prepare-command-durable-admission.test.mjs`.
The root owns every listed control record, reviews, commits, integration, and
pushes. M26 and M32 are accepted consumed boundaries only; M32's schema and
recovery query remain excluded. Existing M04 RiskScan source, Core, packages,
lockfile, generated output, backend public barrel, configuration, environment,
provider/wallet, ATS SDK/configuration, target enablement, accounts, funding,
payment, transaction, settlement, clearing, HCS, payout, deployment, and live
evidence are excluded. Its committed test-only RED, private resolver, and one
ordered M32 assertion are accepted. The production manifest remains
zero-enabled and grants no target enablement or external behavior.

M34-T010 is a root-owned completed control record comprising its card,
recommended and accepted configuration decision records, independent review,
`docs/work-queue/HUMAN-ACTIONS.md`, this ownership record, queue state,
catalog, and decisions. It owns no runtime source, dependency, package,
configuration, generated output, public API, test, provider, wallet, account,
SDK, target enablement, funding, payment, transaction, allocation, clearing,
HCS, payout, deployment, or live-evidence path. M16/M20/M32/M33 are accepted
consumed boundaries only. The root owns every listed control record, review,
commit, and push. This completed record authorizes only a separately recorded
local unsigned successor; it never authorizes executable behavior itself.

M35-T010 is a root-owned accepted record comprising its card, local
specification, neutral import-ledger row, implementation plan, committed
authority/RED/task/module review records, queue state, catalog, ownership
record, decisions, commits, integration, and pushes. Its accepted
implementation paths are only
`packages/backend/src/ats/local-unsigned-ats-create-configuration.ts` and
`packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs`.
M01-T030, M20-T010, M33-T010, and M34-T010 are accepted consumed boundaries.
M33's manifest, M32/Convex source, all public barrels, packages, lockfiles,
existing source/tests, configuration, environment, Web/UI, Agent, SDK,
provider/wallet, account, funding, payment, transaction, asset, settlement,
clearing, HCS, payout, deployment, and live-evidence paths are excluded.
Its accepted helper remains a local unsigned projection only; it grants no M33
enablement or external behavior.

M36-T010 is a root-owned completed control record comprising its card, the
prefilled and recorded HA-ATS-LIVE-AUTHORITY-001 decision packets, its
independent authority review, HUMAN-ACTIONS.md, this ownership record, queue
state, catalog, and decisions. It owns no runtime source, package,
configuration, M32/M33 change, authority row, SDK, provider, wallet, account,
funding, payment, transaction, asset, holder/compliance action, clearing, HCS,
payout, deployment, or evidence path. M32, M33, and M35 are accepted consumed
boundaries only. A successor must receive separate ownership and may only be
recorded after a fresh rescan; it must retain M33 zero-enabled and M32/schema
unchanged until a later reviewed runtime amendment and Stage B GO.

M37-T010 is a root-owned accepted source-only record comprising its card,
local specification, neutral import-ledger row, implementation plan, accepted
Stage A decision/reviews, future RED/task/module review records,
queue state, catalog, ownership record, decisions, commits, integration, and
pushes. Its planned implementation paths are only
`packages/backend/src/ats/stage-a-real-issuer-ats-create-authority.ts` and
`packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`.
M01-T030, M32, M33, M35, and M36 are accepted consumed boundaries. M35 source,
M33 manifest, M32/Convex source, all public barrels, packages, lockfiles,
existing source/tests, configuration, environment, Web/UI, Agent, SDK,
provider/wallet, account, funding, payment, transaction, asset, settlement,
clearing, HCS, payout, deployment, and live-evidence paths are excluded. It
must create no authority row and grants no M33 enablement or external behavior.
Its restored, evaluator-hardened test-only RED and its declared private source
helper are accepted under Node 22.21.1. M37 remains private, source-only, and
unavailable to every runtime or external path. Any successor must receive
separate ownership and a separate human authorization before provisioning or
an executable ATS action.

HA-ATS-RUNTIME-BINDING-001 is a root-owned pending human-control record
comprising only its recommended decision, HUMAN-ACTIONS.md, queue state, this
ownership record, and decisions. It owns no source, test, schema, manifest,
authority row, package, configuration, environment, provider, wallet, SDK,
network, account, asset, transaction, deployment, or live-evidence path.
Until the human approves it and a separately scoped card receives its own
ownership, M32 and M33 remain unchanged and M33 remains zero-enabled.

S19-T010 is a root-owned direct demo-usability intake comprising its card,
docs/ui/UI-S19.md, docs/ui/IMPORT-LEDGER.md, queue state, catalog, decisions,
this ownership record, reviews, commits, and pushes. Its proposed source/test
set is limited to the exact UI-S19 local targets:
apps/web/src/app/layout.tsx,
apps/web/src/components/demo/guided-demo-steps.tsx,
apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx,
apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop-state.ts,
apps/web/tests/guided-demo-route.test.mjs,
apps/web/tests/riskscan-tool-loop.test.mjs, and the new
apps/web/tests/tool-loop-demo-prefill.test.mjs. The root alone reserves the
narrow nuqs 2.10.1 integration in apps/web/package.json, root package-lock.json,
and apps/web/tests/static-shell.test.mjs. The accepted S11 link and M08 form
files are integration-only context; this card changes only the one Guided Demo
ToolLoop href, form defaults, and demo notice. S13 retains its future
outcome-rendering lines. All other routes, source, tests, dependencies,
lockfile work, storage, configuration, wallets, payment, provider, account,
transaction, deployment, and live-evidence paths are excluded. No RED, source,
or dependency change is authorized before a fresh root activation. The
[independent ready review](evidence/S19-T010-ready-review.md) and
[activation review](evidence/S19-T010-activation-review.md) and
[RED review](evidence/S19-T010-red-review.md),
[final task review](evidence/S19-T010-task-review.md), and
[module review](evidence/S19-T010-module-review.md) are clear. The exact
UI-S19 targets are accepted; all exclusions continue.

S14-T010 is a root-owned accepted control record comprising its card,
`docs/ui/UI-S14.md`, `docs/ui/IMPORT-LEDGER.md`,
`docs/superpowers/plans/2026-09-08-s14-route-loading-skeletons.md`, this
ownership record, queue state, catalog, decisions, reviews, commits, and
pushes. Its only proposed implementation paths are
`apps/web/src/app/explore/loading.tsx`,
`apps/web/src/app/explore/riskscan/loading.tsx`,
`apps/web/src/app/explore/riskscan/try/loading.tsx`,
`apps/web/src/app/explore/riskscan/tool-loop/loading.tsx`,
`apps/web/src/app/dashboard/loading.tsx`,
`apps/web/src/app/dashboard/riskscan/loading.tsx`,
`apps/web/src/app/dashboard/riskscan/compatibility/loading.tsx`,
`apps/web/src/app/dashboard/riskscan/preflight/loading.tsx`,
`apps/web/src/components/ui/skeleton.tsx`, and
`apps/web/tests/route-loading-skeletons.test.mjs`. Every existing route,
component, stylesheet, shared UI primitive, package/lockfile, configuration,
identity/provider/payment surface, backend, Agent, deployment, and submission
path is excluded. The fresh independent ready-state and activation reviews,
the [RED review](evidence/S14-T010-red-review.md), [final task
review](evidence/S14-T010-task-review.md), and [module
review](evidence/S14-T010-module-review.md) are clear. The accepted source is
limited to the nine declared static paths; every exclusion continues after
acceptance.

S11-T010 is an accepted root-owned record comprising its card,
`docs/ui/UI-S11.md`, `docs/ui/IMPORT-LEDGER.md`,
`docs/superpowers/plans/2026-09-08-s11-guided-demo-narration.md`, its
intake, ready, activation, RED, navigation-amendment, task-review, and
module-review evidence, this ownership record, queue state, catalog, decisions,
commits, and pushes. Its accepted source/test set is
`apps/web/src/app/demo/page.tsx`,
`apps/web/src/components/demo/guided-demo-steps.tsx`,
`apps/web/tests/guided-demo-route.test.mjs`,
`apps/web/src/components/discovery/local-navigation.tsx`,
`apps/web/tests/landing-explore.test.mjs`, and
`apps/web/tests/workspace-shell.test.mjs`. It adds only the static `/demo`
route and `{ href: "/demo", label: "Demo" }` while preserving the exact
four-entry local navigation set. The independent [task
review](evidence/S11-T010-task-review.md) and [module
review](evidence/S11-T010-module-review.md) are clear. Every existing
route/component, other navigation entry, layout, stylesheet, package/lockfile,
configuration, identity/provider/payment surface, backend, Agent, account,
transaction, deployment, narration recording, and submission path remains
excluded.

HI-002 is an accepted root-owned control record comprising its completed
intake card, the local campaign-flow design, the recorded scope and constraint
decisions, the campaign human-action rows, queue state, catalog, this
ownership record, reviews, commits, and pushes. It owns no product source,
test, package, lockfile, environment, credential, provider, wallet, SDK,
account, funding, transaction, deployment, or live-evidence path. Its only
delivery effect is to reserve the ordered M38 through M45 and S15 through S18
batch described by their own local cards. No member may modify source before
its individual ready/activation/RED cycle.

The HI-002 batch records the following ownership and integration reservations.
M38-T010 exclusively owns its three new Core payload modules, their six focused
runtime/type fixtures, and the one narrow Core public-barrel amendment.
M39-T010, M40-T010, M41-T010, M42-T010, and M43-T010 own only their exact
Backend files named in their cards. The root sequences the three shared
`packages/backend/convex/schema.ts` amendments: M40 reserves
`walletCommandReplayClaims`, M41 reserves `ingressCommandReplayClaims`, and
M43 may widen only the declared external-attempt state after its predecessors
are accepted. M43's `command_dispatch.ts` amendment is likewise unavailable
until its own ready cycle. M45-T010 owns its exact Web active-directory paths
and only the constrained accepted Tool Directory/API/test amendments listed in
its card.

S15-T010 owns its exact wallet-island and relay paths. S16-T010 owns its exact
provider-deploy page, components, state, fixture, configuration literal, and
tests. S17-T010 owns its exact provider-status/API/projection paths and its
single local-navigation/test integration after S11-T010. M44-T010 owns its
exact ATS client/request/action and test paths. S18-T010 owns its exact backing
route, components, state, fixtures, and tests. S15 and M44 both reserve the
Web manifest, root lockfile, and static-shell dependency contract, so S15 must
be accepted before M44 is reviewed; S16's provider-deploy component boundary
must be accepted before M44 touches its declared action path. No other
cross-card source overlap is authorized. Every card retains its explicit
human-action and external-capability exclusions.
