# M05-T010 — RiskScan machine-readable Tool Directory

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M02-T050 accepted; M02-T060 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-050-002, and D-M02-060-002 accepted
- Owner: the proposed implementation scope is `apps/web/src/lib/tool-directory.ts`, `apps/web/src/app/api/tools/route.ts`, and `apps/web/tests/tool-directory-api.test.mjs`. The root owns this card, its local specification and plan, queue state, catalog, file ownership, decisions, and integration evidence.
- Human actions: none for local discovery endpoint/code and controlled tests. Runtime configuration, directory registration, deployment, external proof, payment, settlement, transaction verification, finality, receipt/evidence capture, accounts, wallets, and live assertions remain human-authorized.

## Scope

Create one machine-readable local `GET /api/tools` endpoint for exactly one
RiskScan Quick descriptor. It publishes a bounded request/declaration schema,
two explicit limitations, and a fail-closed x402 parser-derived local
configuration state. The response exposes neither a recipient nor facilitator
information, and it does not call RiskScan or any payment boundary.

The endpoint is discovery-only. It does not register an external directory,
validate a facilitator, execute a tool, issue/settle a payment, verify a
transaction, create durable data, prove finality, create receipt/evidence or a
result, configure/deploy a runtime, or make a live claim.

The local contract is [M05 RiskScan machine-readable Tool Directory](../../../specs/m05-riskscan-tool-directory.md); its executable steps are in the [M05 Tool Directory plan](../../../superpowers/plans/2026-09-05-m05-riskscan-tool-directory.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED
  tests or implementation.
- M01-T040, M02-T050, and M02-T060 remain accepted locally, their integration
  evidence is recorded, and no active lane owns the three reserved web paths.
- The card records CORE_P0 priority, exact one-tool/route/configuration-state
  behavior, strict metadata/secret boundaries, human boundary, and concrete
  validation commands.
- The delivery excludes UI changes, a Consumer Agent, external registration,
  public payment/settlement/finality action, schema/package/lockfile changes,
  runtime configuration, external-store proof, credentials, wallets/accounts,
  receipt/evidence/result material, deployment, and live claims.

## Validation

- RED/GREEN web tests cover exact route/directory shape, required top-level and
  closed declaration input schema, configuration-required and locally-configured
  states, response no-leakage, no extra tool, no side effect, and source-level
  Cache Components runtime-boundary coverage; root validation exercises the
  actual route through a running Next request.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- Root `npm run typecheck`, `npm run test`, `npm run lint`, production Webpack
  build, `npm run queue:check`, the enabled local-reference guard, independent
  task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T18:26:26Z after a fresh post-M04 critical-path rescan
confirmed M01-T040, M02-T050, and M02-T060—including their integration
evidence—are accepted; no active lane owns the new three-path web boundary; and
no human action blocks a local discovery endpoint specification or controlled
web work. This inbox card authorizes neither RED/code nor external directory
registration, runtime configuration, payment, settlement, transaction
verification, finality, evidence, result, deployment, or live claim.

## Ready transition

Ready at 2026-09-05T18:38:54Z after the root revalidated accepted M01-T040,
M02-T050, and M02-T060 dependencies and their integration evidence; the pushed
corrected local specification and plan; disjoint three-path web ownership; no
active lane; no pending human action; concrete validation commands; queue
validation; and the independent design review plus scoped re-review. The card
remains a local discovery endpoint only; no external directory registration,
configured runtime, payment, settlement, transaction verification, finality,
evidence, result, API/UI expansion, deployment, or live claim is authorized.

## Activation

Activated at 2026-09-05T18:40:04Z after a fresh queue rescan confirmed the
pushed ready state, no active lane, accepted dependencies, and the same
disjoint web ownership boundary. The task starts with its Tool Directory RED
contract. No external directory registration, configured runtime, payment,
wallet/account action, deployment, transaction verification, finality,
evidence, or live claim is authorized.

## Acceptance

Accepted at 2026-09-05T18:56:15Z. `MODULE_BASE` is
`053c79a7b8a31fe6121066da7ea09ce28e404870`; `MODULE_HEAD` is
`62377cdd1c0bf16dcf8749128c6cc201f6aac417`. The observed missing-module RED
became seven focused Green contracts. Web typecheck and 51-test suite, root
Node 22.21.1 typecheck, 136-test suite, lint, production Webpack build, queue
validation, whitespace check, and enabled local-reference guard passed. A real
local Next HTTP `GET /api/tools` returned `200` JSON with `cache-control:
no-store` and the controlled `configuration_required` state. The independent
task review and two fresh final module-review generations returned PASS with no
P0, P1, or P2 finding. This acceptance covers only controlled local discovery
metadata and parser-derived configuration summary behavior; it does not assert
directory registration, configured/live runtime, payment, settlement,
transaction verification, finality, evidence, result, deployment, or any
external fact.
