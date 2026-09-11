# S32-T010 — Static shell truth-contract correction

## State

- Tier: POLISH
- Queue state: 60-done
- Dependencies: M02-T020 and S31-T010 accepted.
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The sole candidate implementation path is
  `apps/web/tests/static-shell.test.mjs`.
- Human actions: none. This test-only correction creates no product, wallet,
  payment, provider, configuration, transaction, deployment, or live action.

## Scope

The full Web suite has one reproducible failure in the static-shell test. The
accepted S31 shell intentionally renders the local internal route
`/provider/deploy`, but the old combined-layout deny-list rejects the words
`provider` and `deploy` without distinguishing static local copy from runtime
capability. The repository already proves the resulting UI and route are
intentional, static, and truthful.

This card changes only the stale test contract: retain all existing static
shell/home assertions, positively assert the exact internal provider-deploy
CTA, and preserve the no-runtime deny-list for wallet, payment, credential,
auth, onboarding, analytics, evidence, and metric vocabulary. It never changes
app source or product behaviour.

The [UI-S32 manifest](../../../ui/UI-S32.md) is the complete local boundary.

## Candidate ready requirements

- This card, UI-S32, the ledger, catalog, ownership, state, and decision record
  are committed before the test changes.
- Independent readiness confirms M02-T020/S31-T010 accepted, the one exact
  test path has no active collision, and the full Web runner reproduces only
  the documented stale lexical assertion failure.
- No source path is reserved. The existing layout/page files are verification
  inputs only.

## Verification

- Run the repository Web test script under Node 22.21.1 before the correction
  and record the single expected stale lexical failure.
- After an independent readiness/activation decision, amend only the declared
  test contract and run the full Web suite, queue validation, and whitespace
  check.
- Independent exact-diff review verifies the assertion remains a static
  no-runtime boundary and that no source, route, or capability changed.

## Boundary

This is a test-contract repair for already accepted static source. It does not
authorize a RED/GREEN product implementation, source change, visual change,
or any live behaviour.

## Readiness acceptance

Independent readiness review at `8256d62` is clear. M02-T020 and S31-T010 are
accepted; S31's former compact-strip test correction is closed; S26 only names
this file as a future inbox candidate and has no active reservation. The
repository Web script under Node 22.21.1 reproduces exactly one failure at
`static-shell.test.mjs:69`, the stale lexical deny-list, with 297/298 passing
and no unrelated failure. This card may enter `10-ready`; a separate explicit
activation must still reserve only the declared assertion correction.

## Activation

Independent activation review at `106c61a` is clear. S32-T010 is `20-active`
only to amend `apps/web/tests/static-shell.test.mjs`. The correction must retain
every existing static shell/home assertion, add exact checks for the internal
`/provider/deploy` href and `Prepare a tool` label, and remove only `provider`
and `deploy` from the no-runtime vocabulary deny-list. It must retain
`wallet`, `payment`, `credential`, `auth`, `onboarding`, `analytics`,
`evidence`, and `metric`. No app source or other test path is authorized.

## Acceptance

Independent final review accepts `5ab83af`. The exact activation-head diff
changes only `apps/web/tests/static-shell.test.mjs` (three insertions, one
deletion): it adds the exact local href and CTA label checks, removes only
`provider|deploy` from the deny-list, and retains every static/no-runtime
constraint. The Node 22.21.1 Web suite passes 298/298; queue and whitespace
checks are clear. S32 returns to `60-done` and grants no further test or source
reservation.
