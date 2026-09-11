# S33-T010 corrected RED review

## Reviewed source

- Exact head: `16ff8ace44033254a6868b317d6b03bbfb6ee506`.
- Changed production files: none.

## Review result

The strengthened visual test correctly protects semicolon-less client
directives, general `useX` hooks, `aria-controls` and `aria-selected`, the
additional prohibited claims, and non-HTTP or protocol-relative URLs. Its
focused Node 22.21.1 run has one intended failure only: the page retains the
old machine-payment phrase.

## Blocking dependency

`apps/web/tests/landing-explore.test.mjs` contains one existing assertion that
requires the same prohibited phrase. It runs in the full Web suite, so a
page-only copy correction would fail the suite.

## Required authority

D-S33-010-007 reserves only that exact assertion for a matching durable RED
and later Green. Fresh independent RED review remains required before either
the page sentence or that assertion can change.

## Verdict

**BLOCKED** pending the narrow dependent-test correction. No behavior or
additional source scope is authorized.
