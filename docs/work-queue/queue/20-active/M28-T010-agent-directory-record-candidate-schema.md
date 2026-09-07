# M28-T010 — Closed Directory-Record Candidate Schema

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T020 accepted; M10-T010 accepted; M16-T010, M17-T010,
  M18-T010, M19-T010, and M21-T010 accepted as source-sequencing context
- Owner: This is a root-owned authority record. The proposed implementation
  paths are one new Core parser, focused runtime/type tests, and an explicit
  Core public-barrel amendment only. The root owns this card, local
  specification, import record, plan, queue state, catalog, ownership,
  decisions, reviews, integration evidence, commits, and pushes.
- Human actions: none for the deterministic local candidate parser. A signed
  publication, command authority, x402 requirement, provider, ATS, payment,
  account, transaction, settlement, evidence, or deployment boundary remains
  separately authorized.

## Scope

Create the smallest pure Core parser for one untrusted advertised Directory
record. It accepts only the closed version-one candidate schema in the local
contract, captures descriptor values before validation, and returns fresh
frozen data.

The local contract is the [M28 Directory-record candidate schema](../../../specs/m28-agent-directory-record-candidate-schema.md), the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), and execution is in the [M28 Directory-record candidate plan](../../../superpowers/plans/2026-09-07-m28-agent-directory-record-candidate-schema.md).

This record's `status: "active"`, `publishedAt`, endpoints, and clearing
account are advertised metadata only. The parser neither verifies nor grants
signature, issuer, publication, availability, service activity, payment, or
external authority. Current Agent Directory source and M20's offering parser
are neither modified nor consumed.

## Candidate ready requirements

- The local contract, neutral import-ledger row, plan, card, catalog,
  ownership, decision, and state records are committed before a RED test or
  source change.
- M01-T020, M10-T010, and the listed source-sequencing dependencies remain
  accepted locally. M10 is the only direct runtime parser dependency; M16
  through M19 and M21 establish the accepted upstream vocabulary only.
- The only proposed implementation paths are the new Core parser, focused
  runtime/type tests, and the explicit Core public-barrel amendment. No
  existing Core module, Agent directory, backend, Convex, Web/UI, package, or
  lockfile path is owned.
- The contract fixes every field grammar, array cardinality/order, account
  input bound, raw-fragment URL policy, date rule, and safe integer rule before
  code. No validation default is implicit.
- An independent review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED contract precedes source and proves the absent public parser,
  exact record/array shapes, closed advertised literals, URL and canonical
  account rules, frozen detachment, descriptor safety, and no prohibited
  boundary expansion.
- The focused command is `node --test
  packages/core/test/agent-directory-record-candidate.test.mjs` from the
  repository root under Node 22.21.1.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations must pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T12:50:45Z after a fresh source-to-runtime rescan found
this independent metadata slice. This inbox state authorizes only committed
local authority and independent design review. It authorizes neither RED/code
nor receipt-candidate parsing, invariant generators, existing Agent Directory
integration, command parsing, signature verification, signer/principal/role
authority, publication, storage, replay/idempotency, generic attempts,
configuration, Convex, HTTP, provider/ATS behavior, wallet, payment, funding,
transaction, settlement, clearing, HCS, payout, deployment, or live behavior.

## Design review

The first independent authority review at `84290327d45d0273299eafec2478a76b44030a66`
found two Important contract gaps before any RED: M10 accepts arbitrarily long
canonical account text, and a raw empty URL fragment delimiter survives with
an empty `URL.hash`. The amended local authority therefore fixes a 96-code-unit
pre-M10 account bound and rejects every raw `#` delimiter before URL
canonicalization. Both account fields and both URL fields require exact
boundary regressions. A fresh independent re-review remains required before
M28 may enter 10-ready.

## Ready transition

Ready at 2026-09-07T13:07:54Z after a fresh root rescan at
`b0a22b3575a7ff6f1840e822b1451f89586daf8e` confirmed all declared
dependencies accepted, no active lane or conflicting owned path, resolvable
committed authority, an enabled local guard, and no human blocker for this
deterministic local parser. The fresh independent re-review was clean after
the exact account-bound and raw-fragment corrections.

This ready state authorizes only root activation followed by the specified
test-only RED and minimal pure Core candidate parser. It does not authorize
receipt-candidate parsing, invariant generators, Agent integration, signing,
publication, command/authentication, principal/role lookup, storage, replay
or idempotency behavior, generic attempts, configuration, Convex, HTTP,
provider/ATS behavior, wallet, payment, funding, transaction, settlement,
clearing, HCS, payout, deployment, or live behavior.

## Activation

Activated at 2026-09-07T13:11:28Z after a fresh post-ready rescan at
`365a2acb317fd990de402efc94f4e0beeced32f7` confirmed M28-T010 as the sole
ready card, every declared dependency accepted, no active ownership conflict,
resolvable committed authority, an enabled local guard, and no human blocker
for deterministic local work. This activation authorizes only the specified
test-only RED and minimal pure Core candidate parser.
