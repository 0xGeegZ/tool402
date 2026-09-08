# Stage A Real-Issuer ATS_CREATE Authority Integrity Projection Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Deliver one private, deterministic, frozen projection that binds the
accepted Stage A real issuer to the exact local ATS_CREATE configuration without
creating a runtime authority or any execution capability.

**Architecture:** A no-argument Backend helper builds fresh direct literals for
the unprovisioned authority tuple and closed configuration. It asserts
signer/owner equality, recomputes the M33 canonical hash through the accepted
Core canonicalizer and direct `viem` Keccak utility, then freezes and returns
the data. It does not import M35, so M35's synthetic projection remains
non-authoritative.

**Tech stack:** TypeScript, Node built-in test runner, `@tool402/core`, viem
2.56.1.

**Spec:** `docs/specs/m37-stage-a-real-issuer-ats-create-authority.md`

## Global constraints

- Use the approved real issuer and exact canonical hash
  `d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250`.
- Copy the accepted M35 M33-preimage values and non-authority configuration
  metadata as direct literals, changing only
  `parameters.diamondOwnerAccount`. Deliberately exclude M35's four
  synthetic root authority fields because `plannedCommandAuthority` holds the
  real tuple; do not import M35 at runtime.
- The helper has no input and returns only fresh frozen data; no mutable data
  may be shared between calls.
- Do not modify M35, M32, M33, Convex, public barrels, packages, lockfiles,
  existing source/tests, configuration, environment, Web/UI, or Agent paths.
- Do not import the ATS SDK or call SDK/provider/wallet/network/storage/HTTP/
  external APIs. M33 must remain zero-enabled. Do not use `eval`,
  `Function`, dynamic import, or import-meta indirection.
- A source-only projection does not provision `commandAuthorities` or establish
  runtime signer-to-owner enforcement.

---

## Task 1: Record the executable RED contract

**Files:**

- Create: `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`

**Interfaces:**

- Consumes: the absent private projection module, Core `canonicalizeRequirements`,
  and `viem` `keccak256(stringToHex(...))`.
- Produces: the expected direct module interface
  `createStageARealIssuerAtsCreateAuthority()` and its static boundary
  regression suite.

- [ ] Restore the historical direct-import test and narrowly strengthen its
  static evaluator-indirection assertion for `eval` and `Function`; its
  only expected runtime export is the helper, and it must be RED solely
  because the private source does not exist.
- [ ] Define exact assertions for the full authority tuple, closed M35-copy
  configuration, real canonical hash, and signer/owner equality. Independently
  recompute the eleven-field JCS/Keccak preimage in the test.
- [ ] Add negative boundary assertions: M35 differs only in owner at the M33
  preimage, M35 synthetic owner/hash are absent, every returned nested value is
  frozen/detached, no public export exists, M33 remains zero-enabled, M32/M33
  do not import this module, and no SDK/Convex/environment/provider/wallet/
  network/storage/evaluator capability appears.
- [ ] Run the focused test under Node 22.21.1, observe the missing-module
  failure, independently review the RED, then commit and push it before source.

## Task 2: Add the minimal frozen integrity projection

**Files:**

- Create: `packages/backend/src/ats/stage-a-real-issuer-ats-create-authority.ts`
- Test: `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`

**Interfaces:**

- Consumes: `canonicalizeRequirements` from `@tool402/core` and `keccak256`,
  `stringToHex` from the existing `viem` dependency.
- Produces: `createStageARealIssuerAtsCreateAuthority()` from the private
  source only.

- [ ] Declare literal result types that distinguish a planned/unprovisioned
  authority from a Convex record.
- [ ] Build fresh frozen descriptor, parameters, and authority tuple with
  direct literals only. Assert canonical signer equals `diamondOwnerAccount`.
- [ ] Recompute the eleven-field canonical hash on every call and throw unless
  it equals the approved exact digest. Return only a fresh frozen root.
- [ ] Run the focused test and Backend typecheck, then commit and push the
  minimum GREEN implementation.

## Task 3: Verify the private boundary

**Files:**

- Test: `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`

- [ ] Run focused and full Backend/root typecheck, tests, and lint under Node
  22.21.1; run clean-install dry run, queue/reference/whitespace checks, and
  the enabled local guard.
- [ ] Obtain an independent task review, address every valid Critical or
  Important finding through the focused test contract, then obtain two fresh
  clean module-review generations after production source is final.
- [ ] Record only secret-free evidence, accept the card only after all scoped
  evidence passes, and keep Stage B / runtime authority as a separate gate.
