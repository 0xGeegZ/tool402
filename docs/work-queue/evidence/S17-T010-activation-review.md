# S17-T010 activation review

## Scope

Independent activation review at clean pushed
`2252545e4ea1183c45ea45ba8423ff05a8d5e412` of the ready S17-T010 card,
accepted dependencies, UI manifest, ownership reservation, active lanes,
declared test/source paths, queue, and local-reference guard.

## Findings

- `HEAD` and `origin/main` were equal, the worktree was clean, and the diff
  check was clear.
- M02-T020, M11-T020, M29-T010, M41-T010, S16-T010, and S11-T010 remain
  accepted. The card, UI manifest, ledger, catalog, State, ownership,
  decision, and ready evidence remain resolvable.
- No S17 declared source, test, or reserved navigation path changed after the
  ready review. M46's RED scope is disjoint, so no active collision exists.
- Node 22.21.1 validation was clear: queue check, the focused navigation/a11y
  baseline (19/19), and root typecheck.

## Verdict

CLEAR — activate S17-T010 only for durable test-only RED: create
`apps/web/tests/provider-status.test.mjs` and
`apps/web/tests/offerings-api.test.mjs`, and amend only the frozen
navigation-list assertions in `apps/web/tests/workspace-shell.test.mjs`,
`apps/web/tests/landing-explore.test.mjs`, and
`apps/web/tests/guided-demo-route.test.mjs`. Every source path, the navigation
source, `apps/web/tests/shell-accessibility.test.mjs`, environment/live read,
command/write, wallet/provider, payment, transaction, deployment, and other
external capability remain prohibited pending fresh independent RED acceptance.
