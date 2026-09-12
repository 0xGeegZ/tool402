# S45-T010 — Demo control room

- Tier: POLISH
- Queue state: 20-active
- Dependencies: S43-T010 accepted, B03-T020 accepted, M56 current route
  integrated; no M55, ATS, World, or human action is a source dependency.
- Owner: root, on PR #109 after direct repository-owner implementation
  authority.

The local specification is S45 demo control room at
docs/specs/s45-demo-control-room.md. The owner explicitly authorizes its
RED/GREEN implementation in the current PR. It reserves only the declared demo
sources, demo-only utility/controls, focused demo tests, release rehearsal
runbook, and root queue records.

The accepted tour-navigation boundary may pass a validated stable `demoStep`
through the existing sign-in/dashboard redirect. It must not change the
authentication challenge, verification, wallet discovery, account selection,
signing, session decision, or dashboard authorization behavior.

The redirect-only exception reserves exactly
`apps/web/src/app/sign-in/page.tsx`,
`apps/web/src/components/auth/metamask-dashboard-sign-in.tsx`, and
`apps/web/tests/dashboard-auth.test.mjs`; all other auth/wallet sources
remain excluded.

S45 creates no wallet action, signature, payment, transaction, explorer
identifier, ATS verification, World verification, backing allocation,
configuration, deployment, or submission. It can present only existing
truthful pending/required states when those facts cannot be independently
proven.
