# S32-T010 readiness review

## Scope reviewed

- Control head: `8256d62`
- Candidate test path: `apps/web/tests/static-shell.test.mjs`
- Verification inputs only: `apps/web/src/app/layout.tsx` and
  `apps/web/src/app/page.tsx`

## Findings

- M02-T020 and S31-T010 are accepted. S31's limited compact-strip correction
  is closed at `20125ac`.
- UI-S32, the card, ledger, catalog, state, ownership, and
  D-S32-010-001 consistently constrain S32 to the one existing test file.
- S26 lists `static-shell.test.mjs` only as a future `00-inbox` candidate, so
  there is no active ownership collision.
- The proper Node 22.21.1 Web runner reports exactly one failure:
  `static-shell.test.mjs:69` rejects the accepted static internal
  `/provider/deploy` link through a broad vocabulary deny-list. The remaining
  297 of 298 tests pass, and queue validation is clear.
- The rendered `Prepare a tool` CTA is static internal route copy. It does not
  provide wallet, payment, provider runtime, or live functionality.

## Verdict

**CLEAR.** S32-T010 may move to `10-ready`. A later activation may reserve only
the existing assertion: retain the shell checks, assert the exact
`/provider/deploy` CTA and its `Prepare a tool` label, remove only `provider`
and `deploy` from the deny-list, and retain rejection of `wallet`, `payment`,
`credential`, `auth`, `onboarding`, `analytics`, `evidence`, and `metric`.
No app source path is eligible.
