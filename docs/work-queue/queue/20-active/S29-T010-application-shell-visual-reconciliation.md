# S29-T010 — Application shell visual reconciliation

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T020 accepted, S17-T010 accepted, S22-T010 and S24-T010
  remain active with disjoint landing/dashboard paths.
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The proposed source/test paths are exactly
  those listed in UI-S29.
- Human actions: none. This visual shell work creates no payment, wallet,
  provider, account, configuration, transaction, deployment, or live action.

## Scope

Translate the selected prepared header composition into the existing Tool402
application shell while retaining only the routes and claims that the current
repository supports. Resolve the frozen navigation-contract regression by
superseding its presentation tokens only after a fresh, focused RED. The
existing two local truth strips, logo home target, four route hrefs, and
provider-deploy CTA are fixed inputs, not optional content.

The local [UI-S29 manifest](../../../ui/UI-S29.md) is the full source and
truthfulness boundary. It is a complete shell pass, not a request to copy
prepared mock navigation, assets, or data.

## Candidate ready requirements

- UI-S29, this card, the ledger, catalog, ownership, state, and decision
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

## RED activation

The independent readiness review at `a31ff2a4771585f431ea59f62ca6f2cae202b27c`
is clear. This activation permits only the three focused shell navigation
assertion amendments named in D-S29-010-002 to create durable RED. Every shell
source path remains prohibited until a fresh independent RED review accepts
the exact GREEN scope.

## Boundary

This is a presentational shell slice. It does not change any route's business
behavior or introduce a mock or live capability.
