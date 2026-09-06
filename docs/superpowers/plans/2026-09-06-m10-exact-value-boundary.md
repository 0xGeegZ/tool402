# M10 Exact Value Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Add exact, canonical money and identifier parsing to the pure core
package without a payment or network side effect.

**Architecture:** A new pure `value.ts` module owns branded `bigint` values
and canonical identifier strings. The public core entry point re-exports the
module. Tests use the real exported functions and do not mock I/O because the
module has none.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3, and the built-in Node test
runner.

**Spec:** `docs/specs/m10-exact-value-boundary.md`

## Global Constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Use no dependency and no JavaScript `number` input for monetary values.
- Preserve exact `bigint` values and return `undefined` for malformed input.
- Keep the core package pure: no I/O, network, configuration, payment,
  account, signer, wallet, transaction, settlement, or live behavior.

---

### Task 1: Exact core values and identifiers

**Files:**

- Create: `packages/core/src/value.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/test/value.test.mjs`
- Create: `packages/core/test/value.types.ts`
- Modify: `packages/core/tsconfig.json`

**Interfaces:**

- Produces: `Tinybar`, `BasisPoints`, `NoteUnits`, `HederaAccountId`,
  `HederaTransactionId`, and their five parser functions from the core public
  entry point.

- [ ] **Step 1: Write the failing public-contract test**

  Add `packages/core/test/value.test.mjs`. Import the parsers from
  `../src/index.ts`. Assert that `"9007199254740993"` becomes exactly
  `9007199254740993n`, `"10000"` parses as basis points, canonical identifiers
  parse, and `"01"`, `"-1"`, `"1.5"`, `"1e3"`, whitespace-padded values,
  `"10001"` basis points, malformed identifiers, `0`, `null`, and `{}`
  return `undefined`.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/core/test/value.test.mjs
  ```

  Expected: FAIL because the public parsers do not exist.

- [ ] **Step 3: Implement the minimal pure boundary**

  Create the branded types and parsers described in the contract. Parse only
  canonical strings, accept `unknown` at every parser boundary, use `BigInt`
  only after canonical validation, and export the exact public API from
  `packages/core/src/index.ts`.

- [ ] **Step 4: Turn the contract GREEN**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/core/test/value.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/core
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/core
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/core
  ```

  The core workspace typecheck includes the public TypeScript consumer fixture:
  it imports all five parser/type pairs through `../src/index.ts`, proves each
  parser return assigns to its matching opaque type, and uses expected errors
  to prove the monetary and identifier brands are not interchangeable.

- [ ] **Step 5: Commit the implementation**

  Inspect only the owned paths, run the enabled guard and whitespace check,
  then commit:

  ```text
  feat: Add Exact Value Boundary
  ```

## Root-owned integration after Task 1

1. Obtain an independent task review from the implementation base through the
   implementation commit and resolve valid findings through a new RED/GREEN
   correction and scoped re-review.
2. Run root clean-install/typecheck/test/lint, queue/reference/whitespace
   checks, and the enabled local guard.
3. If review and verification are clean, record local evidence, accept the
   card, commit the acceptance, push, and verify remote `main`.
