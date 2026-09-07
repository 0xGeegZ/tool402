# M28 Agent Directory Record Candidate Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure Core parser that turns one untrusted, advertised Directory
record into a frozen candidate value without claiming publication, availability,
or payment authority.

**Architecture:** Capture the exact root and array descriptor shapes before
validation. Reuse the accepted M10 Hedera account parser, validate fixed
literals, IDs, timestamps, and HTTPS URL admission, then construct fresh
frozen candidate data. Keep the current Agent Directory reader untouched;
this is an independent future-facing contract only.

**Tech Stack:** TypeScript 5.9, Node 22.21.1 built-in test runner, and the
existing pure `@tool402/core` workspace. No dependency, generated output,
configuration, runtime service, or external SDK is added.

**Spec:** docs/specs/m28-agent-directory-record-candidate-schema.md

## Global Constraints

- Modify only the new Core parser, its focused runtime/type tests, and the
  explicit Core public-barrel amendment.
- Treat every successful result as untrusted advertised metadata; never claim
  signature, publication, active service, payment truth, receipt, or external
  availability.
- Require the exact root fields, descriptor-safe arrays, `riskscan`, x402,
  Hedera testnet, HBAR, the one capability, canonical M10 account syntax, and
  the three allowed tier tuples. Bound each account input to 96 UTF-16 code
  units before invoking M10.
- Admit only bounded credential-free HTTPS URLs and return their `URL.href`
  canonical form without fetching them; reject every raw `#` delimiter before
  URL canonicalization.
- Do not add command, JSON/raw body, wallet, signer, signature, principal,
  role, replay/idempotency, storage, HTTP, Convex, provider, ATS, payment,
  attempt, transaction, settlement, HCS, deployment, or live behavior.
- Keep the local reference guard enabled before every non-empty commit.

---

### Task 1: Test-only RED candidate-record contract

**Files:**

- Create: `packages/core/test/agent-directory-record-candidate.test.mjs`

**Interfaces:**

- Consumes: the proposed public
  `parseAgentDirectoryRecordCandidate(input)` contract only.
- Produces: executable proof that the absent parser must accept one exact
  advertised candidate and reject every out-of-contract shape or value.

- [ ] **Step 1: Write one valid candidate fixture.**

  Use this exact baseline object:

  ```js
  const candidate = (overrides = {}) => ({
    schemaVersion: 1,
    serviceId: "service_42",
    serviceSlug: "riskscan",
    offeringPublicId: "offering_42",
    offeringVersion: 1,
    capabilities: ["evm-contract-risk-signals"],
    x402Endpoint: "https://api.example.test/riskscan",
    paymentProtocol: "x402",
    paymentNetwork: "hedera-testnet",
    asset: "HBAR",
    advertisedTiers: ["quick", "standard"],
    issuerRevenueAccount: "0.0.123",
    clearingAccount: "0.0.456",
    status: "active",
    publishedAt: "2026-09-07T00:00:00.000Z",
    ...overrides,
  });
  ```

  Dynamically import `../src/agent-directory-record-candidate.ts` by file URL
  so its absence is the RED condition.

- [ ] **Step 2: Write the failing runtime contract.**

  Assert an exact frozen detached root; frozen `capabilities` and
  `advertisedTiers`; optional `webUrl`; mutation isolation for the caller root
  and arrays; and independent values from two parses. Cover the legal tier
  tuples `["quick"]`, `["standard"]`, and `["quick", "standard"]`. Assert
  `https://example.test` returns `https://example.test/`.

  Reject root missing/unknown/symbol/nonenumerable/inherited/custom-prototype
  records; accessors without invoking their getters; proxy reflection errors;
  wrong literals; IDs outside the 1–96 grammar; unsafe, fractional, zero,
  negative, or string versions; malformed/noncanonical accounts; both account
  fields at exactly 96 and 97 code units using `0.0.${"1".repeat(92)}` and
  `0.0.${"1".repeat(93)}`; malformed or impossible timestamps; credentials,
  raw `#` and `/#fragment` URLs for both URL fields, non-HTTPS, whitespace,
  and over-2,048-character URLs; array holes, custom prototypes, extra fields,
  accessors, duplicate/out-of-order/unknown tiers, and wrong capabilities.

- [ ] **Step 3: Add static boundary checks.**

  Once source exists, read it and assert it contains no `fetch`, `process.env`,
  `JSON.parse`, Convex import, storage client, `Date.now`, ATS/provider import,
  or Agent import. Assert the Core public barrel exports only the specified
  candidate parser/types after Task 2.

- [ ] **Step 4: Observe RED and commit only the test.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/core/test/agent-directory-record-candidate.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/core
  git add packages/core/test/agent-directory-record-candidate.test.mjs
  git commit -m "test: Add Directory Record Candidate RED Contract"
  ```

  Expected: the focused test fails because the M28 parser module does not
  exist; the existing Core typecheck remains green.

### Task 2: Minimal descriptor-safe Core parser

**Files:**

- Create: `packages/core/src/agent-directory-record-candidate.ts`
- Create: `packages/core/test/agent-directory-record-candidate.types.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/agent-directory-record-candidate.test.mjs`

**Interfaces:**

- Consumes: `parseHederaAccountId` and `HederaAccountId` from the accepted M10
  Core boundary.
- Produces: `DirectoryCapability`, `DirectoryTier`,
  `AdvertisedDirectoryTiers`, `AgentDirectoryRecordCandidate`, and
  `parseAgentDirectoryRecordCandidate` through `@tool402/core`.

- [ ] **Step 1: Implement exact descriptor capture.**

  Use an exact-record helper that only accepts `Object.prototype`, validates
  `Reflect.ownKeys`, and captures descriptor values under `try`/`catch`:

  ```ts
  function captureExactRecord(input: unknown, fields: readonly string[]) {
    if (input === null || typeof input !== "object") throw new TypeError("invalid directory record");
    try {
      if (Object.getPrototypeOf(input) !== Object.prototype) throw new TypeError("invalid directory record");
      const keys = Reflect.ownKeys(input);
      if (keys.length !== fields.length || keys.some((key) => typeof key !== "string" || !fields.includes(key))) {
        throw new TypeError("invalid directory record");
      }
      return fields.map((field) => {
        const descriptor = Reflect.getOwnPropertyDescriptor(input, field);
        if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, "value") || Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")) {
          throw new TypeError("invalid directory record");
        }
        return descriptor.value;
      });
    } catch {
      throw new TypeError("invalid directory record");
    }
  }
  ```

  Use an equivalent descriptor-only array capture that admits only the
  documented indexed keys and native `length`; never retain a caller array.

- [ ] **Step 2: Implement the exact candidate validations.**

  Validate the fixed literals, public-ID pattern, safe positive version,
  exact capability tuple, three tier tuples, a 96-code-unit pre-M10 account
  bound, canonical M10 account syntax, canonical real UTC-millisecond date,
  and bounded HTTPS URL policy. Use `new URL(value).href` only after checking
  primitive type, whitespace, and absence of the raw `#` delimiter; reject
  credentials and fragments. Do not compare accounts, fetch URLs, or interpret
  `status`/`publishedAt` as authority.

- [ ] **Step 3: Return and export detached frozen types.**

  Create fresh arrays and freeze them before freezing the root. Add only these
  exports to the Core barrel:

  ```ts
  export { parseAgentDirectoryRecordCandidate } from "./agent-directory-record-candidate.ts";
  export type {
    AdvertisedDirectoryTiers,
    AgentDirectoryRecordCandidate,
    DirectoryCapability,
    DirectoryTier,
  } from "./agent-directory-record-candidate.ts";
  ```

  Make the type fixture prove the literal unions, branded account fields, and
  readonly root/array fields; include `@ts-expect-error` checks that a generic
  string cannot become a `HederaAccountId` and that a candidate cannot receive
  an unsupported tier or mutable tuple write.

- [ ] **Step 4: Verify GREEN and commit source/type work.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    node --test packages/core/test/agent-directory-record-candidate.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run typecheck --workspace @tool402/core
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH \
    npm run test --workspace @tool402/core
  git add packages/core/src/agent-directory-record-candidate.ts \
    packages/core/src/index.ts \
    packages/core/test/agent-directory-record-candidate.test.mjs \
    packages/core/test/agent-directory-record-candidate.types.ts
  git commit -m "feat: Add Directory Record Candidate Schema"
  ```

### Task 3: Module verification and independent review

**Files:**

- Verify: all Task 1 and Task 2 paths
- Verify: `docs/specs/m28-agent-directory-record-candidate-schema.md` and
  committed M28 queue records

- [ ] **Step 1: Run complete local quality gates.**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
  npm run queue:check
  git diff --check
  ```

- [ ] **Step 2: Obtain independent Task 1 and Task 2 reviews.**

  Verify RED chronology, exact descriptor/array safety, frozen detachment,
  all lexical limits, no accidental integration with the Agent directory,
  source/barrel export scope, and absence of command, payment, provider, or
  external behavior. Resolve every finding before acceptance.
