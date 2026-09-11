# Runtime file and resource ownership

CP-S00 reserves docs/work-queue, AI_USAGE.md, generated files, and lockfiles to the root integrator. Local task cards declare owned paths and resource locks before entering 10-ready.

M52-T010 is a root-owned `10-ready` CORE_P0 correction. It owns its card,
specification, queue/review records, and only the future candidate paths
`apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts` and
`apps/web/tests/stage-b-browser-provider-bridge.test.mjs`. No candidate path
is active before separate durable test-only RED activation. M52 may only replace the strict one-account condition with exact
fixed-issuer membership; provider, wallet, transaction, receipt, Mirror,
candidate, attachment, authority, deployment, and every live path remain
excluded.

M51-T010 is a root-owned `00-inbox` CORE_P0 recovery intake. It owns its
card, specification, queue/decision/review records, and the future candidate
paths `packages/backend/convex/offerings.ts`,
`packages/backend/tests/offering-command-admission.test.mjs`,
`apps/web/src/lib/offering-projection.ts`, new
`apps/web/src/lib/provider-campaign-resume.ts`,
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`, and new
`apps/web/tests/provider-campaign-resume.test.mjs`, plus the narrow
import-harness amendment of `apps/web/tests/deploy-stage-signing.test.mjs`.
The isolated public-HTTP continuation correction reserves only
`packages/backend/tests/command-dispatch.test.mjs` and
`packages/backend/convex/command_dispatch.ts` for the accepted minimal GREEN
correction; every other command-dispatch source and test remains prohibited.
No candidate path is
active or reserved before independent readiness and separate RED activation.
M51 may expose only a revalidated `ASSET_PENDING`/`PREPARED` durable recovery
reference. Provider, wallet, signature, relay, authority, transaction,
candidate attachment, deployment, and every live path remain excluded.

B04-T010 is a root-owned `20-active` security remediation. It reserves its
card, specification, plan, queue records, and exactly these future durable-RED
tests: `stage-b-ats-create-canonical-identity.test.mjs`,
`bounded-request-json.test.mjs`, `entitycheck-api.test.mjs`,
`riskscan-api.test.mjs`, `provider-deploy-route.test.mjs`,
`provider-deploy-state.test.mjs`, `stage-b-ats-create-command-projection.test.mjs`,
and `stage-b-browser-provider-bridge.test.mjs`. The activation authorizes only
those durable RED tests. The accepted RED review additionally reserves only
`stage-b-ats-create-canonical-identity.ts`, `ats-create-configuration.ts`,
`stage-b-ats-create-command-projection.ts`,
`stage-b-ats-create-execution-projection.ts`,
`stage-b-browser-provider-bridge.ts`, `bounded-request-json.ts`,
`x402-protected-route.ts`, and `entity-check-x402.ts` for minimal GREEN.
Existing M42
preimage, route configuration, source adapters, payment, settlement,
wallet/provider, transaction, deployment, and live paths remain excluded.

S36-T010 is a `20-active` root-owned POLISH slice. It owns its card,
UI-S36 manifest, implementation plan, catalog, state, ledger, decision, and
review evidence. Its active Web paths are only
`apps/web/src/components/provider/deploy/provider-deploy-stages.tsx` and new
`apps/web/tests/provider-deploy-signature-handoff.test.mjs`. The test-only RED
proves one missing handoff region and is accepted for minimal GREEN in exactly
those two paths. S26/S27 remain inbox-only and M50/S29 are accepted with no
active reservation; command, wallet/provider, relay, authority, API, payment,
transaction, ATS, deployment, and live paths remain excluded.

S34-T010 is accepted. Its five RED tests and eight Green source paths are
released; D-S34-010-005 records the static public documentation acceptance.
All API/Agent/Core/Backend,
configuration, data, wallet, provider, payment, command, transaction,
deployment, and live paths remain excluded.

S35-T010 is a root-owned documentation-expansion intake. It owns only its
card, specification, UI manifest, plan, catalog, state, ledger, decisions,
and future evidence records until fresh independent readiness. Candidate Web
paths are `apps/web/src/app/docs/api/page.tsx`,
`apps/web/src/app/docs/faq/page.tsx`,
`apps/web/src/components/docs/api-reference.tsx`,
`apps/web/src/components/docs/documentation-faq.tsx`,
`apps/web/src/components/docs/documentation-home.tsx`,
`apps/web/src/components/landing/landing-footer.tsx`,
`apps/web/tests/documentation-expansion.test.mjs`, and
`apps/web/tests/public-documentation.test.mjs`. No source or test path is
reserved or authorized before separate activation; all runtime, data, API,
MCP, wallet, provider, payment, command, transaction, deployment, and live
paths remain excluded.

Independent readiness accepts S35-T010 at 10-ready under D-S35-010-002. Its
candidate paths remain unreserved: only a later fresh activation may reserve
the two declared test paths for durable RED.

D-S35-010-003 activates S35-T010 and reserves only
`apps/web/tests/documentation-expansion.test.mjs` and
`apps/web/tests/public-documentation.test.mjs` for durable RED. Every S35
source path remains prohibited until independent RED acceptance; the existing
Docs source, footer, and every runtime/product path remain frozen.

D-S35-010-004 freezes both S35 test paths and reserves only
`apps/web/src/app/docs/api/page.tsx`,
`apps/web/src/app/docs/faq/page.tsx`,
`apps/web/src/components/docs/api-reference.tsx`,
`apps/web/src/components/docs/documentation-faq.tsx`,
`apps/web/src/components/docs/documentation-home.tsx`, and
`apps/web/src/components/landing/landing-footer.tsx` for minimal GREEN. Every
other source/test path, route behavior, API/Agent/Core/Backend, configuration,
MCP, wallet/provider/payment, command, transaction, deployment, and
live-capability path remains prohibited.

D-S35-010-005 records `apps/web/tests/product-landing.test.mjs` only as a
candidate for an exact footer-link expectation correction. It is unreserved
and prohibited pending fresh independent scope acceptance; all source and
other test paths remain as D-S35-010-004 declares.

D-S35-010-006 reserves only `apps/web/tests/product-landing.test.mjs` for its
two exact Docs-link expected-array additions and direct API-endpoint denial
refinement. All source and other test paths remain frozen.

S35-T010 is accepted. D-S35-010-007 releases its two Docs routes, two Docs
components, Docs home, footer, and all S35 test reservations. The completed
surface remains static and local; all runtime/product paths remain excluded.

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

S13-T010 is an accepted root-owned presentation record comprising its card,
`docs/ui/UI-S13.md`, `docs/ui/IMPORT-LEDGER.md`, its intake-amendment, ready,
activation, RED, final task-review, and module-review evidence, queue state,
catalog, decisions, reviews, commits, and pushes. It exclusively owns the new
`apps/web/src/components/ui/status.tsx`,
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
tests are not reopened. The exact targets are accepted after the final review
confirmed one outer polite region for structured results and no nested duplicate
announcements. Every other Web/UI, route, package/lockfile,
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

B03-T020 is an accepted `60-done` CORE_P0 successor comprising its card,
`docs/specs/b03-agent-safe-phase-diagnostics.md`, its local plan and
intake/ready/activation/RED/GREEN reviews, catalog, ownership, State,
decisions, reviews, commits, and pushes. Its accepted source range is exactly
`apps/agent/src/riskscan-pay-observability.ts`, the narrow CLI-edge amendment
of `apps/agent/src/riskscan-pay-cli.ts`, and matching changes to
`apps/agent/test/riskscan-pay-observability.test.mjs` plus the narrow
preflight amendment of `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`.
This sequential reservation is closed. B03-T010 remains `50-blocked` with no
active source lane and is not reopened. B03-T020 did not change the payment
library, manifest, lockfile, public export, configuration, key, account,
signer, wallet, provider, request payload/header, signed retry, settlement,
deployment, or live-evidence path. No agent executes a preflight or replacement
payment.

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

HA-ATS-RUNTIME-BINDING-001 is an accepted root-owned human-control record
comprising only its recommended and recorded decisions, HUMAN-ACTIONS.md,
queue state, this ownership record, and decisions. It owns no source, test,
schema, manifest, authority row, package, configuration, environment,
provider, wallet, SDK, network, account, asset, transaction, deployment, or
live-evidence path. Until a separately scoped card receives its own ownership,
M32 and M33 remain unchanged and M33 remains zero-enabled.

HI-003, HI-004, and HI-005 are accepted root-owned control/evidence records
comprising only their completed intake cards, decision and human-action rows,
queue state, catalog, control reviews, this ownership record, commits, and
pushes. They own no product source, test, configuration, environment,
credential, provider, wallet, SDK, account, funding, transaction, deployment,
or live-evidence path. Their closure does not advance any successor outside its
own local lifecycle.

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
until its own ready cycle. M45-T010 owns only its exact new Web
active-directory module and focused test. The root integration reservation
permits only the declared amendments to
`apps/web/src/lib/tool-directory.ts`, `apps/web/src/app/api/tools/route.ts`,
and `apps/web/tests/tool-directory-api.test.mjs`. The default `GET /api/tools`
response remains the accepted static body; only the exact
`?view=active-directory-version` query may return the active-version metadata
view. No Agent reader or Agent test is reserved, and no served metadata becomes
payment, availability, or execution authority.

M45-T010's durable RED contract is accepted at `2ee65bb`. Its root-integrated
GREEN scope is limited to `apps/web/src/lib/active-directory-version.ts`, the
declared type-only/view amendment to `apps/web/src/lib/tool-directory.ts`, and
the exact opt-in `GET` amendment to `apps/web/src/app/api/tools/route.ts`.
The accepted default discovery response, Agent reader/tests, every payment or
provider boundary, and all configuration, wallet, SDK, transaction, deployment,
and live paths remain excluded.

M45-T010 is accepted at `f2275ab15fcde4eb0893c187167ded7e4779c90c` after
independent task review and two fresh clean module reviews. Its final
test-only amendment proves both the pre-response deadline and exact byte-cap
boundary; it does not widen the declared source, route, or integration scope.

M41-T010's scoped atomic-handoff correction is root-integrated only. It may
amend `packages/backend/convex/external_prepare_command_admission.ts`,
`packages/backend/convex/offerings.ts`, and `packages/backend/convex/schema.ts`
to add the closed `ATS_CREATE` atomic handoff and only the
`by_ats_create_draft_binding` offering index. Its test-only RED scope also
includes constrained amendments to the existing M32/M40 focused tests and its
two new M41 test files. No other M32/M40 behavior, schema field/table/index,
M40 projection, Web, Agent, package, configuration, provider, wallet, SDK,
transaction, deployment, or live-evidence path is eligible.

M41-T010's independently reviewed RED contract is accepted at `66f4ca5`. Its
root-integrated GREEN scope is limited to the three declared Convex modules,
the reserved `ingressCommandReplayClaims` table/index, the atomic M32
admission, the M40 DRAFT-offering linker/index, and their already-declared
focused test amendments. No other M32/M40 behavior, schema field/table/index,
configuration, key, publication, Web, Agent, package, wallet, provider, SDK,
transaction, deployment, or live-evidence path is eligible.

M41-T010 is accepted at `20983649632f4812d9ee045637eb183b3158cc38` as the
closed local ingress/replay/atomic-admission/public-projection boundary. Its
ownership is complete. M43-T010 may not amend the shared schema, its schema
assertion, or `command_dispatch.ts` until its own root control record reserves
only the already-declared state/field, assertion, and disabled-entry changes.

M43-T010's root control reservation is now recorded after M41 acceptance. On
an eventual authorized GREEN cycle, it may amend only
`packages/backend/convex/schema.ts` to widen
`externalPrepareCommandAttempts.state` and add exactly its three declared
optional candidate/reconciliation fields; amend only
`packages/backend/tests/external-prepare-command-durable-schema.test.mjs` to
match that exact shape; amend only
`packages/backend/tests/offering-durable-schema.test.mjs` to match that same
M32 subset shape; and amend only
`packages/backend/convex/command_dispatch.ts` to enable the already-declared
`external.attachCandidate` entry. This future GREEN reservation grants no
implementation, schema, dispatch, configuration, SDK, wallet, provider,
transaction, deployment, or live-action work today; its readiness, activation,
and RED reviews remain separate gates.

M43-T010 is active at `84c80f2` only to create its three declared durable
test-only RED files and the matching narrow
`external-prepare-command-durable-schema.test.mjs` assertion amendment, the
same-shape `offering-durable-schema.test.mjs` M40 compatibility assertion
amendment, plus the constrained M41 dispatch-test replacement below. Every M43
source, schema,
and dispatch amendment remains absent until a fresh RED review accepts its
exact failure contract.

The root additionally reserves one active M43 test-only RED replacement in
`packages/backend/tests/command-dispatch.test.mjs`, limited exactly to the
accepted M41 disabled-attach-candidate assertion at lines 851–866 as they stood
at M43 activation. It is replaced during M43 RED with the closed
`ATTACHED`/`ALREADY_ATTACHED`/`COMMAND_REPLAYED` mapping defined in the M43
specification, must fail against M41's current disabled entry, and may not
change any source. No other M41 test, response arm, header rule, projection,
source, schema, configuration, SDK, wallet, provider, transaction, deployment,
or live behavior is reserved. A fresh independent RED acceptance remains
required before every M43 source, schema, or dispatch amendment.

M43's current zero-enabled ATS_* receipt action never invokes M40 readiness. A
post-Stage-B successor needs a new scoped authority before the fixed one-read
receipt boundary or its result changes.

M43-T010 is accepted as the complete local owner of its three declared receipt
source modules, their focused tests, its reserved attempt-state/optional-field
schema widening, the matching M32/M40 schema assertions, and the one closed
dispatch-entry enablement. Its ownership adds no positive ATS verification,
M40 readiness transition, SDK, wallet, provider, configuration, transaction,
deployment, or live behavior.

The root additionally reserves one M41 regression-baseline correction in
`packages/backend/tests/offering-durable-schema.test.mjs`: only the exact
`by_ats_create_draft_binding` expected M40 index vector may be appended to
`expectedM40.offerings.indexes`. This test-only correction confirms the
already-authorized M41 schema index; it reserves no source, schema, or other
test change.

S15-T010 owns its exact wallet-island and relay paths. S16-T010 owns its exact
provider-deploy page, components, state, fixture, display configuration literal,
and tests. S17-T010 is governed by its root-controlled record below and has no
source authority until its separate activation. M44-T010 owns its
exact ATS client/request/action and test paths. M44 must not import, adapt, or
reuse S16's display configuration literal: its complete real-issuer fixture is
test-local, and a future separately scoped bridge owns every trusted runtime
configuration or durable-attempt handoff. S18-T010 owns its exact backing route,
components, state, fixtures, and tests. S15 and M44 both reserve the Web
manifest, root lockfile, and static-shell dependency contract, so S15 must be
accepted before M44 is reviewed; S16's provider-deploy component boundary must
be accepted before M44 touches its declared action path. No other cross-card
source overlap is authorized. Every card retains its explicit human-action and
external-capability exclusions.

S18-T010 is accepted at rebased source `164f170ef759490a82476669266946e9aa3b5a5d`.
Its route, backing components, and focused tests have no continuing reservation.
The direct route remains supplied-projection-only and unavailable while no
separately accepted runtime boundary supplies an OPEN offering and explicit
funding treasury. Its acceptance provisions neither an enabled `BACKER`
authority nor an M40 treasury field.

M44-T010's independently reviewed RED contract is accepted at `c5d2bf3`.
Before any remaining M44 source, the root-owned next step may amend only
`apps/web/package.json`, the root `package-lock.json`,
`apps/web/tests/static-shell.test.mjs`, and the minimum client-island import
needed for the official SDK bundle gate. The request builder and injected
client remain absent until that gate passes. No trusted configuration bridge,
durable attempt, wallet/provider interaction, transaction, deployment, or live
behavior is authorized.

The first M44 bundle-gate experiment was exhausted and removed because its
island was unreachable. `D-M44-010-006` now reserves exactly one retry:
`apps/web/package.json`, the root `package-lock.json`,
`apps/web/tests/static-shell.test.mjs`,
`apps/web/tests/ats-sdk-bundle-gate.test.mjs`, the new
`apps/web/src/components/provider/deploy/ats-create-action.tsx`, and only
`apps/web/src/components/provider/deploy/provider-deploy-stages.tsx` for its
single stage-3-first-substep mount. The island may statically import only the
official `@hashgraph/asset-tokenization-sdk@8.0.0` root and render a disabled
unavailable control. It may not invoke the SDK, read or adapt configuration,
construct a client, touch a wallet/provider, create a durable attempt, submit a
transaction, or add a shim, polyfill, patch, fork, or alias. A Webpack build,
client-manifest/chunk inspection, and browser import-evaluation proof decide
the retry; an SDK failure stops the lane with its exact diagnostic.

After the observed Turbopack client-graph failures, `D-M44-010-007` additionally
reserves only `apps/web/next.config.ts`,
`apps/web/src/lib/ats/browser/dotenv-mock.ts`,
`apps/web/src/lib/ats/browser/winston-mock.ts`, and the exact assertions in
`apps/web/tests/ats-sdk-bundle-gate.test.mjs`. The client-only aliases must
match the four upstream ATS web aliases and remain no-op compatibility adapters;
they may not add general Node polyfills, change the official SDK, expose an
environment value, or enable an SDK action. A fresh Turbopack build decides
whether those four aliases resolve the diagnosed logger graph before any other
adaptation can be considered.

`D-M44-010-008` permits one further browser-only entry in that same reserved
`turbopack.resolveAlias` map: map the optional Node BBS binding to its own
package-provided WebAssembly fallback. It creates no source path and may not
introduce a BBS mock, generic Node polyfill, or executable BBS/SDK behavior.

`D-M44-010-009` permits exactly one companion Next
`serverExternalPackages` entry for that same optional Node BBS package. It
keeps native BBS resolution out of Turbopack's server graph while the existing
conditional alias remains browser-only; it may not externalize another package
or introduce any executable BBS/SDK behavior.

`HA-ATS-CONTRACTS-VIEM-001` supersedes the M44-T010 SDK experiment as the
selected execution architecture. M44-T020 reserves its new pure
`apps/web/src/lib/ats/factory-deploy-bond.ts`, focused Factory contract and
bundle-gate tests, the existing disabled `ats-create-action.tsx`, and (under
root integration) `apps/web/package.json`, `package-lock.json`,
`apps/web/tests/static-shell.test.mjs`, and `apps/web/next.config.ts`. Its
first accepted RED contract may remove only
`apps/web/src/lib/ats/create-bond-request.ts`,
`apps/web/src/lib/ats/ats-client.ts`,
`apps/web/src/lib/ats/browser/dotenv-mock.ts`,
`apps/web/src/lib/ats/browser/winston-mock.ts`,
`apps/web/tests/create-bond-request.test.mjs`,
`apps/web/tests/ats-client.test.mjs`, and
`apps/web/tests/ats-sdk-bundle-gate.test.mjs`, plus the exact SDK pin,
static-shell assertion, browser aliases, BBS externalization, and disabled
action import. It may add only the exact official contracts artifact and
existing viem seam. It owns no wallet,
provider, RPC, signer, simulation, transaction, configuration bridge, durable
attempt, candidate attachment, or M43 source. The older reservation is
historical only and cannot authorize retained compatibility code.

S20-T010 owns the new `apps/web/src/components/discovery/explore-catalog.tsx`
and `apps/web/tests/explore-catalog.test.mjs`. The root integration reservation
allows only its declared presentation amendments to
`apps/web/src/app/explore/page.tsx`,
`apps/web/src/components/discovery/riskscan-discovery-card.tsx`,
`apps/web/tests/landing-explore.test.mjs`, and
`apps/web/tests/riskscan-directory-discovery.test.mjs`, plus the narrow M09
and UI-S05 mount-record amendments. It must not modify the Directory island's
source or state, the guest workbench, the RiskScan detail route, or navigation.

S23-T010 is a root-owned `60-done` presentation delivery at
`f2c28eafd3da7c2913ef274d41578f34b773f8d2`. Its constrained root integration
reservation over the completed S20/M14 files covered the existing
`apps/web/src/components/discovery/explore-catalog.tsx` and
`apps/web/tests/explore-catalog.test.mjs`; the five new paths were
`apps/web/src/components/discovery/entitycheck-discovery-card.tsx`,
`apps/web/src/app/explore/entitycheck/page.tsx`,
`apps/web/src/app/explore/entitycheck/loading.tsx`,
`apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`, and
`apps/web/tests/entitycheck-detail.test.mjs`. The independent RED review at
`ce21757` and GREEN review at `f2c28ea` are accepted. This did not amend the
completed S20/M14 behavior. `apps/web/tests/landing-explore.test.mjs` remains
expressly excluded because S22/S31 retain its active shared assertions. The
Directory island, guest workbench, RiskScan detail route, navigation, all
API/data behavior, and every wallet/provider/payment/transaction/deployment/
live path remain excluded.

M46-T010 is a root-controlled `60-done` CORE_P0 record comprising its card,
`docs/specs/m46-entity-check-core.md`, the new Core module
`packages/core/src/entity-check.ts`, and the focused runtime/type fixtures
`packages/core/test/entity-check.test.mjs` and
`packages/core/test/entity-check.types.ts`. The root integration reservation
permits one export-only addition of the EntityCheck values and types to
`packages/core/src/index.ts`; it must preserve every existing export and
source order. M46-T010's independently reviewed RED contract is accepted at
`f8a42e7`. Its accepted source is
`2482a9bc5f8937afefe2416cae5d7c6fb7fcf898`; the root-integrated GREEN scope
was limited to `packages/core/src/entity-check.ts` and that declared
export-only addition; the test fixtures are already committed. No I/O, source adapter, API,
Directory, UI, package, lockfile, configuration, payment, wallet, provider,
transaction, deployment, or live path is authorized.

M46-T020 is a root-controlled `60-done` CORE_P0 record comprising its card,
`docs/specs/m46-entity-check-sources.md`, its ready/activation/RED/final review
evidence, and only the Web paths `apps/web/src/lib/entity-check-sources.ts`
and `apps/web/tests/entity-check-sources.test.mjs`. M01-T040, M02-T050, and
M46-T010 are accepted. The final source at `b8843b0` was independently
reviewed after it closed the Core-incompatible extended-year clock path before
any fetch. `HA-ENTITYCHECK-LIVE-001` remains pending and was neither required
nor exercised. No package, lockfile, browser, live source read, configuration
value, payment, wallet, provider, transaction, deployment, or other live path
is authorized.

M46-T030 is a root-controlled `60-done` CORE_P0 record comprising its card,
`docs/specs/m46-entity-check-x402-api.md`, its local execution plan, its ready
and activation/final review evidence, and only
the future Web paths
`apps/web/src/lib/x402-protected-route.ts`,
`apps/web/src/lib/entity-check-x402.ts`,
`apps/web/src/app/api/entitycheck/route.ts`, and
`apps/web/tests/entitycheck-api.test.mjs`. M02-T060, M06-T010, M46-T010, and
M46-T020 are accepted. The root integration reservation permits only a
behaviour-preserving extraction of `apps/web/src/lib/riskscan-x402.ts`: every
existing export, accepted RiskScan response, cache boundary, configuration rule,
Hedera capability check, and B02 settlement-observer semantic remains intact;
`apps/web/tests/riskscan-api.test.mjs` is not amendable. The independent RED
review recorded at `docs/work-queue/evidence/M46-T030-red-review.md` is clear.
The final correction at `7ebfa172bd45178724d2ccf90bc6333ed4fe8391` restores the
inherited generic EVM CAIP-2 family and is independently reviewed in the three
recorded final reports. No package,
lockfile, configuration value, live facilitator/source read, payment, wallet,
provider, transaction, deployment, or live path is authorized.

M46-T040 is a root-controlled `60-done` CORE_P0 record comprising its card,
`docs/specs/m46-entity-check-tool-directory.md`, the compatibility amendment
at `docs/work-queue/evidence/M46-T040-directory-v2-compatibility-amendment.md`,
its clear ready review at
`docs/work-queue/evidence/M46-T040-ready-review.md`, its clear activation
review at `docs/work-queue/evidence/M46-T040-activation-review.md`, its
clear RED acceptance review at `docs/work-queue/evidence/M46-T040-red-review.md`, its
clear final task/specification/standards reviews, its
new Web descriptor source/test
`apps/web/src/lib/entity-check-tool-descriptor.ts` and
`apps/web/tests/entity-check-tool-descriptor.test.mjs`, and only the following
root-reserved migration paths:
`apps/web/src/lib/tool-directory.ts`,
`apps/agent/src/riskscan-tool-directory.ts`,
`apps/web/tests/tool-directory-api.test.mjs`,
`apps/agent/test/riskscan-tool-directory.test.mjs`,
`apps/agent/test/riskscan-tool-flow.test.mjs`,
`apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`,
`apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`,
`apps/agent/test/riskscan-tool-payment.test.mjs`,
`apps/agent/test/riskscan-tool-payment-boundary.test.mjs`,
`apps/web/tests/riskscan-directory-discovery.test.mjs`,
`apps/web/tests/riskscan-native-quote-compatibility.test.mjs`, and
`apps/web/tests/riskscan-tool-loop.test.mjs`. M05-T010, M05-T020, M06-T010,
M45-T010, and M46-T030 are accepted. The migration may replace only the
canonical default `/api/tools` body with the fixed v2 ordered pair and extend
only the RiskScan decoder to accept that closed pair plus the exact legacy v1
one-tool input. This narrowly supersedes only M05/M45's default one-tool-v1
body requirement; the current route, M45 active-directory reader/view, all Web
UI source, all other Agent source, package metadata, and lockfile are not
amendable. No second Directory endpoint, content negotiation, retry, source
read, payment, wallet/provider, account, transaction, deployment, or live
capability is authorized. EntityCheck remains inert to the RiskScan consumer;
a later dedicated consumer card is required before any Agent selects it.
The `tool-directory-api.test.mjs` reservation includes only the exact v2 tuple
assertions and the M45 builder-import-vector change from its existing two
imports to the three imports declared in the M46 specification; its route,
active-directory-view, and no-I/O assertions remain frozen.

The corrected RED contract is accepted at
`ca1d1bfee99fc53e1844dd52237b73fefd8088f3`. GREEN is authorized only for
`apps/web/src/lib/entity-check-tool-descriptor.ts`,
`apps/web/src/lib/tool-directory.ts`, and
`apps/agent/src/riskscan-tool-directory.ts`; the eleven declared test paths
remain reserved for matching updates. The route, active view, UI, package,
lockfile, configuration/environment read, source read, payment,
wallet/provider, transaction, deployment, and live path remain prohibited.

The accepted source is `3ab20483452174931bae0575d2331fa42c999dce`. It emits
only the one closed v2 default tuple, retains the strict legacy-v1 reader, and
leaves M45's opt-in active-directory view unchanged. No route, UI, package,
lockfile, configuration/environment read, source read, payment,
wallet/provider, transaction, deployment, or live path is authorized by this
acceptance.

S17-T010 is a root-controlled `60-done` CORE_P0 record comprising its card,
`docs/ui/UI-S17.md`, the UI-S17 ledger row, its local execution plan, its ready
and activation review evidence, and only
the future Web paths
`apps/web/src/app/provider/page.tsx`,
`apps/web/src/lib/offering-projection.ts`,
`apps/web/src/app/api/offerings/route.ts`,
`apps/web/src/components/provider/status/provider-status.tsx`,
`apps/web/src/components/provider/status/provider-status-state.ts`,
`apps/web/tests/provider-status.test.mjs`, and
`apps/web/tests/offerings-api.test.mjs`. M02-T020, M11-T020, M29-T010,
M41-T010, S16-T010, and S11-T010 are accepted. The root integration reservation
permits the one `{ href: "/provider", label: "Provider" }` navigation
entry and its exact-list assertion amendments in
`apps/web/src/components/discovery/local-navigation.tsx`,
`apps/web/tests/workspace-shell.test.mjs`,
`apps/web/tests/landing-explore.test.mjs`, and
`apps/web/tests/guided-demo-route.test.mjs`; the guided-demo amendment preserves
its nine steps, route links, and every non-navigation assertion. The same-card
responsive amendment additionally reserves only the existing navigation-list
class tokens and the existing workspace-shell navigation assertion: the test
must preserve the exact five-link list and require exactly `flex flex-wrap
items-center gap-1 text-sm font-medium` without an overflow mask or
minimum-width escape, and the source may insert only the bare `flex-wrap` token
after `flex` in its existing literal. No other class token or attribute may be
added, removed, reordered, or made conditional. `layout.tsx`, global CSS, all
other navigation assertions, and every semantic/runtime boundary remain outside
this reservation. The controls-only review at
`docs/work-queue/evidence/S17-T010-responsive-scope-review.md` is clear; it
authorized no test or source change before fresh responsive RED acceptance. The
committed `c1953f4e0de02b0435f5a7d209278254d37c2bf3` RED contract is now clear
in `docs/work-queue/evidence/S17-T010-responsive-red-review.md`, so only the
specified bare `flex-wrap` source insertion is authorized before final checks.
That insertion is accepted at `e7a015565a0579b26c1af439410823e533712043` after
focused 20/20, browser, and independent task/specification/standards evidence
recorded under `docs/work-queue/evidence/S17-T010-responsive-`.
`apps/web/tests/shell-accessibility.test.mjs` is not amendable. The independent
RED review recorded at `docs/work-queue/evidence/S17-T010-red-review.md` is
clear, so only the five declared source paths and the root-reserved `/provider`
navigation entry are authorized for minimal local GREEN. The stale remote S17
branch is unreviewed and has no ownership or implementation authority. No client
state, timer, command, write, Mirror/chain read, wallet, provider, payment,
transaction, deployment, or live path is authorized.

S21-T010 is a root-controlled `60-done` CORE_P0 record. Its historical
source was integrated at `48421352607a00c1a73f593dcc48160fac771e6a`; that is
not acceptance evidence. The corrective record
`docs/work-queue/evidence/S21-T010-corrective-review.md` reserves only a
test-first correction in `apps/web/tests/provider-deploy-state.test.mjs`,
`apps/web/tests/provider-deploy-route.test.mjs`, and
`apps/web/tests/deploy-stage-signing.test.mjs`, with
`apps/web/tests/command-bridge.test.mjs` only if needed to prove the existing
Core rejection. After a fresh independent RED acceptance, its exact minimal
production scope is `apps/web/src/components/provider/deploy/provider-deploy-state.ts`,
`apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`, and
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`.
`command-bridge.ts`, every S15 module, the directory literal, the remaining
S16 paths, M44's ATS action path, and S17's provider-status paths are not
amendable. The stage 4 literal keeps `clearingAccount` absent under
`D-S21-010-001`; no request is built and the stage stays unavailable. No
wallet, provider, SDK, configuration, durable write, transaction, deployment,
or live path is authorized by the corrective scope. The independent ready
review is recorded at `docs/work-queue/evidence/S21-T010-ready-review.md`, the
activation at `docs/work-queue/evidence/S21-T010-activation-review.md`, and
the RED acceptance at `docs/work-queue/evidence/S21-T010-red-review.md`.
The accepted corrective source is `09899fdf269bc78493e39e067fdc57ad867c6564`;
its independent task and two module reviews are recorded at
`docs/work-queue/evidence/S21-T010-task-review.md`,
`docs/work-queue/evidence/S21-T010-module-review-spec.md`, and
`docs/work-queue/evidence/S21-T010-module-review-standards.md`. A future
change to any S21 source requires its own scoped authority; no active source
path remains authorized by this completed corrective cycle.

M47-T010 is an accepted `60-done` CORE_P0 runtime-binding correction. Its
completed scope comprised its card, specification, plan, reconciliation
evidence, readiness/activation/RED reviews, import-ledger row, catalog, State,
decisions, reviews, commits, and pushes. Its durable RED contract covered
`packages/backend/tests/stage-b-ats-create-runtime-binding.test.mjs`,
`packages/backend/tests/external-prepare-command-durable-admission.test.mjs`,
`apps/web/tests/stage-b-ats-create-command-projection.test.mjs`,
`apps/web/tests/command-bridge.test.mjs`, and
`apps/web/tests/deploy-stage-signing.test.mjs`. Its completed source scope was
`packages/backend/convex/stage_b_ats_create_runtime_binding.ts`,
`packages/backend/convex/external_prepare_command_admission.ts`,
`apps/web/src/lib/ats/stage-b-ats-create-command-projection.ts`,
`apps/web/src/lib/wallet/command-bridge.ts`, and
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`, with those
five tests. No active M47 source reservation remains; a future amendment needs
a fresh scoped authority. The private admission binding remains ordered after
M32 revalidation and before M33, replay, idempotency, or state; the M42 real
projection stays private and the browser receives only its six fixed M26
fields. M33's manifest, M44's Factory helper, S16's display literal, packages,
lockfiles, environment, public Backend exports, routes, and submission documents
remain excluded. No authority provision, SDK, provider, wallet, network,
transaction, candidate, or live path is authorized.

M48-T010 is a root-controlled accepted `60-done` CORE_P0 successor. Its committed
control surface is its card, specification, plan, accepted human decision,
intake review, GREEN scope amendment, import-ledger row, catalog, State,
decisions, reviews, commits, and pushes. Its candidate implementation surface is exactly
`packages/backend/convex/ats_prepare_authority.ts`,
`packages/backend/tests/ats-prepare-authority.test.mjs`, and the narrowly
amended `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`.
Durable RED and the six-path GREEN scope are accepted after clear independent
task/specification/standards reviews. The manifest is one private frozen literal
only; it may not import M42 or add an SDK capability. M37/M42/M43 sources and
every M42 preimage/hash field remain excluded.
M42, M47, M32 source, schema, public exports, packages, lockfiles, Web, Agent,
environment, `commandAuthorities` provisioning, and every SDK/provider/wallet/
network/transaction/candidate/live path are excluded.

M49-T010 is accepted at `60-done` with no active source reservation. Source
`aeb866adbe86e41ab01476a4b54ece95dc234813` follows durable RED
`dcd60d8d37a3491a900bc007ee882fc83858554c` and is limited to its exact
browser bridge, projection, UI, and matching-test surface. The public execution
projection is a frozen, rehashed transcription of the exact M42 real
configuration passed only to M44; M47's six-field command projection and S16's
display projection remain separate. The fixed Mirror resolver uses only the
M42 public testnet base, HI-004 issuer-account evidence, and an actually
returned transaction id; it never synthesizes an id. Its page-session controller
blocks concurrent sends and latches every post-hash terminal result until
reload. S22/S24 are disjoint. S26 may now rebase its inbox-only signing-island
reservation on the accepted M49 interface. M42/M44/M47/M48 source, command
bridge, provider discovery, Backend/Convex, packages, lockfiles, environment,
key, SDK, deployment, and every live provider/request/transaction/candidate/
verification/lifecycle path remain excluded until their own authority gates.

HI-011 is a root-only pending human-gate control record. It owns only its
intake card, the two draft decision packets, the corresponding HUMAN-ACTIONS,
STATE, TASK-CATALOG, DECISIONS, ownership, review, commit, and push records.
It owns no source, test, schema, package, environment, configuration, runtime,
provider, wallet, signer, authority row, transaction, Mirror request,
candidate, verification, lifecycle, funding, deployment, or live-evidence
path. Human Ops alone may act only after an explicit accepted human decision;
root independently reviews its redacted evidence before preparing the separate
downstream Stage-B decision.

M44-T030 is an accepted `60-done` CORE_P0 decoded-event correction to M44-T020.
Its completed source is `8d019e599c320d951197d3a405d5fa3969958380`; no active
reservation remains. It changed only
`apps/web/src/lib/ats/factory-deploy-bond.ts` and
`apps/web/tests/factory-deploy-bond.test.mjs` after the independent RED review
of `8053346d9aa25e666bf0fe14a12a767d9be3cdb7`: validate a decoded non-zero EVM
address, then lowercase that valid event value while leaving trusted
configuration parsing strict. Any future amendment requires a new scoped card.
The selected official Factory artifact and viem seam, every package/lockfile,
SDK/browser compatibility, M47 path, provider, wallet, RPC, transaction,
candidate, deployment, and live path remain excluded.

S26-T010 is an `00-inbox` POLISH card with no active source reservation. Its
proposed new paths are `apps/web/src/components/wallet/wallet-session.tsx` and
`apps/web/tests/wallet-session.test.mjs`; its root-only integration reservations
are `apps/web/src/components/wallet/wallet-connect.tsx`, the header block and
shell wrapper in `apps/web/src/app/layout.tsx`, the wallet block in
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`, the
conditional accepted `apps/web/src/components/backing/backing-flow.tsx` island
mount, and only the named assertions in
`apps/web/tests/deploy-stage-signing.test.mjs`,
`apps/web/tests/static-shell.test.mjs`, and
`apps/web/tests/shell-accessibility.test.mjs`. M49-T010 retains CORE_P0
precedence over the shared signing-island path: S26 may not activate or amend
it until M49 is accepted and S26 is freshly rebased. S26 adds no current wallet
permission, provider request, signature, transaction, or live authority.

S27-T010 is an `00-inbox` POLISH card with no active source reservation. Its
proposed new test is `apps/web/tests/deploy-wizard-stepper.test.mjs`; its
root-only integration reservations are the `StepProgress` function, caption,
and badge in `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`,
the step-3 label in `apps/web/src/components/provider/deploy/provider-deploy-state.ts`,
and only the named label/caption/progress assertions in
`apps/web/tests/provider-deploy-state.test.mjs` and
`apps/web/tests/provider-deploy-route.test.mjs`. It must follow S25's wizard
amendment and remains disjoint from M49. S27 adds no provider, wallet,
transaction, deployment, or live authority.

S22-T010 is an accepted root-owned early truth-first POLISH lane at final
refinement `c210a5a`. Its independently accepted source/test scope comprises
only `apps/web/src/app/page.tsx`,
`apps/web/src/components/landing/landing-hero.tsx`,
`apps/web/src/components/landing/landing-sections.tsx`,
`apps/web/src/components/landing/landing-footer.tsx`,
`apps/web/tests/product-landing.test.mjs`,
`apps/web/tests/landing-explore.test.mjs`, and
`apps/web/tests/public-landing-reconciliation.test.mjs`. It selected no new
asset. D-S22-010-006 accepts the renewed RED and authorizes only the existing
root/three component paths, their three focused tests, and the individually
selected `apps/web/public/brand/hero-trio.png` asset for GREEN. Every global
layout/navigation/CSS, non-root route, provider/ATS, configuration, package,
README, submission, deployment, video, and all other path remains prohibited.
S31-T010 holds the sole root integration reservation to amend only the
`LocalNavigation` entry assertions in `apps/web/tests/landing-explore.test.mjs`;
all other S22 assertions and every S22 source path remain unchanged.

S24-T010 is an accepted root-owned early truth-first POLISH lane at final
refinement `27fb244`, limited to
`apps/web/src/app/dashboard/page.tsx`,
`apps/web/src/components/workspace/workspace-shell.tsx`,
`apps/web/src/components/workspace/workspace-overview.tsx`,
`apps/web/src/components/workspace/workspace-navigation.tsx`,
`apps/web/tests/workspace-shell.test.mjs`, and the new
`apps/web/tests/dashboard-workspace-reconciliation.test.mjs`. Global
layout/navigation/CSS, child route/island, API/Agent, Provider/Demo, asset,
configuration, package, README, submission, deployment, and video paths remain
prohibited. Independent final review is recorded in
`docs/work-queue/evidence/S24-T010-final-review.md`.
S31-T010 holds the sole root integration reservation to amend only the
`LocalNavigation` entry and responsive-list assertions in
`apps/web/tests/workspace-shell.test.mjs`; all other S24 assertions and every
S24 source path remain unchanged.

S30-T010 is an accepted root-owned truth-first POLISH slice comprising its card,
`docs/ui/UI-S30.md`, the local UI ledger, decision, state, catalog, this
ownership record, reviews, commits, and pushes. Its accepted source/test set
is exactly `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`,
`apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx`,
`apps/web/src/components/demo/guided-demo-steps.tsx`,
`apps/web/tests/riskscan-tool-loop.test.mjs`, and
`apps/web/tests/guided-demo-route.test.mjs`. It may change only the full
ToolLoop page/form composition and the existing Guided Demo Dashboard-step
wording. The current fields, declarations, defaults, submit lock, Agent
composition, and closed outcome mapping remain fixed. Every other route,
source, test, state module, Agent/API/Core/Backend, global layout/navigation/
CSS, asset, configuration, wallet/provider, payment, transaction, deployment,
and live path remains prohibited until a separate accepted scope says
otherwise.

D-S30-010-002 reserves only the `/dashboard` expected-row assertion in
`apps/web/tests/guided-demo-route.test.mjs` for S30-T010. S31-T010 retains
every navigation assertion in that file, including its four local navigation
entries; neither slice may change the other's assertion or source path.
D-S30-010-005 accepts this exact source/test set at `4382af2` after focused
validation, Web typecheck, responsive browser verification, and independent
review. Its request semantics and every no-mock exclusion remain fixed.

S31-T010 is an accepted root-owned truth-first POLISH source scope at final
refinement `fb706f1`, comprising its card,
`docs/ui/UI-S31.md`, the local UI ledger, decision, state, catalog, this
ownership record, reviews, commits, and pushes. Its accepted source/test set
is exactly `apps/web/src/app/layout.tsx`,
`apps/web/src/components/discovery/local-navigation.tsx`,
`apps/web/tests/landing-explore.test.mjs`,
`apps/web/tests/workspace-shell.test.mjs`, and the navigation assertion in
`apps/web/tests/guided-demo-route.test.mjs`. It may migrate only the full
shared shell presentation into the selected reference direction while
retaining the two truthful strips, current home/desktop/menu/CTA hrefs, and
their behavior. Every non-shell route/component/test, global CSS, asset,
dependency, data/runtime/configuration, wallet/provider/payment/transaction,
deployment, and live path remains prohibited until a separate accepted scope
says otherwise.

D-S31-010-006 supersedes only S31's completed status after an independent
review found one unreserved compact-strip assertion in the shared
`apps/web/tests/landing-explore.test.mjs`. S31 is `20-active` solely to remove
that exact test. Its layout, navigation source, and every other test assertion
are closed; this remedial reservation grants no new behavior, presentation, or
CTA authority.

D-S31-010-007 accepts correction `20125ac`; S31 is again `60-done` and grants
no further source or test reservation.

S32-T010 is an accepted root-owned test-contract correction at `5ab83af`.
Its only former reserved path was `apps/web/tests/static-shell.test.mjs`. S32
may never
amend `layout.tsx`, `page.tsx`, or any other source/test path. Its source
inputs are accepted S31 shell copy and the exact existing internal
`/provider/deploy` CTA. The correction must retain the static no-runtime
vocabulary boundary and grants no visual, route, product, wallet, payment,
provider runtime, or live authority.

Independent readiness at `8256d62`, activation at `106c61a`, and final review
at `5ab83af` accept only
the existing assertion correction: retain static shell/home checks, add the
exact local provider-deploy href and CTA label checks, remove only
`provider|deploy` from the deny-list, and retain the remaining no-runtime
terms. No further path or authority is granted.

S25-T010 is a root-owned `00-inbox` presentation intake. Its only candidate
new paths are `apps/web/src/components/ui/page-header.tsx` and
`apps/web/tests/page-header.test.mjs`. Its only candidate amendments are the
header blocks of the nine routed pages and the two components listed in
`docs/ui/UI-S25.md`, the `/provider` display label in
`apps/web/src/components/discovery/local-navigation.tsx`, the four closed
outcome sentences in `apps/web/src/components/provider/status/provider-status.tsx`,
and only their header/label/copy assertions in the manifest's accepted tests.
Those candidate paths were released by accepted S20/S22/S23/S24/S28/S29/S30/
S31 slices and are root integration reservations only; S25 owns no source or
test path until a separate independent readiness review and durable RED
activation. No route, body/card/shell redesign, data/state/reader/action
change, wallet/provider/payment/transaction/deployment, external link, metric,
account, funding, return, or live claim is in scope.

D-S25-010-002 reconciles S25-T010's future scope at `266c786`: S22, S24,
S31, and S32 are accepted and release their former reservations. If a fresh
independent readiness review later accepts durable RED, S25's exact test scope
is `apps/web/tests/page-header.test.mjs`,
`apps/web/tests/workspace-shell.test.mjs`,
`apps/web/tests/guided-demo-route.test.mjs`,
`apps/web/tests/landing-explore.test.mjs`,
`apps/web/tests/provider-status.test.mjs`,
`apps/web/tests/riskscan-detail.test.mjs`,
`apps/web/tests/dashboard-workspace-reconciliation.test.mjs`,
`apps/web/tests/guest-riskscan-workbench.test.mjs`,
`apps/web/tests/riskscan-native-quote-compatibility.test.mjs`,
`apps/web/tests/riskscan-quick-preflight.test.mjs`,
`apps/web/tests/riskscan-tool-loop.test.mjs`, and
`apps/web/tests/provider-visual-reconciliation.test.mjs`, limited to the
declared header/label/outcome assertions. No S25 source or test path is active
until that separate review and activation; all other tests are
verification-only.

D-S25-010-004 activates S25-T010 at `d240d10` only for durable RED in those
twelve named test paths. No S25 source path, including the future
`page-header.tsx`, is active. Every route/data/action/state, wallet/provider/
payment/transaction/deployment, and live boundary remains prohibited pending
an independent RED review.

D-S25-010-005 accepts RED at `ea19691` and authorizes minimal GREEN only in
`apps/web/src/components/ui/page-header.tsx`; the nine routed-page header
blocks named by UI-S25; `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`;
`apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`;
`apps/web/src/components/discovery/local-navigation.tsx`; and
`apps/web/src/components/provider/status/provider-status.tsx`, with matching
updates only to the twelve activated tests. Every other source/test path and
all non-presentation behavior remain prohibited.

D-S25-010-006 records one proposed scope correction after the full Web suite:
`apps/web/tests/riskscan-try.test.mjs` statically asserts the RiskScan-detail
Try action, which the authorised header migration now supplies through the
fixed PageHeader action object. The candidate amendment is limited to that
one assertion; it changes no request-flow/form/response/client assertion. The
path remains prohibited pending a fresh independent scope review.

D-S25-010-007 accepts that correction at `c98edcc`: S25 owns only the raw
RiskScan-detail Try-href assertion in
`apps/web/tests/riskscan-try.test.mjs`, which may change to the fixed
PageHeader action-object pair. The test's other assertions and every source
path remain governed by their existing scopes.

D-S25-010-008 accepts S25-T010 at
`886987ab8854d7f90bf734e84ad31cdfcb0720f1` after independent GREEN review.
Its completed delivery is the fourteen named presentation paths and the one
accepted RiskScan Try assertion correction in UI-S25; all reservations are
released. No data, reader, request/form/workflow, wallet, payment, ATS,
transaction, deployment, or live path is granted by this acceptance.

S28-T010 is a root-owned 00-inbox truth-first POLISH intake comprising its
card, `docs/ui/UI-S28.md`, the local UI ledger, decision, state, catalog, this
ownership record, reviews, commits, and pushes. Its only candidate source/test
paths are `apps/web/src/app/provider/page.tsx`,
`apps/web/src/components/provider/status/provider-status.tsx`, and the new
`apps/web/tests/provider-visual-reconciliation.test.mjs`. The accepted S17
projection reader/state, existing provider-status reader test, and provider
deploy wizard are expressly excluded. No implementation path is reserved until
an independent readiness review, durable focused RED, and independent RED
review accept exact GREEN.

D-S28-010-002 reserves only the new
`apps/web/tests/provider-visual-reconciliation.test.mjs` for S28-T010's
durable RED. The Provider page and status component remain source-prohibited;
the S17 reader/state and test, deploy wizard, every live/financial claim, and
all other paths remain outside S28 until a fresh independent RED review grants
an exact GREEN scope.

D-S28-010-003 authorizes exactly `apps/web/src/app/provider/page.tsx`,
`apps/web/src/components/provider/status/provider-status.tsx`, and
`apps/web/tests/provider-visual-reconciliation.test.mjs` for S28's minimal
presentational GREEN. The RiskScan card is a local `/provider/deploy` path,
not an admitted/active/published offering assertion; all real states remain in
the existing closed projection regions. No other source/test path is granted.

S28-T010 is accepted at source `5352f05`. Its final local source/test set is
exactly the Provider page, Provider status component, and focused S28 visual
test named above. This is a completed presentation-only scope: it grants no
further reservation, no reader/state/deploy-wizard amendment, and no data,
wallet/provider/payment/transaction/deployment/live path.

S29-T010 is a root-owned `20-active` test-only RED truth-first POLISH slice
comprising its
card, `docs/ui/UI-S29.md`, the local UI ledger, decision, state, catalog, this
ownership record, reviews, commits, and pushes. Its only candidate source/test
paths are `apps/web/src/app/provider/deploy/page.tsx`,
`apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`,
`apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`,
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`, and the
new `apps/web/tests/provider-deploy-visual-reconciliation.test.mjs`. The four
listed components may change only presentation markup, classes, heading/copy,
and local return/footer links while preserving their existing imports, fields,
initial values, validation, state transitions, calls, and handlers. The exact
immutable S16/M47 paths are `provider-deploy-state.ts`, `campaign-fixture.ts`,
`ats-create-configuration.ts`, `ats-create-action.tsx`,
`directory-record-literal.ts`, `apps/web/src/lib/wallet/command-bridge.ts`, and
their current behavior tests. No implementation path is reserved until
independent readiness, durable RED, and independent RED review accept exact
GREEN.

D-S29-010-003 reserves only the new
`apps/web/tests/provider-deploy-visual-reconciliation.test.mjs` for S29's
durable RED. Its four candidate components remain source-prohibited. The
S16/M47 logic modules and all existing behavior tests remain outside S29;
no other source or test path is granted until independent RED acceptance names
an exact GREEN scope.

D-S29-010-004 authorizes exactly
`apps/web/src/app/provider/deploy/page.tsx`,
`apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`,
`apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`,
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`, and
`apps/web/tests/provider-deploy-visual-reconciliation.test.mjs` for minimal
presentational GREEN. The current S16/S21/M47/M44 behavior tests are
verification-only. No other path, state transition, handler, wallet/signature,
ATS, data, payment, transaction, deployment, or live claim is granted.

S29-T010 is accepted at source `dc9f010`. Its final local source/test set is
exactly the Provider deploy page, wizard, stages, signing component, and
focused S29 visual test named above. This completed presentation-only slice
grants no further reservation and no amendment to any existing S16/S21/M47/M44
behavior test, state, fixture, configuration, wallet/signature, ATS, data,
payment, transaction, deployment, or live path.

S33-T010 is a root-owned 00-inbox presentation intake. Its candidate paths
are exactly apps/web/src/app/explore/page.tsx,
apps/web/src/components/discovery/explore-catalog.tsx,
apps/web/src/components/discovery/riskscan-discovery-card.tsx,
apps/web/src/components/discovery/entitycheck-discovery-card.tsx,
apps/web/tests/explore-catalog.test.mjs, and one new
apps/web/tests/explore-visual-reconciliation.test.mjs. S20/S23 accepted
ownership is historical only and grants no continuing source reservation.
No target is active until a fresh independent readiness review and separate
RED activation. The Directory island, navigation, shared/global CSS, route
behavior, API/data, client state, wallet/provider/payment, transaction,
deployment, and every live boundary remain excluded.

Independent readiness at dec98bb22fc8a3e2403a426fa5639130bb053cf4 and
activation at c541039d6d7a0cc98cdc1ced8d3e9f4ff997db08 are clear. S33-T010
is 20-active only for apps/web/tests/explore-catalog.test.mjs and the new
apps/web/tests/explore-visual-reconciliation.test.mjs to create durable RED.
Every source path remains prohibited until independent RED acceptance grants
the minimal Green scope.

Independent RED review at 85f99346077d1dadb4e728eefe5ac31df2f08934 is clear:
the durable tests change only within their reservation and fail only because
the current page/catalogue/card presentation is absent. The root may amend
only the four declared S33 presentation source paths and the two matching
focused tests for minimal Green. All behavior, data, route, wallet, provider,
payment, transaction, deployment, and live paths remain excluded.

Independent task review at a56687ef538c5bd23eb1add95df723271e55d87c is clear.
S33-T010 is in task review; its exact Green source/test surface is frozen
through independent module review. No behavior, data, route, wallet, provider,
payment, transaction, deployment, or live path is added or authorized.

The independent module review blocks S33 on one unsupported payment claim and
one incomplete static-boundary proof. D-S33-010-006 reserves only
`apps/web/tests/explore-visual-reconciliation.test.mjs` for corrective RED.
Every production path remains frozen until a fresh RED review; that review may
authorize only the supporting sentence in `apps/web/src/app/explore/page.tsx`.
The catalogue, cards, routes, data, client/runtime behavior, wallet/provider/
payment, transactions, deployment, and live boundaries remain excluded.

D-S33-010-007 additionally reserves only the existing `machine-payable`
supporting-sentence assertion in `apps/web/tests/landing-explore.test.mjs`.
No other assertion in that test, test path, or source path is reserved.

D-S33-010-008 supersedes no source authority: the rebuilt exact-head review
keeps only `apps/web/tests/explore-visual-reconciliation.test.mjs` and that
same exact landing assertion reserved for corrective RED.

D-S33-010-009 authorizes only the supporting-sentence literal in
`apps/web/src/app/explore/page.tsx`. The matching two test assertions are
already established RED; every other test and source path remains frozen.

D-S33-010-010 accepts `25d8b4e` and closes every S33 source and test
reservation. The correction grants no continuing ownership or behavior scope.

M50-T010 is an accepted `60-done` CORE_P0 wallet-session synchronization
correction. Its delivered surface is exactly
`apps/web/src/lib/wallet/metamask-provider.ts`,
`apps/web/src/components/wallet/wallet-connect.tsx`,
`apps/web/tests/wallet-state.test.mjs`, and new
`apps/web/tests/wallet-session-sync.test.mjs`. Its source and test reservations
are released after independent GREEN acceptance. The refreshed activation review
at `96cce4c` reserved only
`apps/web/tests/wallet-state.test.mjs` and new
`apps/web/tests/wallet-session-sync.test.mjs` for durable RED. Independent RED
acceptance at `3d8ad88` now reserves exactly those test paths plus
`apps/web/src/lib/wallet/metamask-provider.ts` and
`apps/web/src/components/wallet/wallet-connect.tsx` for the accepted GREEN
history. S26-T010 is
inbox-only and explicitly excludes `metamask-provider.ts`; it must preserve
M50's accepted event behavior if it later rebases its shared-session redesign.
M50 does not own or amend
`wallet-state.ts`, deploy-stage signing, command/relay code, configuration,
packages, lockfiles, or any live path.
