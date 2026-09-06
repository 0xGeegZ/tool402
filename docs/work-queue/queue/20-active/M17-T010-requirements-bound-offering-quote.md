# M17-T010 — Canonical requirements quote

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M10-T010 accepted; M16-T010 accepted
- Owner: `packages/core/src/requirements-offering-quote.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/requirements-offering-quote.test.mjs`, and
  `packages/core/test/requirements-offering-quote.types.ts` are proposed
  implementation paths. The root owns this card, local specification/import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, and pushes.
- Human actions: none for this pure local contract. The pending live payment
  action remains separate and does not block intake or a future bounded
  implementation.

## Scope

Create the smallest dependency-correct pure Core contract that binds M16's
exact offering allocation facts to the canonical bytes, SHA-256 digest, and
explicit expiry of untrusted payment requirements. It must make changed or
extended requirements distinguishable before a later state-machine or adapter
can consider them.

The local contract is [M17 canonical requirements quote](../../../specs/m17-requirements-bound-offering-quote.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M17 canonical requirements quote plan](../../../superpowers/plans/2026-09-06-m17-requirements-bound-offering-quote.md).

This card does not parse an external protocol semantically, decide that a
requirement is payable, create an offering, publish an asset, reserve a
purchase, make an allocation, or change any lifecycle state. It produces no
network request, signer, wallet, account, funding/payment/transfer activity,
ATS action, transaction, settlement, receipt, persistence, HCS, deployment, or
live claim.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before any RED test or code change.
- M10-T010 and M16-T010 remain accepted locally; their exact-value and
  allocation boundaries materially satisfy this card's only dependencies.
- No active card owns the proposed Core paths. The proposal remains disjoint
  from accepted RiskScan lifecycle, native quote, backend, Agent, and Web
  paths.
- The contract records full-object canonical drift, runtime-safe SHA-256,
  caller-supplied expiry, strict time comparison, every exact/+1 bound,
  hostile accessor/proxy rejection, immutable output, tier, human boundary,
  and concrete validation commands.
- It uses only platform Web Crypto and relative Core imports. No dependency,
  runtime configuration, or protocol adapter is added.
- A scoped independent design review is clean before the card enters 10-ready.

## Validation

- RED/GREEN tests prove nested key-order stability, the published digest
  vector, full-object drift including an added extension, M16 allocation
  binding, strict expiry comparison, malformed/hostile input rejection, and
  output immutability. The focused command is
  `node --test packages/core/test/requirements-offering-quote.test.mjs` from
  the repository root.
- A public compile-time fixture proves canonical-requirements and digest brands
  remain distinct from exact monetary/unit brands.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T17:56:00Z after a fresh pinned-source baseline check and
source-to-runtime rescan confirmed that accepted M10 exact values and M16
allocation math satisfy the smallest remaining pure prerequisite for a future
funding/ATS boundary. This card authorizes only local contract/plan records and
independent design review; it authorizes neither RED/code nor any payment,
funding, allocation, ATS, account, wallet, signer, transaction, settlement,
receipt, persistence, HCS, deployment, or live action.

## Design review correction

Independent design review found that a public hash taking only a TypeScript
branded string would accept arbitrary JavaScript strings at runtime, and that
the plan did not exercise every stated canonicalization bound or a reflection
failure. The local contract now requires the public hash to canonicalize
untrusted input itself, keeps the branded-string hash helper private, and
requires exact-limit/one-past-limit plus accessor/proxy regressions. A fresh
scoped re-review is required before any ready transition.

## Design re-review

Fresh scoped re-review at 2026-09-06T18:12:07Z confirmed that the amended
public hash canonicalizes untrusted input before its private branded helper and
that the plan now covers each exact/one-past bound plus getter/proxy failures.
It found no remaining contract, dependency, pure-Core, or authority defect. Its
only noted condition is that this card, contract, and plan must be committed
atomically so their links resolve at one repository revision. After that
authority commit, a fresh ready-transition rescan remains required; this result
does not authorize RED/code by itself.

## Ready transition

Ready at 2026-09-06T18:13:38Z after a fresh post-commit rescan confirmed the
accepted M10/M16 dependencies, committed and resolvable local authority,
disjoint proposed Core ownership, clean corrected design re-review, enabled
local boundary, and no human blocker for this deterministic local scope. This
ready state authorizes only the bounded RED/GREEN contract after root
activation; it does not authorize payment, funding, allocation, ATS, account,
wallet, signer, transaction, settlement, receipt, persistence, HCS,
deployment, or live behavior.

## Activation

Activated at 2026-09-06T18:14:47Z after a fresh post-ready rescan confirmed
that M17-T010 is the sole ready card, no active card owns its bounded Core
paths, the accepted M10/M16 dependencies remain present, and the pending human
action grants no external authority but does not block this pure local work.
This activation authorizes the specified Core RED/GREEN implementation and
verification only; it does not expand authority to payment, funding,
allocation, ATS, account, wallet, signer, transaction, settlement, receipt,
persistence, HCS, deployment, or live behavior.
