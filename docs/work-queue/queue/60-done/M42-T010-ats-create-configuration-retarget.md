# M42-T010 — ATS_CREATE configuration retarget

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M33-T010 accepted; M35-T010 accepted; M37-T010 accepted
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly:
  `packages/backend/src/ats/ats-create-configuration-v2.ts`,
  `packages/backend/src/ats/stage-b-issuer-ats-create-authority.ts`,
  `packages/backend/tests/ats-create-configuration-v2.test.mjs`, and
  `packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs`.
  All four paths are new, so this card requests no amendment of an accepted
  file and no root integration reservation.
- Human actions: HA-ATS-RETARGET-001 must be accepted, and must carry both
  recomputed digests, before the test-only RED. Provisioning the authority
  row, enabling an M33 mapping, and executing any SDK call remain
  HA-ATS-STAGE-B-001; the issuer account remains HA-ISSUER-ACCOUNT-001.
  This card completes no human action.

## Scope

Add two private Backend projections of the re-supplied `ATS_CREATE`
configuration for the SDK 8.0.0 testnet deployment, beside the accepted M35
and M37 projections and without touching them.

The local contract is the
[M42 specification](../../../specs/m42-ats-create-configuration-retarget.md).
The approved flow it serves is the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md),
requested through the
[HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md).

Exactly five values change from the accepted records:

```text
registryRevision   = ats_sdk_8_0_0_testnet_v2
expectedTarget     = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
factoryHederaId    = 0.0.9213391
resolverHederaId   = 0.0.9212226
resolverEvmAddress = 0xba2d5fc2083a0b8f164c50e65d782087fba18e0a
```

Every other descriptor, parameter, SDK identity, network, subject, and
authority value stays byte-equal to
[HA-ATS-CONFIGURATION-001](../../evidence/HA-ATS-CONFIGURATION-001-decision.md)
and
[HA-ATS-LIVE-AUTHORITY-001](../../evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md).
Both canonical digests change as a result; both are to be recorded by
HA-ATS-RETARGET-001 and are transcribed, never invented, by this card.

Both projections also return one added root field `canonicalParametersHash`,
each the transcribed digest that projection's own preimage check recomputes
on every call, as 64-character lowercase hexadecimal with no `0x` prefix. The
web workspace reads the web-facing subset of these values (`network`,
`chainId`, `subjectPublicId`, `offeringVersion`, `registryRevision`,
`operationKind`, `targetKind`, `expectedTarget`, `canonicalParametersHash`,
`factoryHederaId`, and `resolverHederaId`) as a frozen literal committed by
[S16-T010](./S16-T010-provider-deploy-wizard.md) at
`apps/web/src/components/provider/deploy/ats-create-configuration.ts` and
asserted field-for-field against the M42 specification by S16's focused test;
this card adds no web import and no public Backend export.

This card creates no schema, Convex function, public export, SDK dependency,
provider, wallet, account, transaction, or live evidence. M33 stays
zero-enabled and M32 durable admission is unchanged, so every `ATS_*` command
still fails closed.

## Why this card exists now

The accepted configuration in the
[M35 specification](../../../specs/m35-local-unsigned-ats-create-configuration.md)
and the
[M37 specification](../../../specs/m37-stage-a-real-issuer-ats-create-authority.md)
pins factory `0.0.7708432` and resolver `0.0.7707874`, the contracts v4.0.0
testnet deployment. HI-002 records that SDK 8.0.0 encodes `deployBond` with a
selector that this factory implementation does not dispatch, and that the
matching deployment is factory proxy `0.0.9213391` with resolver
`0.0.9212226`. On the accepted record Stage B cannot execute, so the
configuration is re-supplied rather than reinterpreted.

The two accepted projections stay exactly as accepted. Their digests are
bound to the v4 target and remain the correct answer for that target; a new
target needs a new record, not an edited one.

## Candidate ready requirements

- M33-T010, M35-T010, and M37-T010 remain accepted locally, and this card,
  the M42 specification, catalog, ownership, decision, and state records are
  committed before a RED test or source file.
- HA-ATS-RETARGET-001 is accepted and names the retargeted tuple above, the
  recomputed synthetic digest, and the recomputed real-issuer digest, each
  resolvable as a local evidence record.
- The four declared paths are new and disjoint from every active card. No
  accepted source, test, schema, barrel, package, or lockfile is eligible.
- The digest constants are transcribed from the accepted decision. If a
  runtime recomputation disagrees with a transcribed constant, the card stops
  and the root returns the mismatch to the human; the source is never
  reconciled to the computed value.
- An independent review of the committed authority finds no Critical,
  Important, or Minor finding before this card enters `10-ready`.

## Verification

- A durable test-only RED commit precedes both source files and fails only
  because the two declared private modules do not exist.
- Focused tests prove the exact retargeted literals, the transcribed digest
  equality on every call, the root `canonicalParametersHash` on each
  projection equal to its own recomputed digest, the eleven-field preimage
  order,
  signer-to-owner equality for the Stage B projection, full immutability,
  independent-call detachment, absence of any public Backend export, and no
  SDK, provider, wallet, environment, clock, storage, or network capability.
- Focused tests also prove that the accepted M35 and M37 sources, tests,
  digests, and targets are unchanged, and that M33's compiled manifest still
  has no enabled record.
- Focused Node commands from the repository root under Node 22.21.1:

  ~~~bash
  node --test packages/backend/tests/ats-create-configuration-v2.test.mjs
  node --test packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs
  ~~~

- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass.
- Independent task review and two fresh clean module-review generations
  report no Critical, Important, or Minor finding.

## Boundary

This card delivers two local source projections and their focused tests. It
enables no M33 mapping, provisions no `commandAuthorities` row, imports no
ATS SDK, initializes no network, constructs no request, connects no provider,
prompts no wallet, creates or funds no account, and submits no transaction.
It claims no asset, receipt, finality, deployment, or live behavior. Stage B
remains a separate human-owned gate.

## Acceptance

At source `2d211ed`, the focused M42 tests passed 8/8 and the complete Backend
suite passed 168/168 under Node 22.21.1. Backend/root quality,
queue/reference/whitespace/Git-guard checks, independent task review, and two
fresh independent module-review generations are clear. The two projections
remain private, frozen, detached, source-only configuration records; M33 stays
zero-enabled and Stage B remains separately human-owned.
