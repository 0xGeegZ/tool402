# M48-T010 independent readiness review

## Scope

Independent current-head review at clean canonical
`816947e1529a49a87026db39aabf5549a6008c07` covered the M48 card,
specification, plan, accepted human decision, intake review, import ledger,
catalog, State, ownership, M32/M33/M42/M47 authorities, and active S22/S24
lanes.

## Findings

- M32-T010, M33-T010, M42-T010, and M47-T010 are each accepted at `60-done`.
- HA-ATS-M33-ENABLEMENT-001 is accepted and locally recorded. Its fixed
  M42/M47 tuple and canonical hash are unchanged.
- The candidate source still contains only `currentManifest = Object.freeze([])`;
  no enabled production mapping exists.
- M47 preserves the fixed order: M32 authority revalidation, M47 binding, M33,
  replay/idempotency. M48 cannot change it.
- S22/S24 own disjoint Web paths. No active worktree or source reservation
  overlaps M48's Backend candidate paths.
- Under Node 22.21.1, focused M33/M32 tests pass 32/32; `queue:check`, the
  reference guard, and whitespace validation are clear.

## Verdict

**CLEAR — move M48-T010 to `10-ready`.** A separate activation may authorize
durable test-only RED only in:

- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`

No production source is authorized. Future GREEN requires independent RED
acceptance and may be limited to `packages/backend/convex/ats_prepare_authority.ts`
plus matching changes to those two tests. M42/M47/M32 source/preimage/hash,
schema, exports, packages, lockfiles, Web/Agent, runtime configuration,
`commandAuthorities`, Convex publication, SDK/provider/wallet/RPC/Mirror,
request/calldata/asset/candidate/transaction/live paths remain prohibited.
