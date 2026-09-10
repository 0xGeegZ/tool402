# B03-T020 — Agent safe phase diagnostics and non-payable preflight

## State

- Tier: CORE_P0
- Queue state: 00-inbox
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

## Human worktree lane request

- Requested at `2026-09-10T14:30:00Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/b03-diagnostics`, branch `work/b03-diagnostics`. Implementer: the
  operator's delegated session. Reviewer: the root's independent task review
  and module review, unchanged.
- The lane delivers, in this order on that branch: one test-only RED commit at
  the declared test paths, failing only because the declared source does not
  exist or the declared amendment has not been made; then the minimal GREEN
  commits limited to the declared source paths.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, evidence, spec, or manifest file. The root keeps the
  ready review, the activation decision, the independent reviews, the
  integration decision, and every queue record. The branch is mirrored as a
  pull request for human visibility only; nothing from it reaches `main`
  outside the root's integration decision.
