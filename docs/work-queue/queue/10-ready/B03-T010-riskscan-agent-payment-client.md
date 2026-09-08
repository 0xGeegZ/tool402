# B03-T010 — RiskScan Agent payment client

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M05-T020 accepted; M05-T030 accepted; M06-T010 accepted; M12-T020 accepted; B02-T010 accepted
- Owner: The root owns this card, `docs/specs/b03-riskscan-agent-payment-client.md`,
  queue state, catalog, ownership, decisions, reviews, commits, and pushes.
  Proposed implementation paths are only
  `apps/agent/src/riskscan-tool-payment.ts`,
  `apps/agent/src/riskscan-pay-cli.mts`,
  `apps/agent/tests/riskscan-tool-payment.test.mjs`,
  and the Agent workspace manifest for its script and the two x402 client
  dependencies.
- Human actions: HA-X402-HEDERA-001 is accepted bounded evidence for one prior
  paid request and does not by itself authorize the live exercise. The live
  exercise, the payer account and its key, the recipient and facilitator
  choice, deployment, the video, and submission remain human-only.

## Scope

Add the one step that makes the judged criterion true of this repository: an
Agent that discovers the tool, checks the price against its own budget policy,
signs the challenge, retries, and reports the settlement.

The local contract is the [B03 Agent payment client contract](../../../specs/b03-riskscan-agent-payment-client.md).

This card adds no browser payment client, no wallet or provider integration, no
durable storage, no read surface, no receipt or evidence binding, and no key
material. It amends no accepted contract.

## Why this card exists now

`D-HI-001-003` records that the queue had drifted onto the forfeited
tokenization track while `STATE.md` reported no eligible implementation card.
This is the first card on the recorded critical path to submission.

The gap is exactly one step wide. Directory discovery, native quote evaluation,
and challenge receipt were each exercised against a live configured route and
work. Only signing and retry are missing.

## Candidate ready requirements

- The local contract, card, catalog, ownership, decision, and state records are
  committed before a RED test or source change.
- M05-T020, M05-T030, M06-T010, M12-T020, and B02-T010 remain accepted.
- The declared Agent paths are disjoint from every active card. S12-T010 owns
  only Web boundary routes and assets, so the two may run in parallel.
- The contract fixes the injected signer, the closed outcome union, the
  policy gate before signing, and the two client requirements before any code.

## Verification

- A durable RED test file precedes the source change and fails for the stated
  reason: the payment module does not exist.
- Focused tests prove every outcome in the closed union, that a declined quote
  never signs, that the module cannot be constructed without a signer, and that
  the accepted M05 observe-only module is unchanged.
- Source-boundary checks prove no environment read, credential read, key or
  header logging, or persistence inside the module.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass.
- Independent task review and a fresh module-review generation report no
  Critical, Important, or Minor finding.
- One human-authorized live exercise, corroborated on the public mirror node,
  recorded as evidence with no secret material.

## Boundary

This card creates a local payment capability. It creates no account, funds
nothing, holds no key, and claims no deployment, receipt, finality, evidence
record, or submission. The live exercise is a separate human-authorized action
and its result is recorded as bounded evidence, not as a product claim.
