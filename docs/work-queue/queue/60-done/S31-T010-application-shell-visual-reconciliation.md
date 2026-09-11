# S31-T010 — Application shell visual reconciliation

## State

- Tier: POLISH
- Queue state: 60-done
- Dependencies: M02-T020, S17-T010, S22-T010, and S24-T010 accepted.
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The proposed source/test paths are exactly
  those listed in UI-S31.
- Human actions: none. This visual shell work creates no payment, wallet,
  provider, account, configuration, transaction, deployment, or live action.

## Scope

Translate the selected prepared header composition into the existing Tool402
application shell while retaining only the routes and claims that the current
repository supports. Resolve the frozen navigation-contract regression by
superseding its presentation tokens only after a fresh, focused RED. The
existing two local truth strips, logo home target, four route hrefs, and
provider-deploy CTA are fixed inputs, not optional content.

The local [UI-S31 manifest](../../../ui/UI-S31.md) is the full source and
truthfulness boundary. It is a complete shell pass, not a request to copy
prepared mock navigation, assets, or data.

## Candidate ready requirements

- UI-S31, this card, the ledger, catalog, ownership, state, and decision
  records are committed before test or source changes.
- Every source/test path belongs to an accepted prior slice; the root records
  the exact shell-only integration reservation before RED.
- The only overlapping paths are `landing-explore.test.mjs` and
  `workspace-shell.test.mjs`. The reservation may amend only their assertions
  about `LocalNavigation`'s exact entries and responsive list anatomy; every
  landing/dashboard assertion remains with S22/S24.
- S22/S24 retain their active source scopes. No current active lane owns the
  two shell source paths.

## Verification

- Durable focused RED before source work; focused shell tests, Web typecheck,
  whitespace, queue/reference checks, and the enabled guard after GREEN.
- Browser evidence at 1440px and 390px confirms visual hierarchy, focus,
  menu operation, local targets, and no overflow.
- Independent task and module review report no Critical finding.

## GREEN authorization

The independent readiness review at `a31ff2a4771585f431ea59f62ca6f2cae202b27c`
and the fresh independent RED review at
`b5d3c9e095f08ab7b517b0cdeac08d190448188d` are clear. The accepted RED
proves only the absent compact mobile menu/right-side sheet. D-S31-010-004
therefore permits the two declared shell source paths and the three matching
focused tests for minimal presentational GREEN.

## Provisional acceptance

S31-T010 is accepted at final shell refinement `fb706f1`. The independent
current-head review at `a4833329fbd72531980283ff269afe6ba8882765` confirms
that later changes are S23-only and disjoint. The combined S22/S31 focused
suite passes 27/27; Web typecheck, queue validation, and whitespace checks are
clear. The reviewed shell preserves both truthful notices, the exact local
href map, clickable home logo, provider-deploy CTA, keyboard-operable mobile
menu, focus return, Escape handling, and no-external-link boundary.

## Acceptance correction

The independent follow-up review found that the compact-strip assertion added
to `apps/web/tests/landing-explore.test.mjs` was not an allowed
`LocalNavigation` entry assertion under D-S31-010-002. D-S31-010-006
supersedes only the completed status: S31 returns to `20-active` solely to
remove that named test from the shared file. Its two shell source paths and
all other tests are closed; no route, shell behavior, CTA, or claim may change.
A fresh independent correction review is required before S31 returns to
`60-done`.

## Correction acceptance

The independent exact-diff review accepted `20125ac`: it removes only the
fourteen-line unreserved compact-strip test from
`apps/web/tests/landing-explore.test.mjs`, retains the reserved
`LocalNavigation` route/menu assertions, passes the focused Node 22 suite
6/6, and is whitespace-clean. S31 returns to `60-done`; it grants no further
source or test reservation.

## Boundary

This is a presentational shell slice. It does not change any route's business
behavior or introduce a mock or live capability.
