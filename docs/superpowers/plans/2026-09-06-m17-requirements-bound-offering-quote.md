# M17 Canonical Requirements Quote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind an accepted pure offering allocation quote to exact canonical
payment-requirements bytes, a SHA-256 digest, and an explicit expiry without
introducing a payment or external adapter.

**Architecture:** A new Core module owns strict JSON-value capture,
deterministic key-sorted serialization, platform Web Crypto hashing, and a
frozen quote composed from the accepted M16 allocation function. The public
barrel exposes only typed constructors/checkers; it does not expose a raw
requirements object or adapt any protocol runtime.

**Tech Stack:** TypeScript 5.9, Node 22 Web Crypto, Node built-in test runner,
and the existing `@tool402/core` public entry point.

**Spec:** `docs/specs/m17-requirements-bound-offering-quote.md`

## Global Constraints

- Depend only on accepted M10 exact values and M16 allocation math; do not
  duplicate their parsing or arithmetic.
- Keep `packages/core` free of non-relative runtime imports; use
  `globalThis.crypto.subtle`, not a Node crypto import or a new dependency.
- Do not read a clock, environment, storage, network, wallet, signer, account,
  ATS, transaction, receipt, persistence, HCS, deployment, or live API.
- Treat requirements as untrusted data. Reject malformed/hostile shapes and
  bounds violations; never silently remove a field.
- The expiry is caller supplied and canonical; equality at expiry is inactive.

---

## File structure

- Create `packages/core/src/requirements-offering-quote.ts`: pure canonical
  capture, Web Crypto digest, quote construction, matching, and expiry helper.
- Modify `packages/core/src/index.ts`: narrow value/type exports only.
- Create `packages/core/test/requirements-offering-quote.test.mjs`: public
  RED/GREEN runtime contract.
- Create `packages/core/test/requirements-offering-quote.types.ts`: public
  compile-time brand and interface contract.

### Task 1: Public RED contract

**Files:**
- Create: `packages/core/test/requirements-offering-quote.test.mjs`
- Create: `packages/core/test/requirements-offering-quote.types.ts`

**Interfaces:**
- Consumes: accepted `createOfferingTerms`, `parseNoteUnits`, and M16 public
  types from `@tool402/core`.
- Produces: executable expectations for `canonicalizeRequirements`,
  `sha256Requirements`, `createOfferingRequirementsQuote`,
  `matchesQuotedRequirements`, and `isOfferingRequirementsQuoteActive`.

- [ ] **Step 1: Write the failing runtime contract**

```js
const requirements = {
  x402Version: 2,
  requirements: { b: true, a: ["z", { y: null, x: 2 }] },
};
const canonical = canonicalizeRequirements(requirements);
assert.equal(
  canonical,
  '{"requirements":{"a":["z",{"x":2,"y":null}],"b":true},"x402Version":2}',
);
assert.equal(
  await sha256Requirements(requirements),
  "e19be69052e97b9b41445cfd81527a49cf4fed010426580733a96b343461da6f",
);

const exactValueLimit = {
  first: Array.from({ length: 127 }, () => null),
  second: Array.from({ length: 126 }, () => null),
};
assert.doesNotThrow(() => canonicalizeRequirements(exactValueLimit));
assert.throws(() => canonicalizeRequirements({
  ...exactValueLimit,
  second: Array.from({ length: 127 }, () => null),
}));

const exactByteLimit = { a: "a".repeat(32_760) };
assert.equal(
  new TextEncoder().encode(canonicalizeRequirements(exactByteLimit)).byteLength,
  32_768,
);
assert.throws(() => canonicalizeRequirements({ a: "a".repeat(32_761) }));
```

Add cases that create a valid M16 terms value and prove a quote exposes the
M16 payment/capacity values, digest match succeeds only for the full same
object, a changed amount or added extension does not match, an explicit
timestamp before expiry is active, and the identical expiry is inactive. Prove
`sha256Requirements` rejects a raw canonical-looking string rather than
hashing it. Add rejection cases for a root array, accessor property, `NaN`,
`-0`, `bigint`, and a sparse array. The accessor case must assert its getter
was never invoked. Add a proxy whose `ownKeys` trap throws and assert safe
rejection.

Prove each documented canonicalization limit both succeeds exactly at its
boundary and rejects at one past it: 16 versus 17 nested containers, 256 versus
257 captured values, 128 versus 129 object properties, 128 versus 129 array
items, and 32,768 versus 32,769 UTF-8 canonical bytes. Use a two-array root
with 127 and 126 `null` entries for the exact 256-value case so no
per-container limit masks it. Freeze/mutate the input after construction and
prove the returned quote remains unchanged.

```js
function nestedContainers(count) {
  let value = null;
  for (let index = 0; index < count; index += 1) value = { child: value };
  return value;
}

function objectWithProperties(count) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`field-${index}`, null]),
  );
}

assert.doesNotThrow(() => canonicalizeRequirements(nestedContainers(16)));
assert.throws(() => canonicalizeRequirements(nestedContainers(17)));
assert.doesNotThrow(() => canonicalizeRequirements(objectWithProperties(128)));
assert.throws(() => canonicalizeRequirements(objectWithProperties(129)));
assert.doesNotThrow(() => canonicalizeRequirements({
  items: Array.from({ length: 128 }, () => null),
}));
assert.throws(() => canonicalizeRequirements({
  items: Array.from({ length: 129 }, () => null),
}));

let getterRead = false;
const accessor = {};
Object.defineProperty(accessor, "unsafe", {
  enumerable: true,
  get() { getterRead = true; return "must-not-run"; },
});
assert.throws(() => canonicalizeRequirements(accessor));
assert.equal(getterRead, false);
const reflectionFailure = new Proxy({ field: true }, {
  ownKeys() { throw new Error("reflection failed"); },
});
assert.throws(() => canonicalizeRequirements(reflectionFailure));
```

- [ ] **Step 2: Write the failing compile-time fixture**

```ts
const canonical: CanonicalRequirements = canonicalizeRequirements({ x402Version: 2 });
const digest: RequirementsDigest = await sha256Requirements({ x402Version: 2 });
const requestedUnits = parseNoteUnits("2");
const confirmedAllocatedUnits = parseNoteUnits("0");
if (requestedUnits === undefined || confirmedAllocatedUnits === undefined) {
  throw new Error("exact local fixture values must parse");
}
const terms = createOfferingTerms({
  version: "offering-v1",
  fundingTargetTinybars: "100",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "10",
  minimumPurchaseUnits: "2",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "150",
});
const input: OfferingRequirementsQuoteInput = {
  expectedTermsVersion: "offering-v1",
  requestedUnits,
  confirmedAllocatedUnits,
  requirements: { x402Version: 2 },
  expiresAt: "2026-09-06T18:00:00.000Z",
};
const quote: OfferingRequirementsQuote =
  await createOfferingRequirementsQuote(terms, input);

// @ts-expect-error A requirements digest is not an exact HBAR value.
const digestAsTinybar: Tinybar = digest;
// @ts-expect-error Canonical requirements are not note units.
const canonicalAsUnits: NoteUnits = canonical;
```

Start the fixture with imports from `../src/index.ts` for
`canonicalizeRequirements`, `sha256Requirements`,
`createOfferingRequirementsQuote`, `createOfferingTerms`, and
`parseNoteUnits`, plus type-only imports for `CanonicalRequirements`,
`RequirementsDigest`, `OfferingRequirementsQuote`,
`OfferingRequirementsQuoteInput`, `Tinybar`, and `NoteUnits`. Include
matching positive assignments and `void` uses so TypeScript checks the public
entry point rather than module-private declarations.

- [ ] **Step 3: Run the focused RED commands**

Run:

```bash
node --test packages/core/test/requirements-offering-quote.test.mjs
npm run typecheck --workspace @tool402/core
```

Expected: the runtime test and type fixture fail only because the declared
public functions/types are absent. Record the exact missing-export evidence
before production code is written.

- [ ] **Step 4: Commit the observed RED contract**

```bash
git add packages/core/test/requirements-offering-quote.test.mjs packages/core/test/requirements-offering-quote.types.ts
git commit -m "test: Add Requirements Quote RED Contract"
```

### Task 2: Pure canonical binding implementation

**Files:**
- Create: `packages/core/src/requirements-offering-quote.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `calculateAllocation`, `OfferingTerms`, `Tinybar`, and
  `NoteUnits` from the existing pure Core modules.
- Produces: the exact public functions/types specified in
  `docs/specs/m17-requirements-bound-offering-quote.md`.

- [ ] **Step 1: Implement strict recursive capture and canonical serialization**

Create an internal recursive function with `(value, depth, nodeCount)` state.
For an ordinary object, obtain `Reflect.ownKeys` inside a guarded operation,
reject non-string keys, reject any descriptor that is missing, non-enumerable,
or not an own data property, sort keys, capture each descriptor value once,
then serialize
`JSON.stringify(key) + ":" + child`. For arrays, require a dense own numeric
index sequence and serialize captured children in index order. Reject all
unsupported values and every configured depth/count/length/byte limit. Return
the branded canonical string only after the root object is non-empty and the
UTF-8 byte length is within the limit.

- [ ] **Step 2: Implement hash and explicit-expiry helpers**

Use the exact shape:

```ts
const bytes = new TextEncoder().encode(canonicalRequirements);
const bytesDigest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
const hexadecimal = [...new Uint8Array(bytesDigest)]
  .map((value) => value.toString(16).padStart(2, "0"))
  .join("");
```

Keep the branded-string hash helper module-private. The public
`sha256Requirements(input)` must canonicalize its untrusted input before
calling that helper, so arbitrary strings reject at runtime. Reject when the
platform primitive is unavailable. Parse timestamps only when they match
`YYYY-MM-DDTHH:mm:ss.sssZ`, round-trip through `Date.parse` and
`new Date(epoch).toISOString()`, and compare only explicit epochs. Do not call
`Date.now`.

- [ ] **Step 3: Compose the frozen quote and matching helper**

Call `calculateAllocation(terms, input)` using the existing expected-version,
requested-unit, and confirmed-unit fields. Canonicalize and hash the whole
requirements value, validate the canonical expiry, then return an
`Object.freeze` result carrying the allocation facts, digest, and expiry.
`matchesQuotedRequirements` must canonicalize/hash its candidate and return
strict digest equality; `isOfferingRequirementsQuoteActive` must return
`observedAtEpoch < expiryEpoch`.

- [ ] **Step 4: Export only the public surface**

Add the five functions and five public types to `packages/core/src/index.ts`.
Do not export internal capture helpers or add a package dependency/import.

- [ ] **Step 5: Run the focused GREEN commands**

Run:

```bash
node --test packages/core/test/requirements-offering-quote.test.mjs
npm run typecheck --workspace @tool402/core
npm run test --workspace @tool402/core
npm run lint --workspace @tool402/core
```

Expected: the focused runtime test, type fixture, existing Core suite, and Core
boundary check pass.

- [ ] **Step 6: Commit the minimal GREEN implementation**

```bash
git add packages/core/src/requirements-offering-quote.ts packages/core/src/index.ts
git commit -m "feat: Add Canonical Requirements Quote"
```

### Task 3: Full verification and review package

**Files:**
- Verify: `packages/core/src/requirements-offering-quote.ts`
- Verify: `packages/core/src/index.ts`
- Verify: `packages/core/test/requirements-offering-quote.test.mjs`
- Verify: `packages/core/test/requirements-offering-quote.types.ts`

**Interfaces:**
- Consumes: completed public Core boundary from Tasks 1 and 2.
- Produces: immutable verification evidence and a review package; no source
  changes unless a confirmed defect requires a new RED/GREEN loop.

- [ ] **Step 1: Run the bounded and repository-level suite**

```bash
node --test packages/core/test/requirements-offering-quote.test.mjs
npm run typecheck --workspace @tool402/core
npm run test --workspace @tool402/core
npm run lint --workspace @tool402/core
npm run typecheck
npm run test
npm run lint
npm ci --dry-run --ignore-scripts --loglevel=error
npm run queue:check
```

- [ ] **Step 2: Run repository-boundary checks**

```bash
"$(git config --get core.hooksPath)/reference-check" --staged
git diff --check "$(git merge-base origin/main HEAD)"..HEAD
git status --short --branch
```

Expected: no whitespace error, enabled reference guard success, a clean queue,
and no unowned worktree change.

- [ ] **Step 3: Request independent task and module reviews**

Give reviewers only the local spec, plan, owned diff, focused output, and
current base/head. Require one implementation review, then two fresh module
generations with separate standards and specification axes. Any Critical,
Important, or Minor finding returns to a bounded RED/GREEN correction; no
acceptance or push happens before both generations are clean.

## Self-review

- Spec coverage: Task 1 proves the canonical/digest/expiry/immutability
  contract; Task 2 implements each public function; Task 3 verifies all
  documented quality and review gates. No external action is included.
- Placeholder scan: no TBD, TODO, implied validation, or unresolved interface
  appears in this plan.
- Type consistency: Task 1 and Task 2 use the same five exported types and
  functions; exact monetary/unit values remain sourced from M16/M10.

## Execution handoff

Plan saved to
`docs/superpowers/plans/2026-09-06-m17-requirements-bound-offering-quote.md`.
Execution uses the required subagent-driven workflow with a fresh implementer
per task and independent review between tasks.
