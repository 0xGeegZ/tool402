# M22 Closed Ingress Envelope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one strict, dependency-free Core parser that turns an untrusted
five-field ingress envelope into a frozen canonical signing input and a
non-authoritative replay identity.

**Architecture:** The parser is pure Core because it only checks an opaque
record and derives deterministic strings. It accepts no method/path from the
caller: the output fixes the later protocol tuple to `POST` and
`/internal/commands`. It does not perform HMAC or replay prevention; those
operations remain a later server-only backend adapter.

**Tech Stack:** TypeScript 5.9, Node 22, the dependency-free Core package,
Node built-in test runner, and `@tool402/core`.

**Spec:** `docs/specs/m22-ingress-envelope.md`

## Global constraints

- Depend on the accepted M16–M21 local contract chain as source-to-runtime
  authority context, but import no behavior from it and do not reopen it.
- Accept only five exact enumerable data fields, and capture descriptor values
  without normal property access; reject accessors, inherited values, symbols,
  custom prototypes, and reflection failures.
- Fix the output method/path to `POST` and `/internal/commands`; treat them
  as protocol vocabulary, not a real route.
- Keep timestamp parsing exact with `bigint`; do not call `Date`, read a
  clock, infer freshness, or apply a skew window.
- Do not hash body bytes, implement HMAC, obtain/parse a key, compare a MAC,
  persist a nonce, parse a command, perform I/O, or create an external or
  financial action.
- Commit test-only RED files before production source or public barrel work.

---

## File structure

- Create `packages/core/src/ingress-envelope.ts`: strict parser and detached
  canonical envelope value.
- Modify `packages/core/src/index.ts`: public parser and types only.
- Create `packages/core/test/ingress-envelope.test.mjs`: runtime contract.
- Create `packages/core/test/ingress-envelope.types.ts`: public type contract.

### Task 1: Test-only RED contract

**Files:**

- Create: `packages/core/test/ingress-envelope.test.mjs`
- Create: `packages/core/test/ingress-envelope.types.ts`

**Interfaces:**

- Consumes: the public Core barrel only.
- Produces: executable expectations for `parseIngressEnvelope` and
  `IngressEnvelope`.

- [ ] **Step 1: Write the failing runtime contract**

Create one ordinary input with these exact fields:

```js
{
  keyId: "key-A",
  timestampUnixSeconds: "1735689600",
  requestNonce: "AbCdEfGhIjKlMnOpQrStUv",
  bodySha256: "a".repeat(64),
  signature: "B".repeat(43),
}
```

Assert a frozen output has exactly `keyId`, `timestampUnixSeconds`,
`requestNonce`, `bodySha256`, `signature`, `method`, `path`,
`signingInput`, and `replayIdentity`; it must include bigint `1735689600n`,
`POST`, `/internal/commands`, the five-line canonical signing input, and
`key-A:AbCdEfGhIjKlMnOpQrStUv`.

Add independent negative cases for missing/extra/symbol/nonenumerable/
inherited fields, accessors, custom prototypes, reflection failures, invalid
identifier/nonce/digest/signature forms, negative/leading-zero/out-of-range
timestamps, and caller mutation after parsing. Assert all failures are
`TypeError` and no accessor executes.

- [ ] **Step 2: Write the failing compile-time fixture**

```ts
import {
  parseIngressEnvelope,
  type IngressEnvelope,
} from "../src/index.ts";

const envelope: IngressEnvelope = parseIngressEnvelope({
  keyId: "key-A",
  timestampUnixSeconds: "1735689600",
  requestNonce: "AbCdEfGhIjKlMnOpQrStUv",
  bodySha256: "a".repeat(64),
  signature: "B".repeat(43),
});

const seconds: bigint = envelope.timestampUnixSeconds;
const method: "POST" = envelope.method;
const path: "/internal/commands" = envelope.path;
void seconds;
void method;
void path;

// @ts-expect-error Parsed envelopes are readonly snapshots.
envelope.method = "GET";
```

- [ ] **Step 3: Run and preserve the RED result**

Run `node --test packages/core/test/ingress-envelope.test.mjs` and
`npm run typecheck --workspace @tool402/core`. Both must fail only because the
new public parser/types are absent. Record that result before source or barrel
work.

- [ ] **Step 4: Commit the observed RED contract**

```bash
git add packages/core/test/ingress-envelope.test.mjs packages/core/test/ingress-envelope.types.ts
git commit -m "test: Add Ingress Envelope RED Contract"
```

### Task 2: Minimal parser and public barrel

**Files:**

- Create: `packages/core/src/ingress-envelope.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**

- Consumes: only JavaScript reflection and `BigInt` parsing.
- Produces: `parseIngressEnvelope(input: unknown): IngressEnvelope`.

- [ ] **Step 1: Capture a closed ordinary record**

Implement a private expected-key tuple/set and a descriptor reader. Require an
ordinary `Object.prototype` record, obtain `Reflect.ownKeys` in `try`/`catch`,
require the exact five string keys, and obtain each own enumerable data
descriptor without reading a caller property. Any exception or mismatch throws
one stable `TypeError`.

- [ ] **Step 2: Validate canonical lexical values**

Validate key ID, exact 22-character base64url nonce, lower-case 64-hex digest,
43-character base64url signature, and canonical nonnegative signed-64-bit
decimal timestamp. Convert only the accepted timestamp to `bigint`.

- [ ] **Step 3: Issue a detached frozen canonical envelope**

Construct the fixed method/path, joining the five exact signing-input lines
with `"\\n"` and no trailing newline. Form replay identity with the safe
`keyId:requestNonce` pair. Return exactly the nine documented fields in one
frozen plain object; retain neither input record nor a descriptor.

- [ ] **Step 4: Export only the documented public API**

Add the parser and `IngressEnvelope` type to `packages/core/src/index.ts`.
Do not expose implementation helpers or any HMAC/replay verifier.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test packages/core/test/ingress-envelope.test.mjs
npm run typecheck --workspace @tool402/core
npm run test --workspace @tool402/core
npm run lint --workspace @tool402/core
```

Expected: the focused tests and the existing Core suite pass with no production
HMAC, I/O, or route files added.

- [ ] **Step 6: Commit the minimal GREEN implementation**

```bash
git add packages/core/src/ingress-envelope.ts packages/core/src/index.ts
git commit -m "feat: Add Closed Ingress Envelope"
```

### Task 3: Integration verification and acceptance preparation

**Files:**

- Modify: root queue/evidence records only after independent reviews complete.

**Interfaces:**

- Consumes: accepted RED/GREEN Core evidence.
- Produces: review-ready M22 integration evidence without an external action.

- [ ] **Step 1: Run root verification**

Run root typecheck, test, lint, clean-install dry run, queue check, local
reference guard, and `git diff --check` under Node 22.

- [ ] **Step 2: Request independent task review**

Require review of descriptor safety, canonical tuple exactness, lexical-only
signature handling, no hidden clock/I/O, and all documented exclusions.

- [ ] **Step 3: Run two fresh module-review generations**

Review the exact module range against the accepted M22 spec; resolve every
Critical, Important, or Minor finding before acceptance.

- [ ] **Step 4: Commit acceptance only after evidence is complete**

```bash
git add docs/work-queue docs/imports/SPEC-IMPORT-LEDGER.md
git commit -m "chore: Accept Closed Ingress Envelope"
```
