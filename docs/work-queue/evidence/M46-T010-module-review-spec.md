# M46-T010 specification module review

## Scope

Second fresh independent module review at
`2482a9bc5f8937afefe2416cae5d7c6fb7fcf898` against the committed M46 card,
local EntityCheck specification, focused tests, and accepted Core boundaries.

## Review

- The parser admits only the closed French request and preserves the optional
  SIREN grammar without defaults.
- Registry and sanctions inputs require the documented closed ordinary shapes;
  malformed members reject the assessment as a whole.
- The `found`, `ambiguous`, and `not_found` dispositions and the `clear`,
  `hit`, and `not_screened` screens retain the specified result shape,
  ordering, cap, and limitations.
- Sanctions matches use direct equality only after the specified NFKD,
  mark-removal, punctuation-to-space, case, whitespace-collapse, and trim
  sequence.
- The module makes no source, payment, receipt, compliance, availability, or
  live assertion beyond the supplied records.

## Verification

The focused M46 contract passed 16/16 and the complete Core suite passed
152/152 under Node 22.21.1. Root typecheck and lint, queue validation, the
enabled guard, and whitespace validation are clear.

## Verdict

CLEAR — no Critical, Important, or Minor finding. M46 conforms to its local
pure EntityCheck boundary.
