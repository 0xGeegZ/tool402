# M37-T010 — Stage A real-issuer ATS_CREATE authority integrity projection

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T030 accepted; M32-T010 accepted; M33-T010 accepted;
  M35-T010 accepted; M36-T010 accepted
- Owner: The root owns this card, local specification, local import-ledger
  row, implementation plan, queue state, catalog, ownership record, decision
  records, integration, commits, and pushes. The only planned implementation
  paths are one new private Backend source file and one focused Backend test.
- Human action: HA-ATS-LIVE-AUTHORITY-001 is accepted only for this source-only
  Stage A integrity projection. A later separately reviewed runtime amendment
  and a distinct Stage B Human Ops GO remain required before provisioning or
  any executable ATS behavior.

## Scope

Create exactly the private no-argument integrity projection defined in the
[M37 local specification](../../../specs/m37-stage-a-real-issuer-ats-create-authority.md)
and its
[implementation plan](../../../superpowers/plans/2026-09-08-m37-stage-a-real-issuer-ats-create-authority.md).
It must return fresh frozen data for the accepted real-issuer Stage A tuple and
the closed M35 configuration copy with only `diamondOwnerAccount` replaced.
It must recompute the exact M33 canonical hash and reject source drift before
returning.

It must not accept runtime input or expose a public Backend export. It must
not modify M35, M33's zero-enabled manifest, M32 durable admission, Convex,
public barrels, packages, lockfiles, existing implementation/tests,
configuration, environment, Web/UI, or Agent source.

## Candidate ready requirements

- M01-T030, M32-T010, M33-T010, M35-T010, and M36-T010 remain accepted
  locally.
- This card, specification, import-ledger row, plan, catalog, ownership,
  decisions, and state records are committed before a RED test or source file.
- The accepted Stage A decision and independent M36 review remain resolvable
  local records. The exact real issuer, signer/owner equality, and canonical
  hash are fixed.
- A fresh independent authority review finds no Critical, Important, or Minor
  finding in this committed source-only scope before this card enters 10-ready.

## Validation

- A test-only RED contract precedes the source and proves the absent private
  helper, exact planned/unprovisioned tuple, exact configuration/hash,
  signer/owner equality, frozen detached output, independent calls, no public
  export, M35 non-reuse, M33 zero-enabled state, and prohibited capabilities.
- The focused command is `node --test
  packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`
  from the repository root under Node 22.21.1.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-08T12:44:52Z after a fresh root rescan at pushed
`3cfcca0214cdf2b9a8c86a953a7e877e1f41099b`. The root confirmed all declared
dependencies accepted, no active lane or ownership conflict, a clean working
tree, exact origin/main equality, resolvable local authority records, and an
enabled local guard. The only dependency-correct successor is this private
source-only integrity projection; execution, durable admission, M33 enablement,
and external behavior remain separately gated.

This inbox state authorized only committed local authority and independent
review. It authorized neither RED/code nor SDK import/init, request
construction, provider/wallet interaction, authority provisioning, M33
enablement, M32 mutation, storage, account action, funding, payment,
transaction, asset creation, deployment, or live evidence.

## Ready transition

Ready at 2026-09-08T13:05:36Z after a fresh root rescan at pushed
`742b6524e151565456732041b9e97e5650541cee` confirmed all declared
dependencies accepted, no active lane or ownership conflict, exact origin/main
equality, resolvable local records, and an enabled local guard. The final
independent review at
[M37-T010 authority review](../../evidence/M37-T010-authority-review.md)
found no Critical, Important, or Minor finding after the accepted decision
status correction.

This ready state authorized only root activation followed by the committed
test-only RED contract. It did not authorize source, authority provisioning,
M33 enablement, M32/schema mutation, SDK/provider/wallet interaction, storage,
account action, funding, payment, transaction, asset creation, deployment, or
live evidence.

## Activation

Activated at 2026-09-08T13:08:27Z after a fresh ready-state rescan at pushed
`63de6a128a18c2e15938fce2fc9fd4b757bf2698` confirmed M37-T010 as the sole
ready card; all declared dependencies remained accepted; exact origin/main
equality, a clean working tree, local references, an enabled guard, and no
active ownership conflict or new human blocker.

This activation authorizes only the committed test-only RED contract. It does
not authorize production source, authority provisioning, M33 enablement,
M32/schema mutation, SDK/provider/wallet interaction, storage, account action,
funding, payment, transaction, asset creation, deployment, or live evidence.
