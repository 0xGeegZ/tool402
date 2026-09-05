# M05-T020 — ToolLoopAgent RiskScan discovery

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M05-T010 accepted; M02-T050 accepted; M02-T060 accepted
- Integration evidence: D-M05-010-002, D-M02-050-002, and D-M02-060-002 accepted
- Owner: the proposed implementation scope is `apps/agent/package.json`,
  `apps/agent/tsconfig.json`, `apps/agent/src/riskscan-tool-directory.ts`,
  `apps/agent/test/riskscan-tool-directory.test.mjs`, and
  `apps/agent/test/boundary.test.mjs`. The root owns this card, its local
  specification and plan, package lockfile, queue state, catalog, file
  ownership, decisions, and integration evidence.
- Human actions: none for local agent code and controlled tests. A future live
  endpoint, payment, signing, wallet/account, deployment, transaction,
  finality, receipt/evidence, or submission action remains human-authorized.

## Scope

Create one headless ToolLoopAgent discovery boundary in a new standalone agent
workspace. It calls a caller-supplied `/api/tools` URL through an injected
one-shot GET fetcher, strictly validates exactly one RiskScan Quick descriptor,
and returns a safe cloned selection or a fail-closed local outcome.

The agent does not submit a RiskScan request, parse or create a payment header,
sign, access an account, wallet, key, environment, x402 client, facilitator,
backend, durable store, clock, retry loop, external directory registration,
deployment, or live proof. A selected locally-configured summary is not a
claim of payment capability or external availability.

The local contract is [M05 ToolLoopAgent RiskScan discovery](../../../specs/m05-tool-loop-agent-discovery.md); its executable steps are in the [M05 ToolLoopAgent discovery plan](../../../superpowers/plans/2026-09-05-m05-tool-loop-agent-discovery.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED
  tests or implementation.
- M05-T010, M02-T050, and M02-T060 remain accepted locally, their integration
  evidence is recorded, and no active lane owns the five reserved agent paths
  or the root lockfile integration reservation.
- The card records CORE_P0 priority, exact one-shot discovery behavior, strict
  directory and safe-cloning boundary, human boundary, and concrete validation
  commands.
- The delivery excludes a CLI, daemon, request-builder or POST, payment
  challenge parsing, payment/signing/wallet/account path, x402 client,
  backend/persistence/UI change, runtime configuration, external registration,
  deployment, transaction/finality/receipt/evidence/result material, and live
  claims.

## Validation

- RED/GREEN agent tests cover exact injected GET construction, valid safe
  selection, malformed/unavailable directory outcomes, exact metadata/payment
  validation, no leakage, no extra fetch, and response-object isolation.
- An agent boundary test rejects outbound POST/body/payment-or-authorization
  header construction, forbidden imports/access, wallet/account/environment/
  backend, timer/retry, and hidden side-effect paths while permitting the safe
  static descriptor metadata it validates.
- `npm run typecheck --workspace @tool402/agent`
- `npm run test --workspace @tool402/agent`
- `npm run lint --workspace @tool402/agent`
- Root clean-install, typecheck/test/lint, production Webpack build,
  queue/reference checks, real local HTTP agent exercise, independent task
  review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T19:04:10Z after a fresh post-directory critical-path
rescan confirmed M05-T010, M02-T050, and M02-T060—including their integration
evidence—are accepted; no active lane owns the new agent boundary or root
lockfile reservation; and no human action blocks local discovery code or
controlled tests. This inbox card authorizes neither RED/code nor a live
endpoint, payment, signing, wallet/account action, deployment, transaction
verification, finality, evidence, result, or any live claim.
