# M16 Offering Terms and Revenue Math Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure, exact, versioned Core boundary for offering terms,
purchase quotations, remaining payout capacity, and capped 80/20 clearing
math.

**Architecture:** One new Core module consumes the accepted exact-value
parsers and produces immutable typed values. It has no runtime adapter; its
two public calculations take explicit, caller-supplied lifecycle facts and
return data only. A Node test and a compile-time fixture exercise the public
surface.

**Tech Stack:** TypeScript 5.9.3, Node 22.21.1, npm workspaces, and the
built-in Node test runner.

**Spec:** `docs/specs/m16-offering-terms-and-revenue-math.md`

## Global constraints

- Work in the current repository workspace; local policy prohibits a worktree
  without explicit human direction.
- Reuse only the public exact value parsers and brands from `@tool402/core`.
  Do not change their accepted source or semantics.
- Keep terms construction typed and local. Do not introduce a broad external
  schema parser, network configuration, environment read, storage, or I/O.
- Preserve exact `bigint` arithmetic and reject invalid business inputs; never
  add defaults, `number` conversion, or floating-point calculations.
- The only permitted revenue policy is reserve `2000` BPS, issuer `8000` BPS,
  platform fee `0` BPS, and a 3/2 payout cap derived from an even target.
- Do not add an ATS SDK, asset/account configuration, wallet, signer, key,
  funding/payment/transfer action, transaction, settlement verification,
  HCS event, reserve credit, payout, deployment, or live claim.

---

### Task 1: Write the public RED contract

**Files:**

- Create: `packages/core/test/offering-economics.test.mjs`
- Create: `packages/core/test/offering-economics.types.ts`

**Interfaces:**

- Consumes: existing public `parseTinybar`, `parseNoteUnits`, and
  `parseBasisPoints` brands.
- Produces: executable expectations for `createOfferingTerms`,
  `calculateAllocation`, `remainingPayoutCapacity`, and
  `calculateClearingSplit`.

- [ ] **Step 1: Write the failing runtime tests**

  Import the planned public functions from `@tool402/core`. Construct one
  valid even-target terms fixture using canonical string inputs. Assert the
  quote for a valid unit request, the exact remaining capacity, floor-rounded
  80/20 split, cap remainder, maturity all-issuer outcome, and exhausted-cap
  all-issuer outcome. Use the cap `150`, verified cumulative credits `100`,
  gross `100` vector to assert `remainingPayoutCapacity` is `50`, reserve is
  `20`, issuer is `80`, and a proposed reserve leg does not masquerade as a
  verified credit. Assert `RangeError` or `TypeError` for wrong share BPS,
  odd/inconsistent target-cap, blank version, below-minimum request,
  oversubscription, stale version, zero gross, and noncanonical input.

- [ ] **Step 2: Write the failing compile-time fixture**

  Import the planned public types/functions from `../src/index.ts`. Prove a
  constructed terms value and both result shapes use the existing branded
  values. Add `@ts-expect-error` assertions showing `Tinybar`, `NoteUnits`,
  and `BasisPoints` remain non-interchangeable.

- [ ] **Step 3: Run the focused RED contract**

  Run: `node --test packages/core/test/offering-economics.test.mjs`

  Expected: FAIL because the public functions/module do not yet exist.

### Task 2: Implement the exact pure Core boundary

**Files:**

- Create: `packages/core/src/offering-economics.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**

- Consumes: `parseTinybar`, `parseNoteUnits`, `parseBasisPoints`, and their
  branded types from `packages/core/src/value.ts`.
- Produces: the exact public interface recorded in the M16 specification.

- [ ] **Step 1: Implement terms construction**

  Parse each exact string with the existing functions, enforce positive
  business values, validate the exact BPS tuple and target/unit/cap equations,
  trim/bound the version, freeze the result, and throw a bounded business-input
  error on invalid input. Do not add an untrusted record-shape parser.

- [ ] **Step 2: Implement allocation and capacity calculations**

  Require the expected version match. Reject below-minimum, zero, or
  over-capacity requests. Return only exact requested units, exact product,
  and post-request remaining capacity. Return `max(cap - cumulative, 0)` for
  remaining payout capacity without creating a credit; do not reduce it by a
  proposed reserve leg.

- [ ] **Step 3: Implement capped clearing math**

  Require a positive verified gross amount and a matching version. Compute
  floor reserve from `gross * 2000 / 10000`, cap it by remaining capacity, and
  set the issuer leg to the exact remainder. Return a zero reserve/full issuer
  outcome when maturity is explicit or capacity is exhausted.

- [ ] **Step 4: Export the public surface and run GREEN**

  Re-export only the planned values/functions from `packages/core/src/index.ts`.
  Run: `node --test packages/core/test/offering-economics.test.mjs`

  Expected: PASS with every focused assertion green.

### Task 3: Verify the public pure contract

**Files:**

- Verify: `packages/core/test/offering-economics.test.mjs`
- Verify: `packages/core/test/offering-economics.types.ts`
- Verify: `packages/core/src/offering-economics.ts`

- [ ] **Step 1: Run focused and complete Core validation**

  Run:

  ```bash
  node --test packages/core/test/offering-economics.test.mjs
  npm run typecheck --workspace @tool402/core
  npm run test --workspace @tool402/core
  npm run lint --workspace @tool402/core
  ```

- [ ] **Step 2: Verify source boundaries**

  Inspect the new module/test sources for prohibited SDK, network, wallet,
  signer, account/asset, transaction, persistence, configuration, HCS, and
  live-claim behavior. Confirm each public calculation is deterministic and
  preserves the gross-leg identity.

- [ ] **Step 3: Run root integration validation**

  Run the repository typecheck/test/lint, clean-install dry run, queue check,
  whitespace check, and enabled local-reference guard. Obtain independent task
  review and two fresh clean module-review generations before acceptance.
