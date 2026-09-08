# B03-T010 — RiskScan Agent payment client

## State

- Tier: CORE_P0
- Queue state: 50-blocked
- Dependencies: M05-T020 accepted; M05-T030 accepted; M06-T010 accepted; M12-T020 accepted; B02-T010 accepted
- Owner: The root owns this card, `docs/specs/b03-riskscan-agent-payment-client.md`,
  queue state, catalog, ownership, decisions, reviews, commits, and pushes.
  Proposed implementation paths are only
  `apps/agent/src/riskscan-tool-payment.ts`,
  `apps/agent/src/riskscan-pay-cli.ts`,
  `apps/agent/test/riskscan-tool-payment.test.mjs`,
  `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`,
  `apps/agent/package.json`, and the root `package-lock.json`.
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
- The contract fixes the construction boundary, injected signer, two injected
  request seams, frozen three-field B03 policy snapshot, closed outcome union,
  policy gate before client construction or signing, exact challenge-to-quote
  equality, and two client requirements before any code.
- The Agent manifest owns the `./riskscan-tool-payment` public export, the
  `riskscan:pay` script, and direct `@x402/core@2.25.0` and
  `@x402/hedera@2.25.0` dependencies. The lockfile records exactly that local
  dependency change.

## Verification

- Durable RED files at
  `apps/agent/test/riskscan-tool-payment.test.mjs` and
  `apps/agent/test/riskscan-tool-payment-boundary.test.mjs` precede every
  source, manifest, lockfile, and public-export change. They fail only because
  the declared payment module and CLI do not yet exist.
- Focused tests prove every outcome in the closed union; malformed dependency
  construction and malformed input cause no request/client/signer access; a
  declined quote performs one Directory GET and no client construction,
  payload creation, signer-method invocation, or retry; and a mismatched
  challenge cannot sign. They also prove B03 calls one Directory selection plus
  the pure Core quote evaluator rather than the M12 wrapper or M05 flow.
  They also prove the accepted M05 observe-only source and tests remain byte
  unchanged.
- Boundary tests prove the library has no environment, credential, filesystem,
  console, child-process, dynamic-import, persistence, default-fetch, or
  fallback-signer access. The CLI is the only environment/key edge. A thrown
  signer or SDK sentinel cannot enter an outcome, stdout, or stderr.
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

## Activation

Activated at 2026-09-08T14:01:24Z after a fresh root rescan at pushed
`e2c3b3beefb637a9c06074ab90837c4658249cb4`. Every declared dependency remains
accepted, the shared branch is clean and current, the local guard is enabled,
and S12-T010 owns only disjoint Web paths. This activation authorizes only the
two declared durable RED files; no source, manifest, lockfile, live exercise,
or external action is authorized until the RED review is accepted.

## Durable RED acceptance

At `2026-09-08T14:36:34Z`, two independent reviews accepted the two declared
RED contracts. Under Node 22.21.1 they fail only because
`apps/agent/src/riskscan-tool-payment.ts` and
`apps/agent/src/riskscan-pay-cli.ts` do not yet exist; dependent behavioral
contracts skip until those exact paths exist. The tests introduce no source,
manifest, lockfile, credential, payment, or external behavior.

The root may now authorize only the declared B03 GREEN paths after recording
this acceptance. The human-owned live exercise and every external action
remain out of scope.

## Local GREEN completion

At 2026-09-08T15:11:40Z, the exact Agent module, CLI, manifest, lockfile, and
two declared tests reached local GREEN. The Agent's 70 tests, Agent typecheck
and lint, and root typecheck, test, and lint pass under Node 22.21.1. An
independent review found and the root corrected a terminal-trace boundary:
control characters and Unicode line separators in a remote settlement reference
now fail closed before any CLI output. The independent re-review is clear.

No payment, signer, wallet, provider, account, transaction, deployment, or
other external action occurred during this work.

## Blocker

The card stays in 50-blocked until HA-B03-AGENT-PAYMENT-001 is explicitly
authorized and supplies redacted testnet evidence for one real Agent payment
exercise. Local GREEN does not substitute for that human-owned exercise.
