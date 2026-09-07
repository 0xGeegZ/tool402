# M26 External-Prepare Payload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (- [ ]) syntax for tracking.

**Goal:** Add one pure public Core parser that freezes a closed
external-prepare payload without treating it as a signed command or executing
an external operation.

**Architecture:** The parser snapshots an exact ordinary eight-field record
through descriptors, validates the fixed local vocabulary and lexical values,
then returns a frozen detached payload. The existing exact Hedera identifier
parser is reused only for one accepted target form; a private lexical EVM
address parser supplies the other. No parser state or side effect is created.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 built-in test runner, and the
existing pure @tool402/core workspace. No dependency, generated output,
configuration, runtime service, or external SDK is added.

**Spec:** docs/specs/m26-external-prepare-payload.md

## Global Constraints

- Modify only the new Core parser and focused runtime/type tests plus the
  explicit Core public-barrel amendment.
- Parse a payload only; do not add command envelope, raw bytes, JSON,
  signature, signer, role, wallet, principal, nonce, issued-at, clock,
  replay/idempotency claim, storage, HTTP, Convex, ATS/provider, or external
  behavior.
- Require exactly the eight fields and use only descriptor reads under
  reflection failure handling.
- Accept only the six declared operation kinds, the accepted local 1–96
  ASCII letter/digit/underscore/hyphen public-ID grammar, hedera:testnet with
  chain 296, a canonical Hedera account or lower-case EVM expected target, a
  64-lowercase-hex algorithm-neutral hash, a canonical 16-byte base64url
  idempotency key, and a real canonical UTC-millisecond expiry.
- Keep the local reference guard enabled before every non-empty commit.

---

### Task 1: Test-only RED payload contract

**Files:**

- Create: packages/core/test/external-prepare-payload.test.mjs

**Interfaces:**

- Consumes: the proposed public parseExternalPreparePayload contract only.
- Produces: executable proof that the absent module must expose
  parseExternalPreparePayload and its documented payload behavior.

- [ ] **Step 1: Write one valid immutable payload fixture.**

  Use one external operation kind, a bounded public subject identifier,
  hedera:testnet, chain 296, one lower-case 0x plus 40 hexadecimal target,
  a 64-lowercase-hex canonical-parameters hash, a canonical 22-character
  base64url idempotency key, and a real UTC-millisecond expiry. Dynamically
  import the proposed source through a file URL so absence is the RED
  condition.

- [ ] **Step 2: Write the failing runtime contract.**

  Assert the exact frozen eight-field result and caller-mutation isolation.
  Cover every allowed operation kind, both a canonical Hedera account target
  and a lower-case EVM target, plus valid leading underscore/hyphen public IDs
  and rejected period/colon public IDs, then reject unknown/missing/extra,
  symbol-keyed, nonenumerable, inherited, custom-prototype, accessor-backed,
  and reflection-throwing inputs without reading a getter. Reject every wrong
  literal, unsupported operation, malformed subject, malformed/mixed-case
  target, noncanonical hash, noncanonical idempotency key, and
  impossible/noncanonical expiry. Parse one valid payload twice and assert
  that each result is a detached frozen value with no claim/caching observable
  from the public parser.

- [ ] **Step 3: Add static boundary checks.**

  After source exists, read it and assert it contains no JSON.parse,
  process.env, fetch, Convex import, storage client, Date.now, setTimeout, or
  ATS/provider dependency. Assert the public barrel exports the parser only
  after the implementation task.

- [ ] **Step 4: Observe RED and commit only the test.**

  ~~~bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/core/test/external-prepare-payload.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/core
  git add packages/core/test/external-prepare-payload.test.mjs
  git commit -m "test: Add External Prepare Payload RED Contract"
  ~~~

  Expected: the focused test fails because the M26 module does not exist; Core
  typecheck remains green.

### Task 2: Minimal pure Core payload parser

**Files:**

- Create: packages/core/src/external-prepare-payload.ts
- Create: packages/core/test/external-prepare-payload.types.ts
- Modify: packages/core/src/index.ts
- Test: packages/core/test/external-prepare-payload.test.mjs

**Interfaces:**

- Consumes: parseHederaAccountId from the accepted M10 Core boundary.
- Produces: ExternalOperationKind, EvmAddress, ExternalPrepareTarget,
  CanonicalParametersHash, ExternalPreparePayload, and
  parseExternalPreparePayload through @tool402/core.

- [ ] **Step 1: Implement exact descriptor-safe capture.**

  Require Object.prototype, exactly the documented string keys, enumerable
  data descriptors, and no reflection exception. Capture descriptor values
  before validation; return a TypeError for every malformed input without
  normal property reads.

- [ ] **Step 2: Implement only lexical payload validation.**

  Validate all six operation literals, the accepted local public-ID grammar,
  fixed network/chain pair, either target syntax, the 64-lowercase-hex
  CanonicalParametersHash, canonical 16-byte idempotency key, and real
  canonical UTC-millisecond expiry. Never derive, recompute, resolve, compare,
  or claim any payload value.

- [ ] **Step 3: Return and export the frozen public shape.**

  Return exactly the eight documented readonly fields in a detached
  Object.freeze result. Add only the named public exports to the existing
  Core barrel. The type fixture must prove literals/read-only fields, the
  closed operation union, target-brand distinction, and
  CanonicalParametersHash separation.

- [ ] **Step 4: Verify GREEN and commit source/type work.**

  ~~~bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/core/test/external-prepare-payload.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/core
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test --workspace @tool402/core
  git add packages/core/src/external-prepare-payload.ts \
    packages/core/src/index.ts \
    packages/core/test/external-prepare-payload.test.mjs \
    packages/core/test/external-prepare-payload.types.ts
  git commit -m "feat: Add External Prepare Payload Schema"
  ~~~

### Task 3: Module verification and independent review

**Files:**

- Verify: all Task 1 and Task 2 paths
- Verify: docs/specs/m26-external-prepare-payload.md and local queue records

- [ ] **Step 1: Run complete local quality gates.**

  ~~~bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run lint
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm ci --dry-run --ignore-scripts --loglevel=error
  npm run queue:check
  git diff --check
  ~~~

- [ ] **Step 2: Obtain independent Task 1 and Task 2 reviews.**

  Verify RED chronology, exact spec conformance, public export scope,
  descriptor safety, lexical-only target/hash rules, no external behavior,
  and focused/full validation evidence. Resolve any finding before acceptance.

- [ ] **Step 3: Obtain two fresh module-review generations.**

  Review both Standards and specification conformance against the accepted
  module head. Accept only when no Critical, Important, or Minor finding
  remains, then record the queue acceptance in a separate root integration
  commit.
