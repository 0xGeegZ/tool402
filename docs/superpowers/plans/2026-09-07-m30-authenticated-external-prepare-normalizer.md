# M30 Authenticated External-Prepare Command Normalizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox syntax for tracking.

**Goal:** Add one internal backend boundary that turns an already M25-claimed,
strictly encoded external.prepare command and detached M26 payload into a
frozen local DTO after exact EIP-712 signature, signer authority, and
freshness validation.

**Architecture:** M25 remains the only raw-byte authority. The new module
creates a private strict UTF-8 JSON reader for the one closed command-and-
payload transport, then delegates payload syntax to M26. It recomputes the
fixed eight-field JCS bytes, checks one fixed typed-data domain with a direct
exact viem verifier, and evaluates one injected authority resolver before
returning a detached immutable command value. It creates no durable state and
invokes no provider or network.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 built-in test runner, existing
M25/M26 backend and Core modules, and direct exact viem 2.56.1. No Convex
function, browser library, generated output, configuration, or live SDK is
added.

**Spec:** docs/specs/m30-authenticated-external-prepare-normalizer.md

## Global constraints

- Modify only the M30 card/spec/plan/queue records, the focused backend test,
  packages/backend/package.json, package-lock.json, and the new internal
  ingress source.
- Accept no arbitrary raw bytes: read only the exact M25 claimed-body
  capability through readClaimedProtectedBody.
- Decode only the fixed command plus payload object transport. Reject invalid
  UTF-8, escapes, duplicate/missing/unknown keys, arrays, booleans, null,
  fractional/exponent numeric forms, and every noncanonical downstream value.
- Accept command nonce only as the exact 21-character base64url prefix plus a
  final A, Q, g, or w. Never accept a different final sextet for the same
  16 decoded bytes.
- Require byte-for-byte command and payload expiry equality, a fixed EIP-712
  Tool402 domain, a lower-case signer/signature, low-s signature, and recovery
  suffix normalization only from 00/01 to 1b/1c.
- Verify signer equality before resolver access. Accept exactly one enabled,
  descriptor-safe authority record with the required role and, for ATS
  operation kinds, subject ownership. Do not derive target, parameter, or
  operation-to-target authority.
- Do not add a browser provider, wagmi, EIP-6963, wallet call, Convex,
  replay/idempotency claim, attempt, prepared state, ATS/provider SDK,
  funding, payment, transaction, settlement, clearing, HCS, payout,
  deployment, or live action.
- Keep the local reference guard enabled before every non-empty commit.

---

### Task 1: Test-only RED normalizer contract

**Files:**

- Create: packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs

**Interfaces:**

- Consumes the existing M25 claimProtectedBody test seam and the proposed
  internal normalizeClaimedExternalPrepareCommand contract only.
- Produces executable proof that no normalizer exists yet and that the future
  module must not accept raw bytes, decoded objects, or a forged capability.

- [ ] **Step 1: Build deterministic public-only fixtures.**

  Create one canonical M26 payload with a real UTC-millisecond expiry and one
  matching command using the fixed domain, field order, canonical lower-case
  signer, canonical nonce, and lower-case valid EIP-712 signature. Store only
  the public address and public signature vector in the test; do not store or
  derive a private key. Build its exact body with the closed two-key transport.

  Reuse the established fixed non-runtime M23 HMAC test key to obtain an M25
  claimed capability for exactly those bytes. The helper must make a valid
  M22 envelope from the body SHA-256 and use one injected M24 claim outcome.
  It must never read configuration, environment, or a real account.

- [ ] **Step 2: Write the failing behavioral contract.**

  Dynamically import the proposed source by file URL so its absence is the RED
  condition. With a valid claimed body, canonical server time, and exactly one
  injected authority record, assert one frozen DTO with only the documented
  normalized command, authority, payload, and replay-identity fields. Assert
  caller body mutation, returned payload mutation, and DTO mutation cannot
  alter later results; the DTO never contains raw bytes or raw signature.

  Reject a raw byte array, string, decoded object, clone, accessor-backed
  object, proxy, invalid UTF-8, duplicate JSON key at root/command/payload,
  escape sequence, non-ASCII string, unknown/missing field, array, boolean,
  null, leading-zero/fraction/exponent integer, noncanonical signer,
  noncanonical nonce tail, wrong literal, malformed timestamp, alternate
  offset, non-millisecond precision, impossible calendar timestamp, or
  timestamp that fails Date-to-ISO round-trip for issuedAt, either expiry, or
  serverNow; also reject malformed payload hash, signature length/case, high
  or zero s, zero r, unsupported recovery byte, signature/signer mismatch, M26
  parse failure, JCS hash mismatch, every one-millisecond expiry mismatch, and
  each server-clock violation.

  Assert the authority resolver is not called until after successful claimed
  body, decode, M26, digest, signature grammar, and signer equality checks.
  Cover zero/multiple/disabled/malformed/mismatched records, invalid roles,
  missing ATS subject ownership, and an ISSUER attempt for HEDERA_FUNDING.
  Confirm HEDERA_FUNDING accepts only BACKER identity authorization and does
  not authorize a target or external action.

- [ ] **Step 3: Add static boundary checks.**

  Once source exists, read it and assert no JSON.parse, process.env, Date.now,
  fetch, Convex import, storage/cache client, wallet/provider import or
  invocation, outbound SDK, or public backend-barrel export. Assert the direct
  dependency is exactly viem 2.56.1.

- [ ] **Step 4: Observe RED and commit only the test.**

  ~~~bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  git add packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs
  git commit -m "test: Add Authenticated Command Normalizer RED Contract"
  ~~~

  Expected: the focused test fails only because the internal normalizer module
  does not yet exist; existing backend typecheck remains green.

### Task 2: Minimal internal strict normalizer

**Files:**

- Create: packages/backend/src/ingress/authenticated-external-prepare-normalizer.ts
- Modify: packages/backend/package.json
- Modify: package-lock.json
- Test: packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs

**Interfaces:**

- Consumes M25 isClaimedProtectedBody and readClaimedProtectedBody, M26
  parseExternalPreparePayload, direct viem 2.56.1, injected serverNow, and
  injected ResolveCommandAuthorities.
- Produces only the internal CommandAuthorityRecord,
  ResolveCommandAuthorities, NormalizedExternalPrepareCommand, and
  normalizeClaimedExternalPrepareCommand surface defined by the M30 spec.

- [ ] **Step 1: Pin the exact verifier and preserve the dependency boundary.**

  Add viem exactly at 2.56.1 as a direct backend runtime dependency and update
  the root lockfile through the package manager without scripts. Verify the
  resolved backend dependency is exact. Do not add wagmi, a provider SDK, a
  browser dependency, or generated code.

- [ ] **Step 2: Implement strict transport and canonical payload binding.**

  Gate byte access through M25 membership and private byte snapshot only. Use
  a fatal UTF-8 decoder and a closed hand-written JSON reader: it may emit only
  ordinary plain objects, ASCII unescaped strings, and canonical decimal
  integer literals. Track object keys during parse to reject duplicates and
  require exact root/command/payload field sets before property validation.

  Pass the local payload object to M26. Require strict expiry equality.
  Reconstruct exactly the documented lexicographic eight-field JCS string and
  use Keccak-256 of its UTF-8 bytes for byte-exact payload hash equality.

- [ ] **Step 3: Implement fixed EIP-712, authority, and time checks.**

  Validate the closed command grammar, canonical nonce tail, canonical
  signer/signature, nonzero low-s signature components, and private recovery
  suffix normalization. Use the exact Tool402 domain, Tool402Command field
  order, and recoverTypedDataAddress from the direct verifier. Require
  lower-case recovered signer equality before resolver access.

  Capture exactly one safe enabled authority record for that signer and chain,
  enforce role/subject predicates, then evaluate the injected canonical server
  clock and fixed expiry window. Build fresh frozen output with the exact
  replay identity and normalized values; do not retain raw signature, raw
  body, resolver record, provider, target authorization, or external
  capability.

- [ ] **Step 4: Verify GREEN and commit only implementation/dependency work.**

  ~~~bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/backend
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend
  git add packages/backend/package.json package-lock.json packages/backend/src/ingress/authenticated-external-prepare-normalizer.ts packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs
  git commit -m "feat: Add Authenticated Command Normalizer"
  ~~~

### Task 3: Module verification and independent review

**Files:**

- Verify all Task 1 and Task 2 paths plus the M30 specification and queue
  records.

- [ ] **Step 1: Run complete local quality gates.**

  ~~~bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
  npm run queue:check
  git diff --check
  ~~~

- [ ] **Step 2: Obtain independent Task 1 and Task 2 reviews.**

  Verify RED chronology, strict JSON/Unicode/duplicate-key behavior, exact
  JCS bytes and typed-data recovery, no resolver-before-signer access,
  resolver-record isolation, authority/time/replay derivation, direct
  dependency pinning, and the absence of durable, provider, ATS, or external
  behavior.

- [ ] **Step 3: Obtain two fresh module-review generations.**

  Review both Standards and specification conformance against the accepted
  module head. Resolve every Critical, Important, and Minor finding. The root
  accepts the card only after two consecutive fresh clean module reviews and
  records the done transition in a separate root integration commit.
