# M44-T030 — BondDeployed decoded-address canonicalization

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M44-T020 accepted and M42-T010 accepted.
- Owner: root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. The accepted delivery is the narrow amendment of
  `apps/web/src/lib/ats/factory-deploy-bond.ts` and
  `apps/web/tests/factory-deploy-bond.test.mjs`. No package, lockfile, SDK,
  browser-compatibility, provider, wallet, RPC, transaction, or live path is
  amendable.
- Human actions: none for local delivery. HA-ATS-STAGE-B-001 remains the sole
  authority for every execution action.

## Scope

The accepted M44 direct Factory + viem seam decodes `BondDeployed` with the
official Factory artifact. The decoded `bondAddress` may be a valid EIP-55
mixed-case address, but the helper currently applies the lower-case-only
trusted-configuration parser and rejects it.

This successor corrects only decoded event output: validate a decoded EVM
address with the existing viem-compatible address boundary, then normalize a
valid result to Tool402 canonical lowercase. It does not relax the existing
lowercase-only validation for trusted/canonical configuration inputs.

The local authority is the
[M44-T030 intake review](../../evidence/M44-T030-intake-review.md) and the
[M44 BondDeployed canonicalization contract](../../../specs/m44-bonddeployed-address-canonicalization.md).

## Candidate ready requirements

- The card, specification, plan, intake review, catalog, ownership, State, and
  decision are committed before any RED test or source amendment.
- M44-T020 and M42-T010 remain accepted; the selected official Factory artifact
  and viem architecture remains unchanged.
- No active lane owns either exact M44-T030 path. M47, B03-T020, S22, and S24
  remain disjoint.
- A separate independent readiness review must authorize only
  `apps/web/tests/factory-deploy-bond.test.mjs` for durable RED. Source remains
  prohibited pending a separate independent RED review.

## Readiness review

The independent refreshed readiness review at
[M44-T030 readiness review](../../evidence/M44-T030-ready-review.md) is clear
at canonical `5a67a64f8d557b47361e3ab3c24588b136d55a44`. This card is
`10-ready`; a fresh activation may authorize only the durable test-only RED
path `apps/web/tests/factory-deploy-bond.test.mjs`. Source remains prohibited.

## Activation review

The independent activation review at
[M44-T030 activation review](../../evidence/M44-T030-activation-review.md) is
clear at canonical `9942da622f765b5247baf682db0a9247efe50d0f`. This card is
`20-active` only for durable RED in
`apps/web/tests/factory-deploy-bond.test.mjs`. The helper source remains
prohibited pending a separate independent RED review.

## RED review

The independent RED review at
[M44-T030 RED review](../../evidence/M44-T030-red-review.md) is clear for
delegated test-only `8053346d9aa25e666bf0fe14a12a767d9be3cdb7`: 9 focused
passes and 2 intended current-helper failures. This card may now amend only
`apps/web/src/lib/ats/factory-deploy-bond.ts` and
`apps/web/tests/factory-deploy-bond.test.mjs` for validate-then-lowercase
handling of a valid, decoded, non-zero event address. Trusted configuration
address parsing remains strict.

## GREEN acceptance

The independent [task review](../../evidence/M44-T030-task-review.md) and
[standards review](../../evidence/M44-T030-module-review-standards.md) are
clear. The minimal green source is merged at
`8d019e599c320d951197d3a405d5fa3969958380`; it validates a decoded address,
rejects zero, and only then lowercases the valid event value. The trusted
configuration parser remains unchanged.

Focused Factory tests, Web typecheck, the complete Web suite, root lint,
queue/reference/whitespace checks, and the enabled local-reference guard are
clear under Node 22.21.1. This card is accepted at `60-done`; it grants no
provider, wallet, RPC, transaction, deployment, or live authority.

## Verification

- RED uses the official Factory artifact to reproduce the valid mixed-case
  EIP-55 `BondDeployed` address rejection; it retains lower-case acceptance,
  zero-address rejection, malformed address/event rejection, wrong-event and
  malformed-topic rejection, and all existing `deployBond` encoding/artifact
  assertions.
- GREEN changes only the decoded-event address boundary. It validates before
  lowercase normalization and leaves the trusted configuration parser strict.
- Focused M44 tests, Web typecheck, relevant Web suite, lint, queue/reference/
  whitespace checks, enabled local-reference guard, and independent task plus
  module reviews pass before acceptance.

## Boundary

This is a local pure decode correction only. It authorizes no package or
architecture change, SDK/browser compatibility work, provider, wallet, RPC,
simulation, calldata send, transaction, candidate attachment, deployment,
Mirror read, finality claim, or live action.
