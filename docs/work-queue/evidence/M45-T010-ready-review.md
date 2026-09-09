# M45-T010 readiness review

## Scope

Independent readiness review at clean current head `b1e5973` of the M45 card,
specification, accepted predecessors, M41 public projection, catalog, state,
ownership reservations, and declared Web paths.

## Findings

- M05, M09, M28, M40, and M41 are accepted locally.
- M41's active-directory public route serves the exact admitted `FOUND`
  projection M45 parses; non-found and unavailable outcomes fail closed.
- D-M45-010-001 preserves the default discovery body and restricts the active
  record to the exact opt-in metadata view.
- The two new M45 paths are absent and disjoint. The root reservation limits
  accepted-path amendments to the declared Tool Directory module, route, and
  focused API test; no Agent path is reserved.
- The focused accepted Tool Directory regression passed 8/8 and Web typecheck
  passed under Node 22.21.1. The only broader Web failures are the separately
  active, source-absent M44 RED tests and are unrelated to M45.

## Verdict

CLEAR — M45 may move to `10-ready`. A separate activation may authorize only
`apps/web/tests/active-directory-version.test.mjs` and the constrained
`apps/web/tests/tool-directory-api.test.mjs` RED amendment. Every source,
route, configuration, Agent, payment, provider, wallet, SDK, transaction,
deployment, and live path remains prohibited until a fresh RED review.
