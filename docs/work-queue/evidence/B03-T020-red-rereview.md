# B03-T020 independent RED re-review

## Scope

Independent review of strengthened delegated test-only commit
`6c19a2dde4b1a594cac6fe9a8f572e9bc28d5fe4` against the active B03-T020
card, safe-phase diagnostics specification, plan, activation authority, prior
blocked review, and ownership reservation.

## Verified scope

Only the two authorized test paths changed from the pre-RED baseline:

- `apps/agent/test/riskscan-pay-observability.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`

No source, manifest, lockfile, key, signer, payment payload/header, request,
retry, settlement, preflight execution, or live behavior changed.

## Focused RED result

Under Node 22.21.1, the focused suite reports 11 tests: 7 passes, 2 intended
absent-source failures, and 2 skips. The child-process harness executes and
observes one Directory GET, one unsigned initial request, the closed guard line,
an exit code of zero at that guard, and empty stderr.

## Remaining blocker

The harness does not yet prove the full structural stop boundary required by the
committed card and specification:

- the valid-challenge CLI case can print the guard without proving that it
  validates the decoded challenge and exact quote match;
- there are no executable traps for signer resolution, payment factory/payload/
  header construction, signed retry, settlement decoding, or result parsing;
- it records only request paths, not origins, and does not rule out alternate
  request mechanisms; and
- it lacks an invalid-challenge CLI-edge assertion for a redacted closed
  diagnostic and nonzero exit.

## Verdict

**BLOCKED — do not authorize GREEN.** B03-T020 remains `20-active` only for a
further strengthened durable RED contract in its two already-authorized test
paths. Every source and external boundary remains prohibited.
