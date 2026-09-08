# Local Unsigned ATS_CREATE Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one private, deterministic, frozen projection of the accepted local unsigned ATS_CREATE configuration.

**Architecture:** A no-argument Backend helper builds fresh descriptor and parameter literals, recomputes the local M33 canonical hash through the existing Core canonicalizer and direct `viem` Keccak utility, then freezes and returns the projection. It remains private to Backend source so it cannot become an application command or M33 enabled mapping.

**Tech Stack:** TypeScript, Node built-in test runner, `@tool402/core`, viem 2.56.1.

**Spec:** `docs/specs/m35-local-unsigned-ats-create-configuration.md`

## Global Constraints

- Use exactly the accepted `REG_S / NONE` parameters (`regulationType: 1`, `regulationSubType: 0`) and canonical hash `eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f`.
- The helper has no input and returns only fresh frozen data; no mutable data may be shared between calls.
- Do not modify M33, M32, Convex, public barrels, packages, lockfiles, existing source/tests, configuration, environment, Web/UI, or Agent paths.
- Do not import the ATS SDK or call SDK/provider/wallet/network/storage/HTTP/external APIs.
- A local unsigned projection does not enable M33 and cannot authorize execution.

---

### Task 1: Record the executable RED contract

**Files:**

- Create: `packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs`

**Interfaces:**

- Consumes: the absent private module at `packages/backend/src/ats/local-unsigned-ats-create-configuration.ts`, Core `canonicalizeRequirements`, and `viem` `keccak256(stringToHex(...))`.
- Produces: the expected direct module interface `createLocalUnsignedAtsCreateConfiguration()` and the full static boundary regression suite.

- [ ] **Step 1: Write the failing direct-import test.**

  Import this exact URL at module scope:

  ```js
  const sourceUrl = new URL(
    "../src/ats/local-unsigned-ats-create-configuration.ts",
    import.meta.url,
  );
  const configuration = await import(sourceUrl.href);
  ```

  Assert that the only runtime export is
  `createLocalUnsignedAtsCreateConfiguration`. The test is RED because the
  source file does not yet exist.

- [ ] **Step 2: Define the exact output contract.**

  Call the helper and assert every top-level literal from the specification,
  the closed descriptor, every closed parameter including
  `regulationType: 1` / `regulationSubType: 0`, and the exact expected hash.
  Build this test-only preimage from returned values:

  ```js
  const preimage = {
    protocol: configuration.protocol,
    network: configuration.network,
    chainId: configuration.chainId,
    subjectPublicId: configuration.subjectPublicId,
    offeringVersion: configuration.offeringVersion,
    registryRevision: configuration.registryRevision,
    operationKind: configuration.operationKind,
    targetKind: configuration.targetKind,
    expectedTarget: configuration.expectedTarget,
    operationDescriptor: configuration.operationDescriptor,
    parameters: configuration.parameters,
  };
  assert.equal(
    keccak256(stringToHex(canonicalizeRequirements(preimage))).slice(2),
    "eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f",
  );
  ```

- [ ] **Step 3: Add snapshot and no-capability regressions.**

  Assert the root, descriptor, parameters, and all six nested arrays are
  frozen. Call the helper twice and assert equal data but distinct root,
  descriptor, parameter, and array identities. Read the source and assert it
  has no ATS SDK import, provider/wallet, M33/M32/authority, environment,
  HTTP, storage, or external invocation pattern. Read `packages/backend/package.json`
  and assert it has no ATS SDK dependency; read the Backend public barrel and
  assert it does not name the helper.

- [ ] **Step 4: Observe and commit RED.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs
  git add packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs
  git commit -m "test: Cover Local Unsigned ATS Configuration"
  git push origin main
  ```

  Expected: module-not-found failure caused only by the absent private source.

### Task 2: Add the minimal frozen configuration helper

**Files:**

- Create: `packages/backend/src/ats/local-unsigned-ats-create-configuration.ts`
- Test: `packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs`

**Interfaces:**

- Consumes: `canonicalizeRequirements` from `@tool402/core` and `keccak256`, `stringToHex` from the already installed exact `viem` dependency.
- Produces: `createLocalUnsignedAtsCreateConfiguration(): LocalUnsignedAtsCreateConfiguration` from the private source only.

- [ ] **Step 1: Declare the literal result types.**

  Declare `LocalUnsignedAtsCreateOperationDescriptor`,
  `LocalUnsignedAtsCreateParameters`, and
  `LocalUnsignedAtsCreateConfiguration` in the new private module. Give every
  fixed configuration literal its exact literal type, including the amended
  `1` / `0` regulation pair and the returned hash. Do not add a public-barrel
  export.

- [ ] **Step 2: Build fresh frozen descriptor and parameters.**

  Create the descriptor and parameters with only the exact fields in the
  specification. Freeze `omittedOptionalFields`, all five external/proceed
  arrays, then their owners. Do not copy input because the helper accepts no
  input.

- [ ] **Step 3: Recompute and assert the canonical binding.**

  Build the eleven-field preimage shown in Task 1 from the fresh values. Use:

  ```ts
  const canonicalParametersHash = keccak256(
    stringToHex(canonicalizeRequirements(preimage)),
  ).slice(2);
  if (canonicalParametersHash !== EXPECTED_CANONICAL_PARAMETERS_HASH) {
    throw new TypeError("invalid local unsigned ATS configuration");
  }
  ```

  Return one frozen root containing the fixed issuer, SDK identity, resolver,
  M20 `NONE` binding, descriptor, parameters, and verified hash.

- [ ] **Step 4: Verify GREEN and commit.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/backend
  git add packages/backend/src/ats/local-unsigned-ats-create-configuration.ts \
    packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs
  git commit -m "feat: Add Local Unsigned ATS Configuration"
  git push origin main
  ```

### Task 3: Verify the module boundary

**Files:**

- Test: `packages/backend/tests/local-unsigned-ats-create-configuration.test.mjs`

- [ ] **Step 1: Run focused and package validation.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run lint --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run lint
  npm ci --dry-run --ignore-scripts --loglevel=error
  npm run queue:check
  git diff --check
  .git/tool402-local-guards/reference-check --staged
  ```

- [ ] **Step 2: Obtain independent task and module reviews.**

  Review the complete M35 diff against the local specification and card.
  Fix every valid Critical or Important finding through the same focused test
  contract. Obtain two fresh clean module-review generations after production
  source is final.
