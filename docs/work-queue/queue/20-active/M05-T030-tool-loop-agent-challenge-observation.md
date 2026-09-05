# M05-T030 — ToolLoopAgent RiskScan challenge observation

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M05-T010 accepted; M05-T020 accepted; M02-T050 accepted;
  M02-T060 accepted
- Integration evidence: D-M05-010-002, D-M05-020-002, D-M02-050-002, and
  D-M02-060-002 accepted
- Owner: the proposed implementation scope is
  `apps/agent/src/riskscan-tool-challenge.ts`,
  `apps/agent/test/riskscan-tool-challenge.test.mjs`, and
  `apps/agent/test/riskscan-tool-challenge-boundary.test.mjs`. The root owns
  this card, its local specification and plan, queue state, catalog, file
  ownership, decisions, reviews, integration evidence, and pushes.
- Human actions: none for local unsigned request code and controlled tests. A
  configured route, payment handling, signing, wallet/account action,
  deployment, transaction, finality, receipt/evidence, result release, and
  submission remain human-authorized.

## Scope

Create one headless Consumer Agent challenge-observation boundary. It consumes
the accepted discovery union through an exact outer-shell snapshot, validates
and clones a caller input, and sends one fixed unsigned request only for a
selected tool. It observes bounded availability or challenge outcomes without
exposing or decoding payment material or reading a successful response body.

The agent does not derive a route or protocol from the descriptor, submit a
payment header or payload, sign, access a wallet, account, key, environment,
x402 client, facilitator, backend, durable store, clock, timer, retry loop,
CLI, external registration, result, receipt, evidence, deployment, or live
proof. A `payment_required` observation is not a payment, settlement,
verification, finality, result, or availability claim.

The local contract is [M05 ToolLoopAgent RiskScan challenge observation](../../../specs/m05-tool-loop-agent-challenge-observation.md); its executable steps are in the [M05 ToolLoopAgent challenge observation plan](../../../superpowers/plans/2026-09-05-m05-tool-loop-agent-challenge-observation.md).

## Candidate ready requirements

- The local specification and implementation plan are committed before RED
  tests or implementation.
- M05-T010, M05-T020, M02-T050, and M02-T060 remain accepted locally, their
  integration evidence is recorded, and no active lane owns the three reserved
  agent paths.
- The card records CORE_P0 priority, selection propagation, exact unsigned
  POST behavior, descriptor-safe selection/input/target validation,
  status-only challenge observation, human boundary, and concrete validation
  commands.
- The delivery excludes payment material, signing, wallet/account,
  x402/facilitator/backend/environment access, result release, persistence,
  deployment, transaction/finality/receipt/evidence work, and live claims.

## Validation

- RED/GREEN agent tests cover selection propagation and hostile outer-shell
  rejection, strict local input snapshots, exact one-shot unsigned POST
  construction, base/target rejection, fresh-init isolation, status mappings,
  nonblank challenge presence, no body read, no extra calls, and no output
  leakage.
- A dedicated challenge boundary test rejects forbidden payment,
  authorization, x402, wallet/account/environment/backend, timer/retry,
  dynamic-import, CLI, response-body, result, and hidden-side-effect paths.
- `npm run typecheck --workspace @tool402/agent`
- `npm run test --workspace @tool402/agent`
- `npm run lint --workspace @tool402/agent`
- Root clean-install, typecheck/test/lint, production Webpack build,
  queue/reference checks, real local discovery-plus-challenge exercise,
  independent task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-05T20:24:28Z after a fresh post-M05-T020 rescan confirmed
that all four dependencies and their integration evidence are accepted; no
active lane owns the three new agent paths; no human action blocks local
unsigned request code or controlled tests; and the next critical path should
not return to M04 persistence or reconciliation. This inbox card authorizes
neither RED/code nor a configured route, payment, signing, wallet/account
action, deployment, transaction verification, finality, evidence, result, or
live claim.

## Ready transition

Ready at 2026-09-05T20:37:46Z after the root revalidated the accepted
M05-T010, M05-T020, M02-T050, and M02-T060 dependencies and their integration
evidence; the pushed `49e78c00a1d8759736ecee570ee64abd9d2c95a2` local
specification and plan; disjoint three-path agent ownership; no active lane;
no pending human action; concrete validation commands; queue validation; and
the independent design review plus its scoped re-review. The card remains
unsigned challenge observation only: no configured route assertion, payment,
signing, wallet/account action, deployment, transaction verification,
finality, evidence, result, or external claim is authorized.

## Activation

Activated at 2026-09-05T20:39:30Z after a fresh queue rescan confirmed the
pushed ready state, accepted dependencies, no active lane, no human blocker,
and the same disjoint three-path agent ownership. The task starts with its
ToolLoopAgent RED contract. No configured route assertion, payment, signing,
wallet/account action, deployment, transaction verification, finality,
evidence, result, or external claim is authorized.
