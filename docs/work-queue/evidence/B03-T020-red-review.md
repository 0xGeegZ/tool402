# B03-T020 independent RED review

## Scope

Independent review of delegated RED commit
`a31cdcfa74993b5c522044ed6908cf2039052b51` against the active B03-T020
card, safe-phase diagnostics specification, plan, activation authority, and
ownership reservation.

## Verified scope

Only the two authorized test paths changed:

- `apps/agent/test/riskscan-pay-observability.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`

No source, manifest, lockfile, key, signer, payment payload/header, request,
retry, settlement, preflight execution, or live behavior changed.

## Focused RED result

Under Node 22.21.1, the focused suite reports 11 tests: 7 passes, 2 intended
failures, and 2 skips. The intended failures are the absent observability
module and absent CLI preflight wiring.

## Blocker

The current preflight assertion only text-matches three tokens. It does not
executablely prove that preflight makes at most one Directory GET and one
unsigned initial request, stops before any key/payer/signer/factory/payment
construction, avoids retry/settlement/result parsing, emits a closed
`PREFLIGHT_GUARD_REACHED` outcome, or preserves CLI-edge redaction. Those are
required by the committed card and specification.

## Verdict

BLOCKED — do not authorize GREEN. B03-T020 remains `20-active` only for a
strengthened durable RED contract in its two already-authorized test paths.
Every source and external boundary remains prohibited.
