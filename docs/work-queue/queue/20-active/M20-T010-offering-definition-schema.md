# M20-T010 — Closed offering-definition schema

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M16-T010 accepted
- Owner: `packages/core/src/offering-definition.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/offering-definition.test.mjs`, and
  `packages/core/test/offering-definition.types.ts` are the proposed
  implementation paths. The root owns this card, local specification/import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, and pushes.
- Human actions: none for this pure local parser. The bounded paid-request
  evidence remains separate and grants no ATS, funding, allocation, account,
  asset, wallet, signer, transaction, settlement, clearing, HCS, payout,
  deployment, or live authority.

## Scope

Create the smallest dependency-correct Core parser for one closed offering
definition: a schema version, accepted immutable economics terms, a declared
canonical maturity instant, and an opaque qualifying-resource correlation. It
must detach from untrusted caller records and fail closed on unsupported or
hostile record shapes.

The local contract is [M20 closed offering-definition schema](../../../specs/m20-offering-definition-schema.md), the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), and execution is in the [M20 closed offering-definition schema plan](../../../superpowers/plans/2026-09-07-m20-offering-definition-schema.md).

M16-T010 is the sole functional dependency because it owns the accepted terms
and revenue math consumed by this parser. M17-T010 through M19-T010 are
sequencing context, not parser inputs. This card is only one missing offering
schema slice; a generic durable external-attempt model and further
configuration/identity contracts remain separate prerequisites before an ATS
boundary can be truthful.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before a RED test or code change.
- M16-T010 remains accepted locally. Its `createOfferingTerms` constructor
  materially supplies all exact economics validation; this card owns strict
  untrusted record shape and detached metadata ingestion.
- No active card owns the proposed Core paths. The public-barrel amendment is
  a root integration reservation; accepted M16 behavior remains unmodified.
- The card records the exact root/nested fields, descriptor-safe ordinary
  record policy, string bounds, canonical UTC rule, tier, human boundary, and
  concrete direct validation commands.
- The delivery excludes offering publication/registration, generic attempts,
  persistence, ATS SDK/configuration, accounts, assets, decimal policy,
  approval/restriction behavior, wallets, signers, keys, funding/payment/
  transfer activity, transaction/settlement/receipt handling, clearing, HCS,
  deployment, and live claims.
- An independent review of the committed local contract and plan is clean: no
  Critical, Important, or Minor finding remains.

## Validation

- RED/GREEN tests prove exact valid parsing, frozen detached output, root and
  nested unknown/missing/symbol/nonenumerable/prototype/accessor rejection,
  zero accessor invocation, reflection failures, strict bounds, date
  round-trip validity, and delegation to accepted economics validation. The
  focused command is
  `node --test packages/core/test/offering-definition.test.mjs` from the
  repository root.
- A public compile-time fixture proves the parser returns the documented
  `OfferingDefinition` and retains accepted `OfferingTerms` brands.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T00:35:57Z after a fresh source-to-runtime critical-path
rescan confirmed that accepted M16-T010 supplies the smallest economics input,
while the broad offering schema and generic external-attempt prerequisites for
the later ATS boundary remain incomplete. A scoped read-only design assessment
set the closed four-field surface and hostile-JavaScript safety requirements.
This card authorizes only local contract/plan records and independent design
review; it authorizes neither RED/code nor an ATS, payment, funding,
allocation, clearing, HCS, account, wallet, signer, transaction, deployment,
or live action.

## Design review

An independent review of committed authority `8022ff310b0fd60451f6fc78d9b0e532649fcdb9`
completed clean at 2026-09-07T00:44:08Z. It confirmed M16-T010 as the sole
functional dependency; the exact descriptor-safe shape, bounds, date rule,
and detached output are implementable; generic attempts/configuration and ATS
remain non-eligible; and the plan retains durable test-only RED-before-code
chronology. No Critical, Important, or Minor finding remains. The reviewer
made one non-actionable test-design judgment: keep economic string-bound cases
table-driven across every field.

## Ready transition

Ready at 2026-09-07T00:44:08Z after a fresh post-review queue rescan confirmed
the accepted M16-T010 dependency, resolvable committed local authority,
disjoint proposed Core paths, no active-card conflict, enabled local boundary,
concrete direct validation, and no human blocker for this deterministic local
scope. This ready state authorizes only the bounded RED/GREEN parser contract
after root activation; it does not authorize ATS, payment, funding,
allocation, clearing, HCS, account, wallet, signer, transaction, deployment,
or live behavior.

## Activation

Activated at 2026-09-07T00:46:27Z after a fresh post-ready rescan confirmed
M20-T010 is the sole ready card, M16-T010 remains accepted, no active-card
conflict owns the bounded Core paths, committed authority remains resolvable,
the local guard is enabled, and the current human-action record neither grants
external authority nor blocks deterministic local work. This activation
authorizes the specified test-only RED then minimal Core GREEN parser and
verification only; it does not expand authority to ATS, payment, funding,
allocation, clearing, HCS, account, wallet, signer, transaction, deployment,
or live behavior.
