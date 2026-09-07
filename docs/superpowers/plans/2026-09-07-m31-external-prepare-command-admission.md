# M31 External-Prepare Command Admission Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox syntax for tracking.

**Goal:** Add one internal same-process adapter that authenticates through M30
and hands a frozen command snapshot to one injected atomic-admission boundary.

**Architecture:** The adapter never accepts an arbitrary structural normalized
DTO. It invokes the accepted M30 normalizer from the M25 claimed body, creates
a fresh frozen snapshot only on M30 success, and invokes exactly one injected
atomic boundary. The adapter returns only a closed frozen status token; it
does not implement Convex or durable storage. It accepts asynchronous outcomes
only through a captured native-Promise intrinsic, not generic thenable
assimilation.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 built-in test runner, accepted
M25/M26/M30 internal modules. No new package, Convex function, browser library,
configuration, or external SDK.

**Spec:** docs/specs/m31-external-prepare-command-admission.md

## Global constraints

- Modify only M31 queue/spec/plan/control records, one new internal backend
  ingress source, and one focused backend test.
- Invoke M30 itself from an M25 claimed body; never take an arbitrary
  structural normalized command as authenticated input.
- Accept only one callable injected atomic-admission boundary and invoke it at
  most once after M30 success.
- Pass one fresh frozen snapshot with no raw signature/body, provider,
  resolver record, target resolution, or external capability.
- Return only the four exact closed status tokens in a new frozen one-field
  result. Isolate thrown, rejected, malformed, accessor-backed, custom-
  prototype, extra-field, direct-thenable, proxy-wrapped-promise,
  species-poisoned-promise, and delayed-thenable boundary results without
  retrying. Do not use generic `await`, `Promise.resolve`, direct `.then`, or
  `instanceof` on the injected outcome.
- Do not add Convex, persistent replay/idempotency/attempt state, `PREPARED`,
  ATS, provider, wallet, funding, payment, transaction, deployment, or live
  behavior. Keep M24 through M30 and M04 unchanged.
- Keep the local reference guard enabled before every non-empty commit.

---

### Task 1: Test-only RED admission-handoff contract

**Files:**

- Create: `packages/backend/tests/external-prepare-command-admission.test.mjs`

**Interfaces:**

- Consumes the M30 command/body fixture pattern, M25 claimed-body helper, and
  the proposed internal `admitClaimedExternalPrepareCommand` function.
- Produces an executable proof that the M31 module does not exist before the
  test-only RED commit and that a later adapter must authenticate through M30.

- [ ] **Step 1: Build only public deterministic command fixtures.**

Reuse a public lower-case EIP-712 signature/address vector and the fixed M25
test HMAC seam from the M30 focused test pattern to build a real claimed body.
Supply one descriptor-safe enabled `ISSUER` authority record through M30's
injected resolver. Do not store or derive a private key, read configuration,
or make an account or provider call.

- [ ] **Step 2: Write the failing behavioral contract.**

Dynamically import the proposed source by file URL. With a valid claimed body,
server time, resolver, and atomic boundary, assert the boundary sees one
ordinary frozen snapshot with exactly `version`, `type`, `chainId`,
`canonicalSignerAddress`, `nonce`, `issuedAt`, `expiresAt`, `payloadHash`,
`replayIdentity`, `principalPublicId`, `role`, `authorityVersion`, and
`payload`; assert no raw signature or raw body is present. Assert each exact
status `NEW`, `COMMAND_REPLAYED`, `IDEMPOTENCY_REPLAYED`, and
`IDEMPOTENCY_CONFLICT` returns a new frozen `{ status }` result.

Pass a non-function boundary and assert M30's resolver is never called. Pass a
forged M25 candidate and every invalid command/payload case already rejected
by M30; assert the atomic boundary is never called. Assert a synchronous
throw, rejected promise, non-object, custom-prototype object, accessor-backed
status, extra field, and unsupported status return `null`, invoke the boundary
once at most, and never retry. Add direct-thenable, proxy-wrapped native
promise, species-poisoned native promise, and native promise with delayed
thenable fulfillment cases; each must return `null` after exactly one boundary
call and no retry.

- [ ] **Step 3: Add static scope checks.**

After source exists, read it and assert no `convex`, `fetch`, `process.env`,
`Date.now`, browser provider/wallet, storage/cache, ATS, payment, or external
SDK import is present; assert the backend public barrel does not export M31.

- [ ] **Step 4: Observe RED and commit only the test.**

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/external-prepare-command-admission.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
git add packages/backend/tests/external-prepare-command-admission.test.mjs
git commit -m "test: Add External Prepare Admission RED Contract"
```

Expected: the focused test fails only because the proposed internal M31 source
does not yet exist; existing backend typecheck remains green.

### Task 2: Minimal internal atomic-admission handoff

**Files:**

- Create: `packages/backend/src/ingress/external-prepare-command-admission.ts`
- Test: `packages/backend/tests/external-prepare-command-admission.test.mjs`

**Interfaces:**

- Consumes M30 `normalizeClaimedExternalPrepareCommand`, its authority resolver
  type, and the accepted M26 payload nested in M30's output.
- Produces only the internal types and function declared in the M31 spec.

- [ ] **Step 1: Validate the injected boundary before M30 work.**

Require `typeof atomicallyAdmit === "function"` before calling M30. Return
`null` otherwise. Invoke M30 only once with the original claimed body,
server-time value, and resolver; return `null` and never invoke the boundary
when M30 returns `null`.

- [ ] **Step 2: Build the detached admission snapshot.**

Copy every primitive and the accepted M26 payload from the successful M30
result into a fresh ordinary object with exactly the M31-declared fields.
Freeze the object and preserve the frozen M26 payload. Do not copy raw body,
raw signature, recovered value, resolver record, target/parameter authority,
or any injected dependency.

- [ ] **Step 3: Handle one closed injected outcome.**

Call the injected boundary exactly once. First capture a direct result through
own data-descriptor reflection: require an ordinary object with exactly one
enumerable `status` data field whose value is one of the four M31 literals.
For an asynchronous candidate, capture `NativePromise` and
`NativePromise.prototype.then` module-locally and call that intrinsic directly
on the candidate. Validate the fulfillment value inside the intrinsic callback
and resolve only its primitive approved status or `null` into a new native
wrapper promise. Do not use generic `await`, `Promise.resolve`, direct `.then`,
or `instanceof` on the candidate. Return a new frozen ordinary `{ status }`;
return `null` for throws, rejections, hostile reflection, direct thenables,
proxy-wrapped promises, species-poisoned promises, delayed thenable
fulfillment, or any other result. Do not retry.

- [ ] **Step 4: Verify GREEN and commit only source/test work.**

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/external-prepare-command-admission.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
git add packages/backend/src/ingress/external-prepare-command-admission.ts packages/backend/tests/external-prepare-command-admission.test.mjs
git commit -m "feat: Add External Prepare Admission Handoff"
```

### Task 3: Module verification and independent review

**Files:**

- Verify all M31 paths plus the M31 specification, card, and queue records.

- [ ] **Step 1: Run complete local quality gates.**

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
npm run queue:check
git diff --check
```

- [ ] **Step 2: Obtain an independent task review.**

Verify M30-only authentication, pre-normalizer callable validation, exact
snapshot/result shapes, one-call/no-retry handling, hostile injected-outcome
rejection, scope exclusions, and absence of a durability claim.

- [ ] **Step 3: Obtain two fresh module-review generations.**

Review Standards and specification conformance against the final exact module
head. Resolve every Critical, Important, and Minor finding. The root accepts
the card only after two consecutive fresh clean module reviews and records the
done transition in a separate root integration commit.
