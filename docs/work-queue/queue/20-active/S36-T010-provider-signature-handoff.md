# S36-T010 — Provider signature handoff

## State

- Tier: POLISH
- Queue state: 20-active
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
