# S35-T010 — Public API reference, FAQ, and Docs footer

## State

- Tier: POLISH
- Queue state: 10-ready
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

## Ready evidence

Independent readiness at `4c5770c8a5cefc9fa1a1c31cbe8fac7b9e9fd62d` is
clear. S31/S34 are accepted, no active task owns the candidate paths, the new
routes/components/test are absent, and Node 22.21.1 current Docs baseline is
5/5. D-S35-010-002 moves this card to 10-ready; it grants no source or test
authority.

## RED and Green boundary

A separate activation may reserve only
`apps/web/tests/documentation-expansion.test.mjs` and
`apps/web/tests/public-documentation.test.mjs` for durable RED. Source remains
prohibited until independent RED acceptance. The later minimal Green may touch
only UI-S35's two pages, two components, Docs home, and footer. No route
behavior, API/Agent/Core/Backend, configuration, MCP, wallet, provider,
payment, command, transaction, deployment, or live-capability path is in
scope.

## Verification

Final acceptance requires focused RED/GREEN evidence, Web typecheck/test/lint,
queue/whitespace checks, 1440px/390px browser evidence, and independent task
and module review.
