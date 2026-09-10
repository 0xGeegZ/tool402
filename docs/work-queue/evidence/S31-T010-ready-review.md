# S31-T010 readiness review

- Reviewed exact head: `a31ff2a4771585f431ea59f62ca6f2cae202b27c`.
- Verdict: ready for a separate test-only RED activation, not source work.
- M02-T020 and S17-T010 are accepted. UI-S31, the S31 card, ledger, catalog,
  state (including the local UI record), ownership, and decision records
  resolve at this head.
- `layout.tsx` and `local-navigation.tsx` have no active source owner. The
  only test overlap was resolved by D-S31-010-002: S31 may amend exactly the
  LocalNavigation assertions in the two active-slice tests and its own frozen
  Guided Demo navigation assertion; S22/S24 retain all other assertions and
  sources.
- The focused baseline is 14 passing tests and one failure only: the obsolete
  five-link Guided Demo navigation assertion. It is inside S31's reservation.
  A durable RED can replace that assertion and then fail only because the
  compact menu/right-side sheet is absent.
- The four local hrefs, home link, provider-deploy CTA, two truthful strips,
  and no-mock boundary are confirmed. No source was changed in this review.
