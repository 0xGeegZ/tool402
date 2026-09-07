# M21-T010 — Clearing-split lifecycle

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M19-T010 accepted
- Owner: `packages/core/src/clearing-split-lifecycle.ts`,
  `packages/core/test/clearing-split-lifecycle.test.mjs`, and
  `packages/core/test/clearing-split-lifecycle.types.ts` are proposed
  implementation paths. One narrow non-barrel provenance-handoff amendment to
  `packages/core/src/paid-task-lifecycle.ts` is reserved only if required to
  reject forged public lookalikes. The root reserves the public-barrel
  amendment in `packages/core/src/index.ts` and owns this card, local
  specification/import record, plan, queue state, catalog, ownership,
  decisions, reviews, integration evidence, and pushes.
- Human actions: none for this pure local lifecycle. Existing bounded
  paid-request evidence neither grants nor blocks it, and grants no ATS,
  funding, allocation, account, asset, wallet, signer, transaction,
  settlement, clearing, HCS, payout, deployment, or live authority.

## Scope

Create the smallest immutable Core workflow that can represent a clearing
split only after the exact issued M19 `result_valid` state. It snapshots task
correlation and permits only required, submitted, outcome-unknown, and
locally-confirmed transitions, with a constrained return from ambiguity after
an explicit non-execution event.

The local contract is [M21 clearing-split lifecycle](../../../specs/m21-clearing-split-lifecycle.md), the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), and execution is in the [M21 clearing-split lifecycle plan](../../../superpowers/plans/2026-09-07-m21-clearing-split-lifecycle.md).

M19-T010 is the sole functional dependency because it owns the accepted
issued `result_valid` provenance boundary. M16-T010 economics and M20-T010
offering ingress are sequencing context only; this card deliberately has no
money, terms, allocation, maturity, or offering-definition input. A broad
closed-boundary schema and generic durable external-attempt model remain
separate missing prerequisites before an ATS boundary can be truthful.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before a RED test or code change.
- M19-T010 remains accepted locally. The authority specifies the exact
  `result_valid` capability handoff rather than structurally trusting a public
  state shape; rejected starts must preserve a valid source and successful
  starts must consume it once.
- The public surface is closed: one snapshot, four state variants, four
  exact ordinary event variants, one start function, and one transition
  function. The narrow M19 helper, if used, remains outside the public barrel.
- Legal transitions, source/state consumption, recovery from unknown,
  descriptor-safe event policy, tier, human boundary, and concrete direct
  validation commands are recorded.
- No active card owns the proposed Core paths. The public-barrel amendment is
  a root integration reservation; accepted M19 behavior remains otherwise
  unmodified.
- The delivery excludes amount/allocation calculations, protocol parsing,
  persistence, generic attempts/idempotency records, ATS SDK/configuration,
  accounts, assets, recipients, wallets, signers, keys, funding/payment/
  transfer activity, transaction/settlement/receipt/finality/non-execution
  verification, clearing, HCS, payout, deployment, and live claims.
- An independent review of the committed local contract and plan is clean: no
  Critical, Important, or Minor finding remains.

## Validation

- RED/GREEN tests prove exact frozen snapshots, issued-result-only start,
  rejected-source preservation, successful source consumption, every legal
  edge, skipped/duplicate/terminal rejection, unknown-outcome retry blocking,
  explicit non-execution return, structural-copy/proxy rejection, exact event
  shape, and zero accessor invocation. The focused command is
  `node --test packages/core/test/clearing-split-lifecycle.test.mjs` from the
  repository root.
- A public compile-time fixture proves the lifecycle retains the accepted
  `RequirementsDigest` brand and rejects absent money/event fields.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T01:35:10Z after a fresh source-to-runtime critical-path
rescan confirmed that M19-T010 supplies the smallest functional predecessor
for a pure clearing-split lifecycle. The generic durable external-attempt
path remains blocked by missing protected ingress and replay prerequisites;
the broader schema boundary still needs this lifecycle; ATS remains
non-eligible. This card authorizes only the committed local contract, plan,
and independent design review. It authorizes neither RED/code nor ATS,
payment, funding, allocation, clearing, HCS, account, wallet, signer,
transaction, deployment, or live action.

## Design review

Two independent reviews of committed authority `8eb70e6` completed clean at
2026-09-07T01:43:00Z. The Standards review found preserved root queue
ownership, committed authority before RED/code, resolvable local links, no
foreign-source leakage, and no actionable baseline smell. The Specification
review confirmed the exact issued-result handoff, correlation-only frozen
states, closed recovery transitions, M19 as the sole functional dependency,
and preserved exclusions. No Critical, Important, or Minor finding remains.

## Ready transition

Ready at 2026-09-07T01:43:00Z after a fresh post-review queue rescan confirmed
the accepted M19-T010 dependency, resolvable committed authority, disjoint
proposed Core paths, no active-card conflict, enabled local boundary, concrete
direct validation, and no human blocker for this deterministic local scope.
This ready state authorizes only the bounded RED/GREEN lifecycle after root
activation; it does not authorize ATS, payment, funding, allocation, account,
asset, wallet, signer, transaction, settlement, receipt, persistence,
clearing, HCS, payout, deployment, or live behavior.

## Activation

Activated at 2026-09-07T01:44:19Z after a fresh post-ready rescan confirmed
M21-T010 is the sole ready card, M19-T010 remains accepted, no active-card
conflict owns the bounded Core paths, committed authority remains resolvable,
the local guard is enabled, and the current human-action record neither grants
external authority nor blocks deterministic local work. This activation
authorizes the specified test-only RED then minimal Core GREEN lifecycle and
verification only; it does not expand authority to ATS, payment, funding,
allocation, clearing, HCS, account, wallet, signer, transaction, deployment,
or live behavior.

## Acceptance

Accepted at 2026-09-07T02:09:58Z after final verification against
`MODULE_BASE` `a208c13ddacef9df9055753d4901073650a146a6` and `MODULE_HEAD`
`bf5e71f6b6c967e77fe401b2a05369f775195b56`. The durable test-only RED
commits `dcbadc6`, `20e6b49`, and `561e839` precede the sole source and
public-barrel commit `bf5e71f`. Focused M21 tests passed 6/6; Core tests
passed 81/81; Core and root typecheck, test, lint, clean-install dry run,
queue/reference/whitespace checks, and the enabled local guard passed under
Node 22.21.1. Independent task review and two fresh clean module-review
generations found no Critical, Important, or Minor finding.

This acceptance covers only the pure Core clearing-split lifecycle. It does
not accept allocation, non-execution proof, a generic durable external-attempt
model, broader configuration, ATS, payment, funding, account, asset, wallet,
signer, transaction, settlement, receipt, persistence, clearing, HCS, payout,
deployment, or live behavior.
