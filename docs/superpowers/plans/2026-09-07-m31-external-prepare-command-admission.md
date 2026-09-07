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
does not implement Convex or durable storage. It accepts only a direct
synchronous injected outcome; a later durable card must separately define any
asynchronous completion protocol and provenance.

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
  result. Isolate thrown, malformed, accessor-backed, custom-prototype,
  extra-field, and normally reflected direct-thenable/Promise forms that fail
  the exact direct shape, without retrying. A pre-handled rejected Promise is
  an invalid nonacceptance check only. Do not use `await`, `Promise.resolve`,
  direct `.then`, `instanceof`, or native-Promise internals on the injected
  outcome.
  Never retain or propagate its caller object; portable reflection may not
  distinguish a transparent proxy that presents the exact detached direct
  status shape, which is still data only and never async provenance.
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
throw, pre-handled rejected promise, non-object, custom-prototype object,
accessor-backed status, extra field, and unsupported status return `null`,
invoke the boundary once at most, and never retry. Add direct-thenable, proxy-wrapped native
promise, species-poisoned native promise, fulfilled native promise, async
function result, and native promise with delayed thenable fulfillment cases;
each must return `null` after exactly one boundary call and no retry.

Use a pre-handled rejected Promise only to prove no accepted adapter output;
do not claim this module observes or suppresses host-level unhandled rejection
behavior. A transparent proxy that presents the exact detached status shape is
not separately distinguishable through portable reflection and must not be
misrepresented as an async completion test.

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
Do not inspect or await a non-direct candidate. Return a new frozen ordinary
`{ status }`; return `null` for throws, results that fail the exact direct
descriptor-safe shape, hostile reflection, and normally reflected direct
thenables or Promise forms. Do not retry, read/invoke a `then`, retain the
caller object, or claim portable reflection distinguishes a transparent proxy
that presents the same exact direct data. Injection failures must throw
synchronously or return an invalid direct value; rejected/asynchronous returns
are out of this port's contract and are not host-level rejection handling.
M31 intentionally defines no asynchronous completion protocol; a future
durable card must define its own adapter-owned/branded protocol plus timeout
and recovery semantics before it accepts one.

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

## Post-acceptance durable-replay clarification

Recorded at 2026-09-07T22:58:27Z for M32's separately reviewed durable
data-plane authority. This historical M31 plan and the accepted synchronous
source remain unchanged. Only the future durable contract is clarified: after
complete serialized-input and current-authority validation, each fresh valid
replay identity is claimed atomically. `NEW` alone creates a `PREPARED`
attempt; exact idempotency replay claims the fresh identity linked to the
existing attempt; conflict claims it without an attempt link; later reuse is
`COMMAND_REPLAYED` before idempotency handling. No external behavior is
authorized by this documentation-only clarification.
