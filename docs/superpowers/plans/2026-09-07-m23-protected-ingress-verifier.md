# M23 Protected Ingress Verifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small, portable, server-only verifier that authenticates one
M22-shaped ingress envelope against exact raw bytes and an injected HMAC key,
without parsing a command or creating durable state.

**Architecture:** The backend module calls the accepted Core parser itself so
it never trusts a structural envelope lookalike. It uses native Web Crypto for
SHA-256 and HMAC verification, while a supplied non-extractable verification
key remains outside the module's output and configuration. A private `WeakSet`
marks frozen successful results so the next internal replay-claim adapter can
reject structurally forged capabilities.

**Tech Stack:** TypeScript 5.9, Node 22 Web Crypto, Node built-in test runner,
`@tool402/core`, and the existing backend package.

**Spec:** `docs/specs/m23-protected-ingress-verifier.md`

## Global constraints

- Depend on accepted M01-T030 and M22-T010 records; M22 supplies the only
  envelope parsing and canonical signing-input authority. This deliberately
  does not claim that the narrower historical RiskScan Quick card is a
  substitute for a broad schema or durable-attempt boundary: those later
  contracts remain separate.
- Use the fixed runtime order: raw bytes, envelope parse, body digest, key and
  MAC, skew, then capability. Never parse a command before a later atomic
  replay claim.
- Use only injected `CryptoKey` resolution. Do not read `.env`, configuration,
  a secret store, a clock, a network, a database, or the filesystem.
- Do not add a Convex function, mutation, action, HTTP route, public backend
  barrel export, persistence table, replay claim, command parser, generic
  attempt, ATS code, or any external/financial behavior.
- A test vector key is fixed public test data, non-extractable in the test
  runtime, and never a runtime credential.
- Commit test-only RED before the implementation file. Keep the local
  reference guard enabled before every non-empty commit.

---

## File structure

- Create `packages/backend/src/ingress/protected-ingress-verifier.ts`: internal
  Web Crypto verification and opaque same-process capability.
- Create `packages/backend/tests/protected-ingress-verifier.test.mjs`: exact
  async runtime contract; no external request, persistent record, or fixture
  credential.

### Task 1: Test-only RED contract

**Files:**

- Create: `packages/backend/tests/protected-ingress-verifier.test.mjs`

**Interfaces:**

- Consumes: the internal proposed verifier module and accepted `@tool402/core`
  envelope vocabulary.
- Produces: executable expectations for `verifyProtectedIngress` and
  `isVerifiedProtectedIngress` only.

- [ ] **Step 1: Write the exact valid-vector test**

Use UTF-8 raw bytes for `{"command":"test"}`, whose SHA-256 is
`ed2d201bcdca6714c531e7d26b7f47e72f88d631de70f4673129e64d3de0e12a`.
Use the public bytes `0` through `31` as the fixed test key and import a
non-extractable HMAC SHA-256 `CryptoKey` with only `verify` usage. The envelope
uses `key-A`, timestamp `1735689600`, nonce `AbCdEfGhIjKlMnOpQrStUw`, and the
precomputed canonical signature
`-icXyWTEvQ2ALd6x8kr5VxxW7BeQdQ-peJd5dE58rzY`.

At `nowUnixSeconds` `1735689600n`, assert a non-null frozen result contains
only `keyId`, `requestNonce`, `replayIdentity`, and `verifiedAtUnixSeconds`,
and internal membership accepts it. Assert a clone, structural lookalike, and
wrong object fail membership.

- [ ] **Step 2: Add negative and ordering cases**

Assert `null` for an altered raw body, unknown key, key with unsuitable
algorithm/usage/extractability, wrong canonical-length MAC, invalid envelope,
non-`Uint8Array` body, invalid clock, and resolver failure. Count resolver
calls to prove body mismatch stops before resolution. Test valid-MAC skew
boundaries: `timestamp - 60n`, `timestamp + 60n` succeed; `timestamp - 61n`
and `timestamp + 61n` fail. Pin the specified order by using a correctly
authenticated stale envelope: it resolves a usable key and still returns
`null`, with no command/parser/storage action.

- [ ] **Step 3: Run and preserve RED**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
  node --test packages/backend/tests/protected-ingress-verifier.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
  npm run typecheck --workspace @tool402/backend
```

Expected: the focused runtime test fails because the internal verifier module
is absent. The backend typecheck remains green until source is added.

- [ ] **Step 4: Commit observed RED**

```bash
git add packages/backend/tests/protected-ingress-verifier.test.mjs
git commit -m "test: Add Protected Ingress Verifier RED Contract"
```

### Task 2: Minimal portable verifier

**Files:**

- Create: `packages/backend/src/ingress/protected-ingress-verifier.ts`

- [ ] **Step 1: Parse, copy, and bind raw bytes**

Call `parseIngressEnvelope` on the untrusted five-field envelope inside a
fail-closed boundary. Copy an accepted `Uint8Array`, hash those bytes using
`globalThis.crypto.subtle.digest("SHA-256", ...)`, serialize its lower-case
hex digest, and reject a mismatch before resolving any key.

- [ ] **Step 2: Verify the canonical MAC and skew**

Resolve only the parsed key ID. Require a non-extractable secret HMAC SHA-256
key with `verify` usage. Decode the already canonical signature portably to
exactly 32 bytes, then call native `subtle.verify("HMAC", ...)` over a
`TextEncoder` encoding of M22's signing input. Do not make a JavaScript string
or byte equality decision for the MAC. Only after native MAC verification,
accept the inclusive ±60-second `bigint` skew rule.

- [ ] **Step 3: Return the sealed minimal capability**

Return only a frozen `{ keyId, requestNonce, replayIdentity,
verifiedAtUnixSeconds }` and register it in a module-private `WeakSet`.
Expose the internal membership predicate but no constructor, brand, key,
signature, digest, signing input, or raw bytes. Catch parser, reflection,
key-resolution, decoding, and cryptography failures and return `null`.

- [ ] **Step 4: Run focused GREEN checks**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
  node --test packages/backend/tests/protected-ingress-verifier.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
  npm run typecheck --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
  npm run test --workspace @tool402/backend
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
  npm run lint --workspace @tool402/backend
```

- [ ] **Step 5: Commit the isolated implementation**

```bash
git add packages/backend/src/ingress/protected-ingress-verifier.ts
git commit -m "feat: Add Protected Ingress Verifier"
```

### Task 3: Integration verification and review

- [ ] Run root typecheck, test, lint, clean-install dry run, queue check,
  reference guard, and whitespace check under Node 22.21.1.
- [ ] Obtain an independent task review against this card, the local spec, the
  exact two owned paths, and all negative/ordering tests.
- [ ] Run two fresh clean Standards and Specification module-review generations
  after the final source head.
- [ ] Record only the local verification/review result and module range before
  accepting the card. Do not make a durability, live, ATS, funding, or payment
  claim.

## Plan self-review

- The plan preserves the M22 ordering and separates cryptographic verification
  from the future atomic replay claim and command parsing.
- The test vector is public deterministic data and introduces no runtime
  credential or configuration.
- No path, document link, or command relies on an uncommitted local document.
