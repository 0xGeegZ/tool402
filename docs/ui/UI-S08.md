# UI-S08 browser native quote compatibility manifest

## Delivery boundary

UI-S08 adds one guest Dashboard compatibility route and one bounded client
island. It reuses existing local tokens, Card, Badge, Button, and semantic
Link primitives to expose the accepted native quote compatibility boundary
without fabricating a signed-in or payable state.

## Local targets

The slice may add
`apps/web/src/app/dashboard/riskscan/compatibility/page.tsx`, components under
`apps/web/src/components/riskscan/native-quote/`, and a focused compatibility
test. It may make one constrained Workspace route-map link amendment and the
corresponding focused assertion amendment.

## Truthfulness and authority boundary

The user supplies an unpersisted native compatibility policy explicitly. The
island delegates only through the public local Agent boundary and presents
bounded outcomes from that boundary. `eligible` means local compatibility
only, never a Sign/session, consent, account, wallet, payment authorization,
payment, transaction, settlement, live availability, result, receipt, or
evidence claim.

The slice contains no default policy, identity/session/provider surface,
account, wallet, signer, balance, recipient, facilitator, runtime
configuration, direct request construction, POST, payment client, storage,
timer/retry, analytics, external link, persistence, deployment, or full-tree
import.

## Acceptance evidence

- Focused source contracts cover route semantics, the explicit no-default
  form, public-Agent/current-origin delegation, outcome truthfulness,
  duplicate-submit locking, local navigation, and the exclusion boundary.
- Desktop and narrow browser checks cover rendering, explicit interaction,
  polite status feedback, local navigation, keyboard focus, no horizontal
  overflow, and framework/browser diagnostics.
- Web/root quality, production build, queue, guard, independent review, and
  two clean module-review generations pass before acceptance.
