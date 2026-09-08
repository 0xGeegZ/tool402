# S19-T010 — ToolLoop demo prefill

## State

- Tier: POLISH
- Queue state: 10-ready
- Dependencies: M01-T040 accepted; M08-T010 accepted; S11-T010 accepted
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The proposed source/test paths are exactly the
  UI-S19 local targets. Accepted layout, package, lockfile, guided-demo, and
  ToolLoop files are narrow root integration reservations only.
- Human actions: none. This local usability amendment creates no wallet,
  payment, provider, configuration, account, transaction, deployment, or live
  behavior.

## Scope

Implement the local UI-S19 manifest. A Guided Demo click opens the existing
ToolLoop route with only demo=tool-loop, and the route reads that state through
nuqs to show one editable local fixture.

No raw request value is accepted from the URL. The normal ToolLoop route
remains blank. The existing form remains the only way to send a request.

## Ready requirements

- This card, UI-S19, catalog, ledger, ownership, decision, state, and the
  clear independent ready review are committed before a RED test, package, or
  source change.
- M01-T040, M08-T010, and S11-T010 remain accepted. No active card owns the
  exact form-default lines, the new focused test, or the one Guided Demo href.
- The root confirms the nuqs 2.10.1 integration reservation is sequenced ahead
  of future S15/M44 package work and behind no active lockfile lane.

## Verification

- A durable focused RED test fails only because the declared demo-default
  source behavior and nuqs integration are absent.
- Focused tests cover the closed query literal, blank fallback, fixture
  values, editable form defaults, exact Guided Demo href, and no automatic
  request behavior.
- Web/root typecheck, test, lint, queue/reference/whitespace checks, clean
  install, and the enabled guard pass.
- Browser verification covers the click-to-prefill path and an unchanged blank
  direct route.

## Boundary

This card improves demonstration ergonomics only. It does not change
RiskScan's request, payment, result, or terminal-state behavior and grants no
external capability.
