# M48 ATS M33 local enablement plan

> **For agentic workers:** use `superpowers:subagent-driven-development` and
> `superpowers:test-driven-development`. Keep this work isolated from the
> active S22 and S24 Web lanes.

**Goal:** Replace M33's empty compiled manifest with the one accepted M42/M47
`ATS_CREATE` record while preserving fail-closed matching and every live-action
boundary.

**Spec:** `docs/specs/m48-ats-m33-enablement.md`

## Constraints

- Preserve the exact M42 preimage and canonical hash.
- Do not change M47/M32 ordering, schema, exports, packages, environment, or
  Web/Agent source.
- Do not create/provision `commandAuthorities`, publish Convex, access wallet,
  provider, SDK, RPC, Mirror, configuration, or any live action.
- A fresh readiness review and a separate activation are required before RED;
  source stays prohibited until independently accepted RED.

## Task 1: durable RED contract

**Files:**

- `packages/backend/tests/ats-prepare-authority.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`

- [ ] Add a production-manifest contract that accepts only the exact M42/M47
  `ATS_CREATE` tuple and exact canonical hash.
- [ ] Prove every other ATS kind and all subject/target/hash drift reject.
- [ ] Amend the M32 admission contract from the historical zero-enabled
  assertion to the exact M42/M47 path, preserving M47 then M33 then replay and
  idempotency ordering and fail-before-durable-access behavior for drift.
- [ ] Run the two focused tests and confirm failures arise only from M33's
  currently empty production manifest. Commit the test-only RED change.

## Task 2: minimum compiled manifest

**Files:**

- `packages/backend/convex/ats_prepare_authority.ts`
- the two Task 1 tests
- `packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs`

- [ ] Replace only the frozen empty `currentManifest` with one immutable
  descriptor-safe literal containing the accepted record.
- [ ] Keep `HEDERA_FUNDING` bypass and all existing direct-test semantics.
- [ ] Retire only M42's historical empty-manifest assertion; preserve its
  preimage, digest, privacy, no-SDK-dependency, and no-M42-import checks.
- [ ] Run focused tests and Backend typecheck. Confirm no new imports,
  external capability, or runtime configuration appear. Commit GREEN.

## Task 3: verification and acceptance

- [ ] Run focused M33/M32 tests, complete Backend tests, Backend typecheck,
  root lint, queue validation, whitespace, and the enabled reference guard.
- [ ] Obtain independent task and module reviews. Record acceptance only when
  the complete mapping remains local-only and all live gates remain pending.
