# M07-T010 — ToolLoopAgent RiskScan discovery-to-challenge flow

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M05-T010 accepted; M05-T020 accepted; M05-T030 accepted;
  M06-T010 accepted
- Integration evidence: D-M05-010-002, D-M05-020-002, D-M05-030-002, and
  D-M06-010-002 accepted
- Owner: the proposed implementation scope is
  `apps/agent/src/riskscan-tool-flow.ts`,
  `apps/agent/test/riskscan-tool-flow.test.mjs`, and
  `apps/agent/test/riskscan-tool-flow-boundary.test.mjs`. The root owns this
  card, its local specification and plan, queue state, catalog, file
  ownership, decisions, reviews, integration evidence, and pushes.
- Human actions: none for the local composition and controlled tests.
  HA-X402-HEDERA-001 is a later human-only prerequisite for a real payment
  client or live proof; while PENDING it authorizes neither and does not block
  this unsigned flow.

## Scope

Create one headless Consumer Agent flow that composes the accepted local
RiskScan directory discovery and unsigned challenge observers. Given an
explicit service base, unknown caller input, and separately injectable
directory/challenge senders, it returns only the bounded terminal outcome from
the challenge observer. A valid controlled native directory followed by an
unsigned `402` must become `payment_required` without exposing payment
material.

The flow does not inspect tool fields, derive any route or protocol from a
descriptor, decode or expose a payment header or payload, create a payment
client, sign, access a wallet, account, key, environment, x402 client,
facilitator, backend, durable store, clock, timer, retry loop, CLI, result,
receipt, evidence, deployment, or live service. A `payment_required` outcome
is not a payment, settlement, verification, finality, result, availability,
or live claim.

The local contract is [M07 ToolLoopAgent RiskScan discovery-to-challenge
flow](../../../specs/m07-tool-loop-agent-flow.md); its executable steps are in
the [M07 ToolLoopAgent flow plan](../../../superpowers/plans/2026-09-06-m07-tool-loop-agent-flow.md).

## Candidate ready requirements

- The local M07 specification and implementation plan are committed before
  RED tests or implementation.
- M05-T010, M05-T020, M05-T030, and M06-T010 remain accepted locally with
  their listed integration evidence, and no active lane owns the three
  reserved Agent paths.
- The card records CORE_P0 priority, exact discovery-to-challenge composition,
  strict no-I/O failure propagation, controlled native `402` behavior, human
  boundary, and concrete validation commands.
- The delivery excludes any payment-header/payload handling, client signer,
  wallet/account/key action, runtime configuration, x402/facilitator/backend
  access, result release, persistence, deployment, transaction/finality,
  receipt/evidence work, and live claims.

## Validation

- RED/GREEN Agent tests cover exact GET-then-POST sequencing, two accepted
  discovery failures with no POST, exact outcome propagation, malformed input,
  transport/unavailable/unexpected mappings, controlled native directory plus
  unsigned `402`, sender isolation, and no output leakage.
- A dedicated flow boundary test rejects x402/payment/header parsing or
  construction, wallet/account/signer/environment/backend access, retry,
  timer, CLI, response-body/result handling, and hidden side effects. It
  permits only composition of the two accepted Agent boundaries.
- `npm run typecheck --workspace @tool402/agent`
- `npm run test --workspace @tool402/agent`
- `npm run lint --workspace @tool402/agent`
- Root clean-install, typecheck/test/lint, production Webpack build,
  queue/reference checks, controlled local flow exercise, independent task
  review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-06T06:56:06Z after a fresh post-M06 rescan confirmed all
four dependencies and their integration evidence are accepted; no active lane
owns the new Agent flow paths; and the next CORE_P0 slice should demonstrate
the local discovery-to-challenge journey rather than reopen generic M04
persistence or reconciliation. This inbox card authorizes neither RED/code
nor a configured live route, payment, signing, wallet/account action,
transaction, deployment, evidence, result, or live claim.

## Design review

An independent read-only review corrected the pending human-action record so
it explicitly authorizes no external action and unblocks no later payment or
live-proof card. The scoped re-review found no remaining Critical, Important,
or Minor issue and approved the card for its normal ready transition. No code
or runtime claim was reviewed or created at this stage.

## Ready transition

Ready at 2026-09-06T07:04:04Z after a fresh rescan confirmed the pushed
`83a22088d9ff0899d527a5c9c837a473a3c2a822` inbox card, local specification,
and implementation plan; all four accepted dependencies and their listed
integration evidence; disjoint three-path Agent ownership; no active lane;
concrete validation; and the independent design-review/re-review sequence.
HA-X402-HEDERA-001 remains PENDING and grants no authority, but it does not
block this local unsigned composition. The card is ready only for its Agent
RED contract; it does not authorize a configured live route, payment, signing,
wallet/account action, transaction, deployment, evidence, result, or live
claim.
