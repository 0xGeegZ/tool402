# S40-T010 readiness review

## Scope

Independent read-only readiness review at clean control head
`71a059caa525cbfa397f40f262b01207ba46dab7`, rebased on exact canonical
`ca80c6edddae09b0577678e4b61c63f87553321f`.

## Review

- S15-T010, M50-T010, and S24-T010 are accepted. S38 declares exactly those
  dependencies; S26 remains an independent `00-inbox` header/session card.
- The eight declared auth source paths and the two declared focused auth tests
  are absent. The only accepted-S24 overlap is the root-reserved Dashboard
  eyebrow and its two matching wording assertions; no other S24 path transfers.
- No active lane owns an S38 candidate. S36 is the sole active lane and its
  Provider deploy scope is disjoint. S38 excludes `app/layout.tsx`,
  `wallet-connect.tsx`, `wallet-session.tsx`, nested dashboard pages,
  workspace components, public APIs, packages, lockfile, and configuration.
- Under Node 22.21.1, the required canonical Web baseline
  `npm run test --workspace @tool402/web` passed 362/362 after the rebase.
- The UI-S38 protocol remains bounded to the configured HTTPS origin, sealed
  five-minute challenge, eight-hour signed HttpOnly session, exact browser
  request bodies and same-origin credentials, local signature verification,
  and server dashboard redirect. Real configuration/account/signature actions
  remain human-owned.

## Verdict

CLEAR — S40-T010 moves to `10-ready` with no active source or test reservation.
A fresh separate activation may authorize only durable RED in
`apps/web/tests/dashboard-auth.test.mjs` and
`apps/web/tests/dashboard-auth-routes.test.mjs`. Every production source path,
the existing dashboard wording amendment, configuration/environment value,
wallet account request, signature, provider command, relay, transaction,
payment, deployment, and live action remains prohibited.
