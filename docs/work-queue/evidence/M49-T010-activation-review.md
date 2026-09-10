# M49-T010 independent activation review

## Scope

Independent current-head activation review at clean canonical
`7ba415b75b6acca0550d6c9100adf87d0b817b6a` covered M49's accepted readiness
authority, all eight declared dependencies, M42/M44/M47/M48 boundaries, the
M49 candidate paths, S22/S24 active scopes, S26/S27 inbox reservations, and
the HI-010 intake.

## Findings

- The readiness authority remains intact: all eight dependencies are accepted,
  the M42 digest remains unchanged, and M44/M47 have no active reservation.
- Both new M49 source modules and all three new tests remain absent. The two
  amended existing tests and all UI paths remain outside RED.
- S22/S24 are disjoint. S26/S27 and HI-010 have no active conflicting source
  scope; M49 retains CORE_P0 precedence over S26's signing-island reservation.
- `npm run queue:check`, whitespace validation, and the enabled local-reference
  guard are clear. Under Node 22.21.1, the focused accepted seam baseline passes
  25/25.

## Verdict

**CLEAR — move M49-T010 to `20-active` for durable test-only RED only.** The
only authorized paths are:

- `apps/web/tests/stage-b-ats-create-execution-projection.test.mjs`
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`
- `apps/web/tests/ats-create-action.test.mjs`
- `apps/web/tests/ats-contracts-bundle-gate.test.mjs`
- `apps/web/tests/deploy-stage-signing.test.mjs`

All source modules/components, M42/M44/M47/M48 source, Backend/Convex,
packages, lockfiles, environment/configuration, keys, provider/wallet/RPC/
network requests, transaction, Mirror observation, candidate attachment, M43
verification, lifecycle, deployment, and every live path remain prohibited
pending independent RED acceptance.
