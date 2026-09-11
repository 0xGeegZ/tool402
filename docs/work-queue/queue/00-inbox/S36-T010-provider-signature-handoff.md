# S36-T010 — Provider signature handoff

## State

- Tier: POLISH
- Queue state: 00-inbox
- Dependencies: S29-T010 accepted, M50-T010 accepted.
- Owner: The root owns queue state, catalog, ownership, decisions, review,
  commits, and pushes. Candidate source paths are exactly the UI-S36 targets.
- Human actions: none. This local presentation work does not request a
  wallet, signature, authority change, relay, durable record, payment,
  transaction, ATS execution, deployment, or live action.

## Scope

The current Provider deployment screen implements the existing signature
request, but its actionable button is buried inside the first stage card while
the static declined-signature explanation is visually prominent near the
wallet panel. This small slice adds one explicit current-stage handoff that
calls the existing activation callback. It changes discoverability only.

The local implementation contract is the
[UI-S36 Provider signature handoff manifest](../../../ui/UI-S36.md). It builds
on accepted [UI-S29](../../../ui/UI-S29.md) presentation and accepted M50
wallet-session synchronization.

## Candidate ready requirements

- The card, manifest, plan, catalog, ownership, State, decision, and ledger
  row are committed before a source or test change.
- S29-T010 and M50-T010 remain accepted with no active ownership reservation
  on the two UI-S36 paths.
- The new test is absent and the existing stages component is present.

## Verification

- Durable test-only RED proves the handoff is absent.
- Focused behavioral test proves the handoff calls the existing stage callback
  once for the current actionable stage and does not exist in blocked or
  in-progress states.
- Web typecheck/test/lint, root lint, queue/reference/whitespace validation,
  enabled guard, and a non-interacting browser render of `/provider/deploy`
  are clear.

## Boundary

This card is presentation-only. It creates no new action, authority, wallet
request, signature, relay, state transition, record, API call, payment,
transaction, ATS activity, deployment, or live claim.
