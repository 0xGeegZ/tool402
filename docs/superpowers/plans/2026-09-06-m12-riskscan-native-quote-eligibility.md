# M12 Native Quote Eligibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Add a pure, exact native-quote eligibility decision for a
caller-provided RiskScan policy, without creating payment authority.

**Architecture:** One new core module validates strict unknown policy and
quote records through the accepted canonical parsers, then returns a small
fresh discriminated union. The public core entry point re-exports its values
and types. Tests exercise the real public API and use no mocks because the
module has no side effects.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3, and the built-in Node test
runner.

**Spec:** `docs/specs/m12-riskscan-native-quote-eligibility.md`

## Global constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Reuse the accepted generic `parseNoteUnits` and Hedera-identifier syntax
  parsers; rebrand successful parses only inside this module as a
  `RiskScanNativeAtomicAmount` and `RiskScanNativeAssetId`. Never convert an
  amount through JavaScript `number`. `Tinybar` remains reserved for an
  explicitly HBAR-only path, and `HederaAccountId` remains a recipient-account
  brand rather than an asset brand.
- Add no dependency, configuration read, I/O, payment protocol, client,
  signer, wallet/account action, transaction, settlement, or live behavior.
- Do not choose an economic cap or retain untrusted input references.

---

### Task 1: Exact local eligibility boundary

**Files:**

- Create: `packages/core/src/riskscan-native-quote-eligibility.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/test/riskscan-native-quote-eligibility.test.mjs`
- Create: `packages/core/test/riskscan-native-quote-eligibility.types.ts`

**Interfaces:**

- Consumes: accepted `parseNoteUnits` and `parseHederaAccountId` public
  values.
- Produces: `evaluateRiskScanNativeQuote`, bounded decline reasons, and a
  narrowed eligible result with exact public asset and atomic-amount brands.

- [ ] **Step 1: Write the failing public-contract tests**

  Add the focused runtime test and public type fixture. Through
  `../src/index.ts`, assert that a canonical testnet quote at or below an
  explicit caller cap is eligible and retains a bigint beyond
  `Number.MAX_SAFE_INTEGER`. Assert that invalid policy, invalid quote,
  network mismatch, asset mismatch, and cap excess each return their exact
  decline reason. Add malformed/hostile record cases, including accessors
  whose getters must not run, an inherited required field, symbol and
  non-enumerable extra own keys, and valid own fields on null/custom
  prototypes. Add a descriptor-valid Proxy whose `get` trap must never run.
  Add precedence cases: invalid policy paired with a quote Proxy whose
  reflection traps throw returns `invalid_policy` without inspecting the
  quote; a throwing policy prototype/reflection returns `invalid_policy`; and
  a valid policy paired with a throwing quote prototype/reflection returns
  `invalid_quote`. In the public TypeScript fixture, assert that an eligible
  result exposes the local asset and atomic-amount brands and that each is
  distinct from the accepted identifier and generic-integer parser brands.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/core/test/riskscan-native-quote-eligibility.test.mjs
  ```

  Expected: FAIL because the public eligibility export does not exist.

- [ ] **Step 3: Implement the smallest pure evaluator**

  Add strict safe-record snapshotting through a plain-object prototype check,
  `Reflect.ownKeys`, and own data descriptors, exact parser reuse, and only
  the five declared decline reasons. Validate policy before inspecting the
  quote. Use only captured descriptor values after snapshotting. Return a
  fresh union with canonical exact asset and atomic-amount branded values only
  for `eligible`; never default a cap or construct a payment-shaped object.

- [ ] **Step 4: Turn the contract GREEN**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/core/test/riskscan-native-quote-eligibility.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/core
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/core
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/core
  ```

- [ ] **Step 5: Commit the implementation**

  Inspect only the owned paths, run the enabled guard and whitespace check,
  then commit:

  ```text
  feat: Add Native Quote Eligibility
  ```

## Root-owned integration after Task 1

1. Obtain independent task review from the implementation base through the
   implementation commit; resolve valid findings with a new RED/GREEN
   correction and scoped re-review.
2. Run root clean-install/typecheck/test/lint, queue/reference/whitespace
   checks, and the enabled local guard.
3. If review and verification are clean, record local evidence, accept the
   card, commit the acceptance, push, and verify remote `main`.
