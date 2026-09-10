# B03-T020 final independent RED re-review

## Scope

Independent specification and standards reviews evaluated delegated durable RED
revision `025b2050f926abe24e0271662bbfd8c040932264` from the B03 test-only
branch against canonical `b6b11cb874acd6daf105e1e8a002b2aac46b924f`, the
active B03-T020 card, the safe-phase diagnostics specification, and the
FILE-OWNERSHIP reservation.

The aggregate test-only series changes exactly:

- `apps/agent/test/riskscan-pay-observability.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`

No source, package, lockfile, public export, configuration, key, signer,
provider, request, payment, retry, settlement, deployment, or live path
changed. `git diff --check` and the delegated worktree status are clean.

## Verification

Under Node 22.21.1, the focused B03 suite reports seven passes, twenty
intentional RED failures, and two skips. Each failure is attributable only to
the absent observability module or the absent required CLI behavior; no loader
initialization, command serialization, data-URL, or raw-sentinel failure
remains.

The contract proves closed diagnostic mapping, exact configured-origin
Directory/initial-request tracing, challenge rejection including non-v2 and
multiple-accept cases, no payer/signing/payment/retry/settlement path before
the preflight guard, and unchanged normal output expectations. The child
harness uses an explicit minimal environment, traps global fetch and the
available outbound transport sinks, and redacts child errors before assertions
can print a command or fixture payload.

## Verdict

CLEAR — accept the durable RED contract. Retain B03-T020 in `20-active` and
authorize only `apps/agent/src/riskscan-pay-observability.ts`, the narrowly
amended `apps/agent/src/riskscan-pay-cli.ts`, and matching changes to the two
already-reserved tests for GREEN. The payment library, manifests, configuration,
keys, signer/wallet/provider authority, external requests, preflight execution,
replacement attempt, deployment, and every live action remain prohibited.
