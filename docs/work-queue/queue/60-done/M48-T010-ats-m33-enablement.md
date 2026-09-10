# M48-T010 — ATS M33 local enablement

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M32-T010 accepted, M33-T010 accepted, M42-T010 accepted, and
  M47-T010 accepted
- Owner: Root owns queue state, catalog, ownership, decisions, reviews,
  commits, pushes, and integration. Candidate implementation is confined to
  `packages/backend/convex/ats_prepare_authority.ts`,
  `packages/backend/tests/ats-prepare-authority.test.mjs`, and the narrowly
  amended `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`.
  After independent RED acceptance, the narrowly scoped historical assertion
  amendments in `packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs`,
  `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`, and
  `packages/backend/tests/ats-receipt-verification.test.mjs` are also permitted
  only as recorded in
  [the GREEN scope amendment](../../evidence/M48-T010-green-scope-amendment.md).
  Those paths are not active until separate readiness, activation, and RED
  acceptance records exist.
- Human actions: HA-ATS-M33-ENABLEMENT-001 is accepted as the limited local
  source-mapping authority. HA-ATS-STAGE-B-001 remains pending and is the only
  execution gate.

## Scope

The accepted human decision permits exactly one static, source-only M33
`ATS_CREATE` mapping for the existing M42 real-issuer configuration. M47 has
already bound the durable normalized signer and payload tuple before M33; M48
does not alter that binding, the canonical configuration preimage, the
canonical hash, or M32's replay/idempotency ordering.

The local authority is the [M48 specification](../../../specs/m48-ats-m33-enablement.md),
the [accepted human decision](../../evidence/HA-ATS-M33-ENABLEMENT-001-decision.md),
and the [intake review](../../evidence/M48-T010-intake-review.md).

## Candidate readiness requirements

- Every listed dependency remains accepted on canonical main.
- The static mapping exactly reproduces the accepted M42/M47 tuple and M42
  descriptor/parameters; any drift returns the card to human decision.
- The three candidate Backend paths have no active ownership collision.
- The focused Node 22.21.1 command is concrete:

  ```sh
  cd packages/backend
  /Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin/node --test \
    tests/ats-prepare-authority.test.mjs \
    tests/external-prepare-command-durable-admission.test.mjs
  ```

## Explicit exclusions

Do not provision `commandAuthorities`, publish Convex, access configuration or
environment values, use an SDK, wallet, provider, RPC, or Mirror, create an
attempt/asset/candidate, send a request, build or submit calldata, make a
transaction, or claim receipt/finality/live evidence. No other ATS operation
is enabled. M42, M47, M32 source, schema, exports, packages, lockfiles, Web,
Agent, and submission documentation remain outside this card.

## Readiness review

The independent [M48 readiness review](../../evidence/M48-T010-ready-review.md)
is clear at canonical `816947e1529a49a87026db39aabf5549a6008c07`. M48 is
`10-ready`; a separate fresh activation may authorize only durable test-only
RED in the two declared Backend test paths. Production source and every live
boundary remain prohibited.

## Activation review

The independent [M48 activation review](../../evidence/M48-T010-activation-review.md)
is clear at canonical `1c35f4c614d71ef27bdc9785c2ed3003e7fcb458`. M48 is
`20-active` only to create durable RED in exactly:

- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`

The source mapping remains prohibited until independent RED acceptance.

## GREEN scope amendment

The independent
[M48 GREEN scope amendment](../../evidence/M48-T010-green-scope-amendment.md)
records three required GREEN-only test changes: retire the historical M37/M42/M43
assertions that the downstream M33 manifest is empty. It preserves every M37/M42
source, M42 preimage/digest, privacy, and no-import invariant, and M43's
`NOT_CONFIGURED`-before-Mirror behavior; it authorizes neither a source change
nor a broader M48 path.

## RED acceptance and GREEN authorization

The independent [M48 RED review](../../evidence/M48-T010-red-review.md) is
clear. Integrated durable RED commit `7106d01` changes only the two authorized
test paths and reports 33 passes plus two intended empty-manifest failures.
M48 remains `20-active` and authorizes GREEN only for:

- `packages/backend/convex/ats_prepare_authority.ts`
- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- `packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs`
- `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`
- `packages/backend/tests/ats-receipt-verification.test.mjs`

The manifest must be one private deeply frozen M42/M47-aligned literal. The
three historical-test amendments may remove only their stale empty-manifest
assertions, preserving M43's `NOT_CONFIGURED`-before-Mirror behavior. Every
other source path and every authority provision, publication, configuration,
SDK/provider/wallet/RPC/network/request/transaction/candidate/live path remain
prohibited.

## GREEN acceptance

The independent [task review](../../evidence/M48-T010-task-review.md),
[specification review](../../evidence/M48-T010-module-review-spec.md), and
[standards review](../../evidence/M48-T010-module-review-standards.md) are
clear. Source commit `6c78e3d` follows durable RED `7106d01`; its fixed
M42/M47 descriptor and parameters recompute to the accepted digest
`1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`.

The five affected suites pass 52/52, the complete Backend suite passes
285/285, and Backend typecheck/lint plus root lint, queue, whitespace, and the
enabled reference guard pass under Node 22.21.1. M48 is accepted at `60-done`
as one local compiled M33 mapping. It does not provision an authority row,
publish Convex, access configuration, or authorize SDK/provider/wallet/RPC/
network/request/transaction/candidate/live behavior. HA-ATS-STAGE-B-001 remains
the separate required human execution gate.
