# S32-T010 activation review

## Control head

`106c61a`

## Findings

- M02-T020 and corrected S31-T010 are `60-done`.
- UI-S32, the card, ledger, catalog, state, ownership, readiness record, and
  D-S32-010-001/002 agree on one candidate path:
  `apps/web/tests/static-shell.test.mjs`.
- The Node 22.21.1 Web suite reproduces only the documented failure at line 69
  of that test, with 297/298 passing. The CTA is static internal route copy.
- S26 is `00-inbox` and names the file only as a future candidate; M48 is
  Backend-only. No active ownership collision exists.
- Queue and whitespace checks pass. The only worktree item outside control is
  the pre-existing untracked `.playwright-cli/` directory.

## Verdict

**CLEAR.** Move S32-T010 to `20-active` only for the existing test assertion.
Retain all static shell/home checks; add assertions for the exact
`href="/provider/deploy"` CTA and `Prepare a tool` label; remove only
`provider|deploy` from the deny-list; retain `wallet|payment|credential|auth|
onboarding|analytics|evidence|metric`. No app source or other test path is
authorized.
