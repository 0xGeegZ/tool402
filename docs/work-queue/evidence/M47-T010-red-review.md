# M47-T010 independent RED review

## Scope

Independent review of the durable M47 RED contract originally reviewed as
`748fd220354ef670ea3da8e6c58889c433f2a73f` and rebased onto current canonical
main as `8aedc8e`. The rebased commit changes exactly these five authorized
test paths:

- `packages/backend/tests/stage-b-ats-create-runtime-binding.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- `apps/web/tests/stage-b-ats-create-command-projection.test.mjs`
- `apps/web/tests/command-bridge.test.mjs`
- `apps/web/tests/deploy-stage-signing.test.mjs`

No production source, queue/control-plane, dependency, environment, provider,
wallet, SDK, network, transaction, candidate, or live path changed.

## Verification

Under Node 22.21.1, the focused durable RED command reports 51 tests: 37 pass,
six intended failures, and eight skips. The failures are limited to the absent
private binding/public projection and the existing M32/S21 source boundaries
that have not yet adopted those sources. `git diff --check` is clear.

The independent frozen-diff review is clear: the contract fixes the accepted
real M42 digest, rejects the synthetic display digest and tuple/authority
drift, requires private binding after M32 revalidation and before M33/replay/
idempotency/state, and keeps the browser projection limited to the six fixed
M26 fields without private or provider values.

## Verdict

CLEAR — authorize only the exact five source paths recorded in M47-T010 and
FILE-OWNERSHIP, with the five focused tests reserved for matching updates. M33
remains zero-enabled. All provider, wallet, SDK, network, transaction,
candidate, verification, and live actions remain prohibited.
