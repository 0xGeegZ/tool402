# B03-T020 — Agent safe phase diagnostics and non-payable preflight

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M05-T020 accepted, M05-T030 accepted, M06-T010 accepted,
  M12-T020 accepted, and B02-T010 accepted. B03-T010 is local-GREEN context
  only; its separate human exercise remains blocked and is not a dependency.
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `apps/agent/src/riskscan-pay-observability.ts`, the narrowly amended
  `apps/agent/src/riskscan-pay-cli.ts`,
  `apps/agent/test/riskscan-pay-observability.test.mjs`, and the narrowly
  amended `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`. No payment
  library, manifest, lockfile, package export, README, submission document,
  configuration, key, or runtime environment path is amendable.
- Human actions: none for local delivery. A future green non-payable preflight
  is Human Ops evidence only. The replacement paid attempt remains a separate
  human decision after that evidence; no agent executes it.

## Scope

The consumed B03 testnet exercise is `UNKNOWN` because its CLI retained only a
final closed outcome, not the failure phase. This card adds minimal safe phase
diagnostics and an explicit non-payable preflight to make a later one-use human
replacement decision evidence-based without inspecting a key, a signed payment
artifact, or a raw remote response.

The local authority is the
[B03-T020 intake review](../../evidence/B03-T020-intake-review.md) and the
[B03 safe phase diagnostics contract](../../../specs/b03-agent-safe-phase-diagnostics.md).

The normal payment outcome is unchanged. The only new output is one closed
line `RISKSCAN_PAY_DIAGNOSTIC <CODE>` using the committed allowlist. The
explicit `--preflight` path may make one Directory GET and one unsigned initial
request, decode and exact-match the challenge, then stop before every payment
or signed-retry boundary.

## Candidate ready requirements

- The card, specification, plan, intake review, catalog, ownership, decision,
  and State records are committed before RED or source change.
- Every declared dependency remains accepted. B03-T010 remains `50-blocked`
  and is not reopened.
- The two new paths are absent; the two existing B03 paths are subject only to
  the explicit sequential successor reservation. No active lane owns them.
- The contract fixes the closed code set, redaction rule, phase mapping, and
  non-payable preflight stop before an implementation begins.

## Readiness review

The independent current-head review at
[B03-T020 readiness review](../../evidence/B03-T020-ready-review.md) is
clear. This card is `10-ready`; a separate fresh activation may authorize only
the two durable test-only RED paths
`apps/agent/test/riskscan-pay-observability.test.mjs` and
`apps/agent/test/riskscan-tool-payment-boundary.test.mjs`. Every source path
and every external boundary remains prohibited pending fresh RED acceptance.

## Activation review

The fresh independent activation review at
[B03-T020 activation review](../../evidence/B03-T020-activation-review.md) is
clear. This card is `20-active` only to create the durable RED contract in
exactly these paths:

- `apps/agent/test/riskscan-pay-observability.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`

Every source path, key/signer/provider boundary, request, retry, settlement,
preflight execution, replacement attempt, deployment, and live action remains
prohibited pending fresh independent RED acceptance.

## RED review

The independent review at
[B03-T020 RED review](../../evidence/B03-T020-red-review.md) found the
delegated test-only commit correctly scoped but insufficient to prove the
non-payable preflight stop boundary. This card remains `20-active` only for the
two already-authorized test paths while that RED contract is strengthened.
Source remains prohibited.

## RED re-review

The independent re-review at
[B03-T020 RED re-review](../../evidence/B03-T020-red-rereview.md) remains
blocked for delegated test-only `6c19a2dde4b1a594cac6fe9a8f572e9bc28d5fe4`.
The strengthened harness now observes one Directory GET, one unsigned request,
and two payer-environment reads, but it does not executablely bind challenge
validation to the CLI guard or trap every forbidden signer, payment-construction,
retry, settlement, and result-parsing boundary. The card remains `20-active`
only for the same two tests; source remains prohibited.

## Second RED re-review

The independent [second RED re-review](../../evidence/B03-T020-red-rereview-02.md)
is blocked for delegated test-only
`01c99e9592aa5aee25de8e1d32e984d4353c0b49`. The four-commit series changes
only the two already-authorized test paths and remains durable RED, but its
child-process trace records only request paths rather than the configured
origin and it does not deny alternate outbound transports. The diagnostic
contract also lacks a `PREFLIGHT_GUARD_REACHED` vector, while the exact
challenge contract lacks explicit non-v2 and multi-accept rejection vectors.

The card remains `20-active` only for a further test-only correction in the
same two paths. Every source, configuration, key, signer, provider, payment,
preflight execution, replacement attempt, deployment, and live path remains
prohibited.

## Verification

- A durable test-only RED commit precedes every B03-T020 source change.
- Focused tests prove the exact closed diagnostic codes, no raw cause or
  sensitive sentinel reaches stdout/stderr, and normal B03 outcome semantics
  stay unchanged.
- Preflight tests prove at most one Directory GET and one unsigned initial
  request; exactly matched challenge; no payer/key read, signer resolution,
  factory creation, payment payload/header, signed retry, settlement decode,
  result parse, or second request; and exit 0 only at
  `PREFLIGHT_GUARD_REACHED`.
- Agent/root typechecks, targeted Agent tests and lint, queue/reference/
  whitespace checks, enabled local-reference guard, independent task review,
  and fresh module review pass before acceptance.

## Boundary

This is a source-only observability/preflight correction. It authorizes no
payment, wallet, provider, payer/key access, account, funding, recipient or
facilitator selection, transaction, deployment, finality claim, or submission.
No agent runs the later non-payable preflight or any replacement attempt.
