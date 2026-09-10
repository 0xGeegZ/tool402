# S24-T010 source-to-current comparison

The selected local dashboard visual direction is represented only by the
existing `PREP-UI-001` alias. The current guest dashboard may clarify its
purpose, local journeys, next actions, and explicitly unavailable states.

Only these local CTA targets may be represented: `/explore`,
`/explore/riskscan`, `/explore/riskscan/tool-loop`,
`/dashboard/riskscan/compatibility`, `/dashboard/riskscan`, and
`/dashboard/riskscan/preflight`.

Mock account, wallet, provider, balance, payment, transaction, receipt,
evidence, funding, return, or live state is omitted. The initial active scope
is limited to these exact source/test paths:

- `apps/web/src/app/dashboard/page.tsx`;
- `apps/web/src/components/workspace/workspace-shell.tsx`;
- `apps/web/src/components/workspace/workspace-overview.tsx`;
- `apps/web/src/components/workspace/workspace-navigation.tsx`;
- `apps/web/tests/workspace-shell.test.mjs`; and
- `apps/web/tests/dashboard-workspace-reconciliation.test.mjs`.

No global CSS/layout, child route/island, API/Agent, Provider/Demo, asset,
configuration, package, README, submission, deployment, or video path is in
scope.
