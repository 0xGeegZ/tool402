# S36-T010 — Provider signature handoff

## State

- Tier: POLISH
- Queue state: 60-done
- Dependencies: S29-T010 accepted, M50-T010 accepted.
- Owner: The root owns queue state, catalog, ownership, decisions, review,
  commits, and pushes. The active paths are exactly the UI-S36 targets.
- Human actions: none. This local presentation work does not request a
  wallet, signature, authority change, relay, durable record, payment,
  transaction, ATS execution, deployment, or live action.

## Scope

The current Provider deployment screen implements the existing signature
request, but its actionable button is buried inside the first stage card while
the static declined-signature explanation is visually prominent near the
wallet panel. This small slice adds one explicit current-stage handoff that
calls the existing activation callback. It changes discoverability only.

The local contract is [UI-S36](../../../ui/UI-S36.md). The readiness and
activation review confirms accepted S29/M50 have no active reservation on the
two UI-S36 targets. The durable RED test has one intended failure: the absent
handoff region. It authorizes minimal GREEN only in the two declared paths.

## Verification

- The focused contract proves an actionable stage invokes the existing
  callback exactly once and non-actionable states add no entry point.
- Web typecheck/test/lint, root lint, queue/reference/whitespace validation,
  enabled guard, and a non-interacting browser render of `/provider/deploy`
  are required before review.

## Boundary

This card is presentation-only. It creates no new action, authority, wallet
request, signature, relay, state transition, record, API call, payment,
transaction, ATS activity, deployment, or live claim.

## Acceptance

S36-T010 is accepted by the repository operator's ruling of 2026-09-12 on the
delivered work already merged on `main` at `07beeffe`. The GREEN authorized by
D-S36-010-002 was delivered by commit `b26e7f87`, "fix: Surface provider
signature handoff", integrated at merge commit `9727f4fb` through pull request
#57. The declared contract is live on `main`: the conditional handoff region
carries `data-ui="provider-signature-handoff"` at
`apps/web/src/components/provider/deploy/provider-deploy-stages.tsx` line 246,
and its focused contract is
`apps/web/tests/provider-deploy-signature-handoff.test.mjs`. The later provider
work amended the same component around that region rather than replacing it, so
the slice is delivered, not superseded. Verification is the merged-`main` state at `07beeffe`: the complete Web suite passes 547 of 548 with no failure and one skip, Web typecheck is clean, and the Web build renders 37 of 37 routes. The acceptance releases the S36
source and test reservation and grants no wallet, signature, authority change,
relay, durable record, payment, transaction, ATS execution, deployment, or live
action.
