# M37-T010 source-only resumption review

## Scope

Independent review of the committed M37 resumption authority at
`7e381fe58aaab85a4ef3437774200d3d625ed6c7`:

- [M37 control card](../queue/60-done/M37-T010-stage-a-real-issuer-ats-create-authority.md)
- [M37 local specification](../../specs/m37-stage-a-real-issuer-ats-create-authority.md)
- [M37 implementation plan](../../superpowers/plans/2026-09-08-m37-stage-a-real-issuer-ats-create-authority.md)
- [M37 historical authority review](M37-T010-authority-review.md)
- [accepted Stage A decision](HA-ATS-LIVE-AUTHORITY-001-decision.md)
- [M36 Stage A authority review](M36-T010-authority-review.md)
- [M33 ATS prepare-authority contract](../../specs/m33-ats-prepare-authority-gate.md)
- [M32 durable admission contract](../../specs/m32-durable-external-prepare-admission.md)

## Independent checks

- Every declared dependency is accepted locally, local references resolve, the
  enabled local guard passes, and `npm run queue:check` passes.
- The approved real-owner RFC8785-JCS/Keccak-256 recomputation is exactly
  `d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250`.
- M37's source and RED paths remain absent. M33 remains zero-enabled, and
  M32 plus the Backend public barrel contain no M37 import.
- The amended card, specification, and plan consistently retain a private,
  no-input, source-only projection. They deliberately exclude M35's synthetic
  root authority fields, require direct literals, and require the restored RED
  to reject evaluator indirection including `eval` and `Function`.
- No SDK, provider, wallet, network, Convex, M32/M33 mutation, authority row,
  asset, transaction, deployment, or live ATS capability is introduced.

## Verdict

No Critical, Important, or Minor finding remains. M37-T010 is clear to move
from `00-inbox` to `10-ready`. A fresh root ready-state rescan and
activation are still required before the historical RED contract may be
restored and narrowly strengthened. This verdict does not authorize source,
runtime authority, or any external behavior.
