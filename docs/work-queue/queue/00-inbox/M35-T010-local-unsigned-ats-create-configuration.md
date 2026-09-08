# M35-T010 — Local unsigned ATS_CREATE configuration projection

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T030 accepted; M20-T010 accepted; M33-T010 accepted;
  M34-T010 accepted
- Owner: The root owns this card, local specification, local import-ledger
  row, implementation plan, queue state, catalog, ownership record, decision
  records, integration, commits, and pushes. The only implementation paths
  are one new private Backend source file and one new focused Backend test.
- Human actions: HA-ATS-CONFIGURATION-001 is accepted only for this local
  unsigned projection. A later explicit human execution gate remains required
  for a real issuer, M33 enablement, SDK/provider use, account action,
  transaction, or live behavior.

## Scope

Create exactly the private no-argument configuration projection defined in the
[M35 local specification](../../../specs/m35-local-unsigned-ats-create-configuration.md)
and its
[implementation plan](../../../superpowers/plans/2026-09-08-m35-local-unsigned-ats-create-configuration.md).
It returns fresh frozen data for the one accepted `ATS_CREATE` testnet
configuration and recomputes the exact M33 canonical hash before returning.

It must not accept runtime input or expose a public Backend export. It must
not modify M33's zero-enabled manifest, M32 durable admission, Convex, public
barrels, packages, lockfiles, existing implementation/tests, configuration,
environment, Web/UI, or Agent source.

## Candidate ready requirements

- M01-T030, M20-T010, M33-T010, and M34-T010 remain accepted locally.
- This card, specification, import-ledger row, plan, catalog, ownership,
  decisions, and state records are committed before a RED test or source file.
- The accepted decision and independent M34 review remain resolvable local
  records. The exact `REG_S / NONE` pair and the exact amended hash are fixed.
- A fresh independent authority review finds no Critical, Important, or Minor
  finding in this committed local-only scope before this card enters 10-ready.

## Validation

- A test-only RED contract precedes the source and proves the absent private
  helper, exact projection/hash, frozen detached output, independent calls,
  no public export, no SDK dependency, and no prohibited capabilities.
- The focused command is `node --test
  packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs`
  from the repository root under Node 22.21.1.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-08T10:53:22Z after the pushed M34 closure at
`128adbac4991e718c211eb2cd93d7767fb7aafe8`. The root rescan confirmed all
declared dependencies accepted, no active lane or ownership conflict, a clean
working tree, exact origin/main equality, resolvable local authority records,
and an enabled local guard. The only dependency-correct successor is this
local unsigned projection; execution, durable admission, M33 enablement, and
external behavior remain separately gated.

This inbox state authorizes only committed local authority and independent
review. It authorizes neither RED/code nor SDK import/init, request
construction, provider/wallet interaction, authority provisioning, M33
enablement, M32 mutation, storage, account action, funding, payment,
transaction, asset creation, deployment, or live evidence.
