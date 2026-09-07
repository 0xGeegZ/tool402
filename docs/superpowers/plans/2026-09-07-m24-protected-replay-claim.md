# M24 Protected Replay Claim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the smallest internal capability adapter that forwards an
already verified replay identity to one injected claim boundary without
parsing a command, adding persistence, or making an external claim.

**Architecture:** M23 remains the sole cryptographic and membership authority.
M24 checks that exact M23 capability, calls one injected function with only the
canonical replay identity, and turns only literal `claimed` into a private,
frozen, same-process capability. Every other outcome is `null`.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 built-in test runner, and the
existing backend workspace. No dependency, generated output, configured store,
or runtime service is added.

**Spec:** `docs/specs/m24-protected-replay-claim.md`

## Global constraints

- Depend only on accepted M01-T030, M22-T010, and M23-T010 behavior. Do not
  reopen M22 lexical parsing or M23 verification behavior.
- Modify only `packages/backend/src/ingress/protected-replay-claim.ts` and
  `packages/backend/tests/protected-replay-claim.test.mjs` for implementation.
- Keep the adapter internal-only: do not amend `packages/backend/src/index.ts`.
- Use no local replay cache, Convex/database/store client, environment,
  configuration, HTTP/command input, key material, retry loop, network, or
  external action.
- Treat the injected claim function as a later durable-boundary seam. It is not
  evidence that a durable system exists, and a local fake cannot prove
  configured persistence.
- Keep the local reference guard enabled before every non-empty commit.

---

## Task 1: Test-only RED contract

**Files:**

- Create: `packages/backend/tests/protected-replay-claim.test.mjs`

- [ ] **Step 1: Define real M23 capability helpers.**

  Obtain a real M23 capability through its accepted fixed vector and injected
  non-extractable verification key. Do not construct a lookalike as a success
  fixture. Dynamically import the absent M24 module.

- [ ] **Step 2: Write focused RED cases.**

  Cover one exact injected identity/call and frozen claimed output; literal
  `already_claimed`, malformed, thrown, and rejected results; forged/copied/
  proxy verified candidates before a claim callback; structural claimed copies;
  and a static no-configuration/no-HTTP/no-command/no-storage boundary check.

- [ ] **Step 3: Observe and commit RED.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/backend/tests/protected-replay-claim.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/backend
  ```

  Expected: the focused test fails because the internal M24 module does not
  exist; backend typecheck remains green. Commit only the test:

  ```bash
  git add packages/backend/tests/protected-replay-claim.test.mjs
  git commit -m "test: Add Protected Replay Claim RED Contract"
  ```

---

## Task 2: Minimal internal adapter

**Files:**

- Create: `packages/backend/src/ingress/protected-replay-claim.ts`

- [ ] **Step 1: Check exact M23 membership first.**

  Import M23's internal membership guard and type. Reject every unregistered
  value before reading a capability field or calling the injected function.

- [ ] **Step 2: Attempt one injected claim and fail closed.**

  Require a function-valued port. Await exactly one call with M23's replay
  identity. Return `null` for every result other than literal `claimed`,
  including `already_claimed`, malformed values, throws, and rejections. Do
  not retain a replay identity outside a successful capability.

- [ ] **Step 3: Register only frozen minimal output.**

  Return a frozen `{ replayIdentity }` object and place it in a module-private
  `WeakSet`. Export its membership guard from the internal module only.

- [ ] **Step 4: Verify GREEN and commit.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/backend/tests/protected-replay-claim.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run lint --workspace @tool402/backend
  ```

  Review the diff to confirm that only declared source/test paths changed, then
  commit:

  ```bash
  git add packages/backend/src/ingress/protected-replay-claim.ts \
    packages/backend/tests/protected-replay-claim.test.mjs
  git commit -m "feat: Add Protected Replay Claim Adapter"
  ```

---

## Task 3: Integration evidence

- [ ] Run root typecheck, test, lint, clean-install dry run, queue check,
  reference guard, and whitespace check under Node 22.21.1.
- [ ] Obtain independent task review, then two fresh clean module-review
  generations at the final head.
- [ ] Record local acceptance only after all local checks pass. A configured
  durable claim implementation, deployment, or live replay proof remains a
  separately authorized future task.
