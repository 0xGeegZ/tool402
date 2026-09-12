# S46-T010 — Demo control room

- Tier: POLISH
- Queue state: 60-done
- Dependencies: S43-T010 accepted, B03-T020 accepted, M56 current route
  integrated; no M55, ATS, World, or human action is a source dependency.
- Owner: root, accepted after the independently reviewed source delivery at
  `59ff318a` on PR #109.

The local specification is S46 demo control room at
docs/specs/s46-demo-control-room.md. The implementation reserves only the
declared demo sources, demo-only utility/controls, focused demo tests, release
rehearsal runbook, and root queue records.

The accepted tour-navigation boundary passes a validated stable `demoStep`
through the existing sign-in/dashboard redirect. It does not change the
authentication challenge, verification, wallet discovery, account selection,
signing, session decision, or dashboard authorization behavior.

The redirect-only exception is limited to
`apps/web/src/app/sign-in/page.tsx`,
`apps/web/src/components/auth/metamask-dashboard-sign-in.tsx`, and
`apps/web/tests/dashboard-auth.test.mjs`. It carries only a known demo step to
the existing internal dashboard destination; all other auth/wallet sources
remain excluded.

## Acceptance

The source delivery at `59ff318a` is accepted following full repository tests,
typecheck, web build, queue validation, focused local browser rehearsal at
desktop and 390px widths, and two fresh independent reviews. The control room
does not create a wallet action, signature, payment, transaction, explorer
identifier, ATS verification, World verification, backing allocation,
configuration, deployment, recording, or submission. Missing evidence remains
required, optional, or unavailable; it is never presented as a success.

The final verification record is
docs/work-queue/evidence/S46-T010-final-review.md.
