# M25 Claimed Protected Body Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind the exact raw bytes authenticated by M23 to one successful M24
replay claim before a later command-normalization boundary can read them.

**Architecture:** The new internal backend module makes a private byte copy,
passes only that copy through the accepted M23 verifier and M24 claim adapter,
and issues a fresh frozen capability after both return success. A private
`WeakMap` holds the original private copy; the reader returns another new copy
only for the private capability.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 built-in test runner, Web Crypto
through the accepted M23 dependency, and the existing backend workspace. No
dependency, generated output, configured store, or runtime service is added.

**Spec:** `docs/specs/m25-claimed-protected-body.md`

## Global Constraints

- Depend only on accepted M01-T030, M22-T010, M23-T010, and M24-T010 behavior.
- Modify only `packages/backend/src/ingress/claimed-protected-body.ts` and
  `packages/backend/tests/claimed-protected-body.test.mjs` for implementation.
- Keep the module internal-only; do not amend `packages/backend/src/index.ts`.
- Preserve the exact order: private byte copy, M23 verification, M24 claim,
  private capability registration. No command parser may run in this task.
- Use no JSON parsing, command/role/signer input, storage, Convex/database
  client, environment, configuration, HTTP, retry loop, wallet, network, or
  external action.
- Keep the local reference guard enabled before every non-empty commit.

---

### Task 1: Test-only RED contract

**Files:**

- Create: `packages/backend/tests/claimed-protected-body.test.mjs`

**Interfaces:**

- Consumes: M23 `ResolveProtectedIngressKey` behavior and M24
  `TryClaimProtectedReplay` behavior through the proposed M25 function.
- Produces: executable proof that the absent M25 module must expose
  `claimProtectedBody`, `isClaimedProtectedBody`, and
  `readClaimedProtectedBody`.

- [ ] **Step 1: Define one valid authenticated ingress fixture.**

  Reuse the public M23 test vector: UTF-8 bytes for `{"command":"test"}`;
  the matching closed envelope; a non-extractable HMAC-SHA-256 verification
  key; and the matching fixed timestamp. Import the proposed M25 module
  dynamically through a file URL so absence is the RED condition.

- [ ] **Step 2: Write the focused failing cases.**

  The successful case must invoke the injected claim once with
  `key-A:AbCdEfGhIjKlMnOpQrStUw`, then assert a frozen one-field capability and
  exact original bytes from the reader. Mutate the input byte array after
  `claimProtectedBody` resolves, mutate the first reader result, then prove a
  later reader result still equals the original bytes.

  ```js
  const claimed = await claimProtectedBody(
    validEnvelope,
    body,
    timestampUnixSeconds,
    resolveOnly(key),
    (identity) => {
      calls.push(identity);
      return "claimed";
    },
  );
  assert.deepEqual(calls, [replayIdentity]);
  assert.deepEqual(readClaimedProtectedBody(claimed), originalBody);
  ```

  Also prove the copy precedes M23 asynchronous cryptography. Before invoking
  M25, retain `globalThis.crypto`'s descriptor and replace it temporarily with
  an object whose `subtle.digest` signals `digestStarted`, awaits a test gate,
  then delegates to the real bound digest; its `verify` delegates directly to
  the real bound verifier. Start `claimProtectedBody`, wait for
  `digestStarted`, mutate the caller's input bytes, release the digest gate,
  and assert the successful reader still returns the pre-mutation bytes. In a
  `finally` block restore the exact original `globalThis.crypto` descriptor.

  ```js
  const claimPromise = claimProtectedBody(
    validEnvelope,
    body,
    timestampUnixSeconds,
    resolveOnly(key),
    () => "claimed",
  );
  await digestStarted;
  body.fill(0x78);
  releaseDigest();
  const claimed = await claimPromise;
  assert.deepEqual(readClaimedProtectedBody(claimed), originalBody);
  ```

  Add failures for a digest-mismatched body, a non-byte body, an
  `already_claimed` outcome, a throwing/rejecting claim port, and forged,
  copied, accessor-backed, and proxied claimed-body lookalikes. Each failure
  must return `null` or an unreadable capability and never expose bytes.

- [ ] **Step 3: Add static boundary checks.**

  Read the new source and assert it contains no `JSON.parse`, `process.env`,
  `convex` import, `fetch`, `Map`, or `setTimeout`. Read the backend barrel and
  assert it does not name `claimed-protected-body`.

- [ ] **Step 4: Observe RED and commit only the test.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/backend/tests/claimed-protected-body.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/backend
  git add packages/backend/tests/claimed-protected-body.test.mjs
  git commit -m "test: Add Claimed Protected Body RED Contract"
  ```

  Expected: focused test fails because the M25 module does not exist; backend
  typecheck remains green.

---

### Task 2: Minimal internal byte-binding adapter

**Files:**

- Create: `packages/backend/src/ingress/claimed-protected-body.ts`
- Test: `packages/backend/tests/claimed-protected-body.test.mjs`

**Interfaces:**

- Consumes:

  ```ts
  verifyProtectedIngress(
    envelopeInput: unknown,
    rawBody: Uint8Array,
    nowUnixSeconds: bigint,
    resolveKey: ResolveProtectedIngressKey,
  ): Promise<VerifiedProtectedIngress | null>

  claimProtectedReplay(
    verifiedIngress: unknown,
    tryClaimReplay: TryClaimProtectedReplay,
  ): Promise<ClaimedProtectedReplay | null>
  ```

- Produces:

  ```ts
  claimProtectedBody(...): Promise<ClaimedProtectedBody | null>
  isClaimedProtectedBody(value: unknown): value is ClaimedProtectedBody
  readClaimedProtectedBody(value: unknown): Uint8Array | null
  ```

- [ ] **Step 1: Define private capability state and types.**

  Use only module-private structures:

  ```ts
  const claimedProtectedBodies = new WeakSet<object>();
  const claimedBodyBytes = new WeakMap<object, Uint8Array>();

  export interface ClaimedProtectedBody {
    readonly replayIdentity: string;
  }
  ```

  Do not export a body, verified ingress, replay outcome, key, or port.

- [ ] **Step 2: Copy, verify, and claim in the required order.**

  Reject non-`Uint8Array` input. Inside `try`/`catch`, create
  `const copiedRawBody = new Uint8Array(rawBody)`, call M23 with exactly that
  private copy, return `null` for a null verifier result, then call M24 with
  that exact verified capability and injected claim port. Return `null` for a
  null claim result.

  ```ts
  const verified = await verifyProtectedIngress(
    envelopeInput,
    copiedRawBody,
    nowUnixSeconds,
    resolveKey,
  );
  if (verified === null) return null;
  const replay = await claimProtectedReplay(verified, tryClaimReplay);
  if (replay === null) return null;
  ```

- [ ] **Step 3: Issue and read only private detached state.**

  Create `Object.freeze({ replayIdentity: replay.replayIdentity })`, register
  the exact frozen object in the `WeakSet`, store `copiedRawBody` in the
  `WeakMap`, and return it. The membership guard must use only `WeakSet.has`.
  The reader must return `null` before reading any candidate field, and must
  return `new Uint8Array(storedBytes)` for a registered capability.

- [ ] **Step 4: Verify GREEN and commit.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/backend/tests/claimed-protected-body.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run lint --workspace @tool402/backend
  git add packages/backend/src/ingress/claimed-protected-body.ts \
    packages/backend/tests/claimed-protected-body.test.mjs
  git commit -m "feat: Add Claimed Protected Body Adapter"
  ```

---

### Task 3: Integration evidence

- [ ] Run root typecheck, test, lint, clean-install dry run, queue check,
  reference guard, and whitespace check under Node 22.21.1.
- [ ] Review the final diff to confirm only declared M25 implementation paths
  changed and no public barrel or external boundary was added.
- [ ] Obtain independent task review, then two fresh clean module-review
  generations at the final head.
- [ ] Record local acceptance only after all local checks pass. Durable replay
  storage, closed command schemas, command parsing, generic external attempts,
  ATS, and live work remain separately authorized tasks.
