# B03-T020 second independent RED re-review

## Scope

Independent root review of delegated local RED series
`01c99e9592aa5aee25de8e1d32e984d4353c0b49` from base
`ab5096b6857450d915ae0f5d5a2b2e2a2835f9f2` against the active B03-T020 card,
safe-phase diagnostics specification, activation authority, and ownership
reservation.

## Verified scope and result

The four-commit series changes exactly these two authorized test paths:

- `apps/agent/test/riskscan-pay-observability.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`

`git diff --check` is clear. Under Node 22.21.1, the focused RED suite reports
the declared absent-source failures only; the existing payment-boundary suite
continues to pass. No source, package, configuration, key, signer, provider,
payment, retry, settlement, preflight, replacement attempt, deployment, or
live behavior changed.

## Blocker

The child-process harness records only a URL path and accepts either allowed
path from any origin. It therefore cannot prove exactly one configured-origin
Directory GET and initial unsigned POST. It intercepts `fetch` but does not
deny alternative outbound transports, so it cannot prove that an implementation
has no unobserved payable external route.

The diagnostic mapper also lacks an explicit `PREFLIGHT_GUARD_REACHED` vector,
and the challenge vectors lack explicit rejection of a non-v2 `x402Version`
and multiple `accepts` entries.

## Verdict

BLOCKED — do not authorize GREEN. B03-T020 remains `20-active` only for a
test-only strengthening of the same two paths. Source, preflight execution,
replacement payment, and every live boundary remain prohibited.
