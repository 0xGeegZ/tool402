# M48-T010 independent activation review

## Scope

Independent current-head activation review at clean canonical
`1c35f4c614d71ef27bdc9785c2ed3003e7fcb458` covered the accepted M48
readiness authority, M33/M42/M47 sources, focused M33/M32 baseline, active
S22/S24 scopes, and registered worktrees.

## Findings

- M32/M33/M42/M47 remain accepted; HA-ATS-M33-ENABLEMENT-001 remains locally
  recorded exactly as reviewed.
- M33's production `currentManifest` is still the frozen empty literal. No
  enabled source mapping exists.
- M42/M47 source blobs and the canonical M42 hash remain byte-identical to the
  ready baseline. M47 still orders M32 authority revalidation, M47 binding,
  M33, then replay/idempotency.
- S22/S24 own disjoint Web paths. No active worktree contains an uncommitted
  M48 candidate-path change.
- Focused Node 22.21.1 M33/M32 baseline passes 32/32.

## Verdict

**CLEAR — move M48-T010 to `20-active` for durable test-only RED only.** The
only authorized paths are:

- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`

Production source, M42/M47/M32 source/preimage/hash/schema/exports, packages,
lockfiles, Web/Agent, configuration, `commandAuthorities`, Convex publication,
SDK/provider/wallet/RPC/Mirror, requests/calldata/assets/candidates/
transactions/live paths remain prohibited pending independent RED acceptance.
