# M37-T010 — Stage A real-issuer ATS_CREATE authority integrity projection

## State

- Tier: CORE_P0
- Queue state: 60-done
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
the closed M35 configuration/preimage projection with only
`diamondOwnerAccount` replaced inside the M33 preimage. The four synthetic M35
root authority fields are intentionally excluded because the separate planned
authority tuple holds their real Stage A equivalents.
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

## Narrow resumption

At 2026-09-08T15:25:39Z, the human directed the root to finish ATS before the
later test. D-HI-001-005 therefore resumes only this local source-only M37
projection. It does not authorize an SDK, wallet, provider, network, Convex,
environment, authority row, M32/M33 change, asset, transaction, deployment, or
live ATS test.

The [fresh independent authority review](../../evidence/M37-T010-resumption-review.md)
at pushed `7e381fe58aaab85a4ef3437774200d3d625ed6c7` found no Critical, Important,
or Minor finding in the resumed, clarified source-only scope. M37 entered
`10-ready` before a fresh root ready-state rescan.

## Resumption activation

Activated at 2026-09-08T15:51:21Z after a fresh root rescan at pushed
`7a1d8e434daa8d5926b9b4e32d2e167ce3595878` confirmed M37 as the sole ready
card, accepted dependencies, exact origin/main equality, a clean worktree,
enabled guard, resolved local records, absent historical RED/source, zero-enabled
M33, and no M32/public import. An independent activation audit found no
blocking issue.

This activation authorizes only restoration and narrow evaluator-indirection
strengthening of the historical test-only RED contract under Node 22.21.1. It
does not authorize source, SDK/provider/wallet use, authority provisioning,
M32/M33 mutation, account action, transaction, asset creation, deployment, or
live evidence.

## RED acceptance

The restored and evaluator-hardened
[RED contract](../../evidence/M37-T010-red-review.md) was independently
reviewed under Node 22.21.1 at 2026-09-08T16:00:49Z. It fails exactly for the
absent declared private source and has no other failure. This authorizes only
the source file declared by this card; all runtime and external exclusions
remain in force.

## Local acceptance

Accepted at 2026-09-08T16:29:29Z after source commit
`5f745aa53801aaed763b62de2430c82708ebccb2`. The focused M37 contract
passed 5/5 under Node 22.21.1; Backend and root typecheck, test, lint, and
clean-install dry run passed; queue, local-reference, whitespace, and enabled
guard checks passed. The final
[task review](../../evidence/M37-T010-task-review.md) and two independent
module reviews
([standards](../../evidence/M37-T010-module-review-standards.md) and
[specification](../../evidence/M37-T010-module-review-spec.md)) found no
Critical, Important, or Minor finding.

This acceptance delivers only a local private integrity projection. It created
no authority row, enabled mapping, SDK/provider interaction, wallet prompt,
network call, asset, transaction, deployment, or live ATS result. A separate
human authorization remains required before any real testnet operation.

## Historical ready transition

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

## Historical activation

Activated at 2026-09-08T13:08:27Z after a fresh ready-state rescan at pushed
`63de6a128a18c2e15938fce2fc9fd4b757bf2698` confirmed M37-T010 as the sole
ready card; all declared dependencies remained accepted; exact origin/main
equality, a clean working tree, local references, an enabled guard, and no
active ownership conflict or new human blocker.

This activation authorizes only the committed test-only RED contract. It does
not authorize production source, authority provisioning, M33 enablement,
M32/schema mutation, SDK/provider/wallet interaction, storage, account action,
funding, payment, transaction, asset creation, deployment, or live evidence.

## Halt note

This lane was activated for its test-only RED contract and then halted under
`D-HI-001-003`, which parks ATS work before submission. The card, its contract,
its plan, and its authority review remain committed and unreverted.

Its RED contract at `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`
was removed from the default branch under `D-HI-001-004`, because the
implementation it imports will not land while the lane is halted and the
failing test would otherwise leave `main` red for every later branch. The file
remains in Git history at its commit. Resuming this lane starts by restoring it
from history, before any further work.
