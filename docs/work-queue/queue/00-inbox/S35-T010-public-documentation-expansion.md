# S35-T010 — Public API reference, FAQ, and Docs footer

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S34-T010 and S31-T010 accepted.
- Owner: The root owns the queue, specification, UI manifest, plan, decisions,
  evidence, commits, and integration. Candidate source/test paths are exactly
  those named by UI-S35.
- Human actions: none. This work creates no API request, MCP server, wallet,
  signer, payment, command, transaction, campaign, deployment, or live action.

## Scope

The user requested useful public documentation and a Docs footer group. S35
adds only static documentation for the accepted local HTTP boundary and
current product limits. Prepared documentation labels are visual direction;
their API & MCP, mock account, funding, payment, revenue, and activity claims
are excluded.

## Candidate ready requirements

- This card, S35 specification, UI-S35, ledger row, plan, catalog, ownership,
  State, and decision record are committed before test or source changes.
- A fresh independent readiness review confirms S34/S31 remain accepted, the
  candidate source/test paths are present-or-absent as declared, and no active
  lane owns them.
- A separate activation reserves only the focused test paths for durable RED;
  source remains prohibited until independent RED acceptance.

## RED and Green boundary

After activation, only `apps/web/tests/documentation-expansion.test.mjs` and
`apps/web/tests/public-documentation.test.mjs` may change for RED. A later RED
review may authorize only UI-S35's two pages, two components, Docs home, and
footer for minimal static GREEN. No route behavior, API/Agent/Core/Backend,
configuration, MCP, wallet, provider, payment, command, transaction,
deployment, or live-capability path is in scope.

## Verification

Final acceptance requires focused RED/GREEN evidence, Web typecheck/test/lint,
queue/whitespace checks, 1440px/390px browser evidence, and independent task
and module review.
