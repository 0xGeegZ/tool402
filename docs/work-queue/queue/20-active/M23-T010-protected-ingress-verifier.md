# M23-T010 — Protected ingress verifier

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T030 accepted; M22-T010 accepted
- Owner: `packages/backend/src/ingress/protected-ingress-verifier.ts` and
  `packages/backend/tests/protected-ingress-verifier.test.mjs` are proposed
  implementation paths. The root owns this card, the local specification,
  import record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, commits, and pushes.
- Human actions: none for this pure local verifier. Bounded paid-request
  evidence neither grants nor blocks it, and grants no HMAC key provisioning,
  configuration, wallet, signer, transaction, ATS, funding, allocation,
  clearing, HCS, payout, deployment, or live authority.

## Scope

Create the smallest internal backend verifier after the accepted M22 envelope.
It binds exact raw bytes to the envelope's claimed digest, accepts only an
injected usable HMAC verification key, verifies the canonical signing input,
applies an inclusive bounded timestamp check, and returns a minimal frozen
same-process capability.

The local contract is [M23 protected ingress verifier](../../../specs/m23-protected-ingress-verifier.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M23 protected ingress verifier plan](../../../superpowers/plans/2026-09-07-m23-protected-ingress-verifier.md).

This is the smallest missing protected-ingress predecessor on the ATS/funding
critical path. It deliberately does not treat an earlier RiskScan-specific
card as a generic schema or durable-attempt substitute. Replay claiming,
closed command handling, durable generic attempts, ATS configuration,
compliance, and all financial or external behavior remain separately scoped.

## Candidate ready requirements

- The local contract, neutral import-ledger row, plan, card, catalog, ownership,
  decision, and state records are committed before a RED test or code change.
- M01-T030 and M22-T010 remain accepted locally. M22 supplies the closed
  envelope and canonical signing input; this card supplies no HTTP route,
  schema, persistence, command, configuration, or key source.
- The only proposed production/test paths are internal backend paths, disjoint
  from existing Core, RiskScan persistence, Agent, Web/UI, and public backend
  entry-point ownership.
- The verifier's exact order is raw bytes, closed-envelope parse, raw-body
  digest, injected key resolution, native HMAC verification, bounded skew, and
  a frozen verified capability. It never parses a command or claims replay.
- The delivery uses injected test-only key material only and has no secret
  fixture, environment read, configuration source, Convex function, generated
  output, database/storage, wallet, signer, SDK call, network, or live action.
- An independent review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A durable test-only RED contract exercises one public fixed vector and rejects
  altered bytes before resolver use, unknown/unusable keys, malformed values,
  non-`bigint` or negative clocks, invalid MACs, and timestamps outside the
  inclusive sixty-second boundary. It also proves frozen minimal capability
  membership, exact accepted clock retention, and structural-lookalike
  rejection. The negative-clock vector has timestamp zero and `-1n` current
  time, so its one-second mathematical skew cannot mask a missing clock guard.
- The direct focused command is
  `node --test packages/backend/tests/protected-ingress-verifier.test.mjs` from
  the repository root under Node 22.21.1.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations must pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T07:16:20Z after a source-to-runtime critical-path
rescan confirmed that the requested ATS boundary remains blocked on a durable
protected attempt chain. The accepted M22 closed envelope is the immediate
local input; M23 is the smallest isolated cryptographic predecessor. This
inbox state authorizes only committed local authority and independent design
review. It authorizes neither RED/code nor replay persistence, command
handling, generic attempts, ATS, payment, funding, allocation, clearing, HCS,
account, wallet, signer, transaction, deployment, or live behavior.

## Design review

Two independent reviews of the final committed authority at
`5d1e0bfa797d99d0e1b2259e125fd2036faae1d7` are clean.

- Standards review confirmed accepted dependencies, root-only queue ownership,
  resolvable local references, enabled local boundary, disjoint paths, and no
  secret or prohibited provenance reference.
- Security/specification review independently verified both public native Web
  Crypto vectors through M22, the discriminating negative-clock case, exact
  capability clock retention, HMAC-before-skew test evidence, and all protected
  ingress/replay/command/attempt/ATS exclusions.

No Critical, Important, or Minor finding remains.

## Ready transition

Ready at 2026-09-07T07:37:44Z after a fresh post-review rescan confirmed the
accepted M01-T030 and M22-T010 dependencies, resolvable committed authority,
disjoint internal backend paths, no active ownership conflict, enabled local
guard, concrete direct RED/GREEN validation, and no human blocker for this
pure local scope. This ready state authorizes only the bounded test-only RED
then minimal internal GREEN verifier after root activation; it does not
authorize replay storage, command handling, generic attempts, ATS,
configuration, payment, funding, allocation, clearing, HCS, account, wallet,
signer, transaction, deployment, or live behavior.

## Activation

Activated at 2026-09-07T07:40:00Z after a fresh post-ready rescan confirmed
M23-T010 is the sole ready card, M01-T030 and M22-T010 remain accepted, no
active card owns the bounded internal backend paths, committed authority is
resolvable, the local guard is enabled, and the current human-action record
neither grants external authority nor blocks deterministic local work. This
activation authorizes only the specified test-only RED then minimal internal
GREEN verifier and verification; it does not expand authority to replay
storage, command handling, generic attempts, ATS, configuration, payment,
funding, allocation, clearing, HCS, account, wallet, signer, transaction,
deployment, or live behavior.
