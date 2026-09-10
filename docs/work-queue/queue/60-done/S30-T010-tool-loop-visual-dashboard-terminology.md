# S30-T010 — ToolLoop visual and Dashboard terminology reconciliation

## State

- Tier: POLISH
- Queue state: 60-done
- Dependencies: M08-T010 accepted, S11-T010 accepted, S19-T010 accepted,
  M46-T040 accepted; S22-T010, S24-T010, and S31-T010 retain their disjoint
  active landing/dashboard/shell paths.
- Owner: The root owns queue state, catalog, ownership, UI ledger, decisions,
  reviews, commits, and pushes. The proposed source/test paths are exactly
  those listed in UI-S30.
- Human actions: none. This presentation work does not create an Agent, x402,
  payment, wallet, provider, account, transaction, deployment, or live action.

## Scope

Bring the existing local ToolLoop request page fully into the selected prepared
Try-page visual language without importing its mock simulation. Keep the
current fields, declarations, demo defaults, submit lock, current-origin Agent
composition, and closed truthful outcomes. Rename the one existing Guided Demo
Dashboard step so visitors see the same product terminology used by the
dashboard itself.

The local [UI-S30 manifest](../../../ui/UI-S30.md) fixes the exact visual,
copy, target, and truthfulness boundary. The existing selected reference alias
in the local ledger is the only visual authority; no source archive, URL, or
source tree is tracked here.

## Candidate ready requirements

- UI-S30, this card, the ledger, catalog, ownership, state, and decision
  records are committed before test or source changes.
- The two ToolLoop source paths and their test are accepted M08/S19 paths; the
  Guided Demo component and test are accepted S11/S19 paths. The root records
  the exact limited presentation reservation before RED.
- No active lane owns the same source paths. The S22 and S24 Dashboard
  wording changes remain constrained to their already authorized paths. S31
  retains the navigation assertion in `guided-demo-route.test.mjs`; D-S30-010-002
  reserves only that test's separate `/dashboard` expected-row assertion.

## Verification

- A durable test-only RED precedes source changes.
- Focused ToolLoop and Guided Demo tests, Web typecheck, whitespace,
  queue/reference checks, and the enabled local-reference guard pass.
- Browser checks at desktop and 390px cover the real local route, keyboard
  focus, semantic landmarks, reduced motion, and no horizontal overflow.
- Independent task and module review report no Critical finding.

## GREEN authorization

The fresh independent readiness re-review at
`73859377cb91565a35207e6ad15a612fd18887d3` and the independent RED review at
`21902b4c864cdbd07b329a775b6a3844232142ba` are clear. D-S30-010-004 permits
only the five source/test paths named in UI-S30 for minimal truth-first GREEN.
The exact real request contract and all mock/external/runtime exclusions remain
fixed.

## Acceptance

S30-T010 is accepted at source `4382af2` after durable RED/GREEN, focused
Node 22.21.1 10/10, Web typecheck, whitespace and queue checks, desktop and
390px browser verification, and clear independent task/module review. It
changes presentation and wording only; the form's request contract remains
unchanged.

## Boundary

This is a visual and terminology slice only. It neither changes nor asserts
the Agent request behavior, payment state, result, wallet, provider,
configuration, transaction, deployment, or live availability.

