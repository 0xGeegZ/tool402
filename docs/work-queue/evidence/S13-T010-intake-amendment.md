# S13-T010 intake amendment

## Scope

Root control amendment after an independent read-only audit at clean pushed
`f09bf26fce78ddc782a65848a86ec0bf9aa47df7`.

It corrects S13's local dependency and ownership records before any source or
RED test is created. No application source, configuration, provider or wallet
interaction, payment, transaction, deployment, or live action was performed.

## Amendment

- Replace the unrelated accepted M14-T010 dependency with accepted M08-T010:
  M08 owns the exact ToolLoop component and focused test that S13 may amend.
- Record an explicit root integration reservation for only the shared
  stylesheet and five outcome-rendering component lines named by UI-S13. Their
  accepted owner records remain intact; this reservation grants no state,
  message, transport, or domain-logic change.
- Fix the two new, disjoint focused-test paths as
  `apps/web/tests/status.test.mjs` and
  `apps/web/tests/state-panel.test.mjs`. Existing focused suites remain
  unchanged and are verification, not S13 amendment targets.
- Add UI-S13 to the local UI record and ledger so every S13 document reference
  resolves in the committed repository.

## Next gate

S13-T010 remains in `00-inbox` pending a fresh independent ready review after
this amendment. That review must confirm the corrected dependency, exact
reservation, absent new paths, no active collision, and concrete RED/GREEN
commands before any queue-state move or source change.
