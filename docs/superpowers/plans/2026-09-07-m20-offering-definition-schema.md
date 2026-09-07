# M20 Closed Offering-Definition Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one closed, immutable, descriptor-safe Core parser for an
untrusted offering definition, without creating an offering, an external
attempt, or an ATS integration.

**Architecture:** The new module captures one exact ordinary root record and
one exact ordinary nested terms record through descriptors only. It validates
bounded primitive metadata, delegates all exact economics to the accepted
`createOfferingTerms` constructor, and returns a frozen detached value. No
registry, generic schema framework, lifecycle, I/O, or external adapter is
introduced.

**Tech Stack:** TypeScript 5.9, Node 22, the existing dependency-free Core
package, Node built-in test runner, and `@tool402/core`.

**Spec:** `docs/specs/m20-offering-definition-schema.md`

## Global constraints

- Consume `OfferingTerms` and `createOfferingTerms` from the accepted Core
  economics boundary; do not reproduce arithmetic or introduce new branded
  numeric types.
- Accept only a root with `schemaVersion`, `terms`, `maturityAt`, and
  `qualifyingResource`, and a nested terms record with exactly the accepted
  nine input fields.
- Use descriptor snapshots; do not directly read caller fields or invoke
  caller-defined accessors. Catch reflection failures and reject them.
- Require `schemaVersion === 1`, strict canonical UTC maturity text, a
  trimmed resource of at most 256 code units, and a trimmed version plus every
  terms string bounded to 96 code units before economics validation.
- Do not create a generic parser helper, accepted-offering registry, external
  attempt, account/asset configuration, ATS adapter, wallet/signer/payment,
  transfer, transaction, settlement, persistence, HCS, deployment, or live
  behavior.
- Commit the test-only RED contract before any production module or barrel
  export, preserving durable RED-before-GREEN history.

---

## File structure

- Create `packages/core/src/offering-definition.ts`: private exact-record
  capture, bounded primitive validation, canonical instant validation, and the
  public detached parser.
- Modify `packages/core/src/index.ts`: the documented parser and public type
  only.
- Create `packages/core/test/offering-definition.test.mjs`: runtime contract.
- Create `packages/core/test/offering-definition.types.ts`: public type
  contract.

### Task 1: Test-only RED contract

**Files:**

- Create: `packages/core/test/offering-definition.test.mjs`
- Create: `packages/core/test/offering-definition.types.ts`

**Interfaces:**

- Consumes: the existing public Core economics types through `../src/index.ts`.
- Produces: public expectations for `parseOfferingDefinition` and
  `OfferingDefinition` only.

- [ ] **Step 1: Write the failing runtime contract**

Define one valid closed input:

```js
const definition = parseOfferingDefinition({
  schemaVersion: 1,
  terms: {
    version: "risk-v1",
    fundingTargetTinybars: "200",
    noteUnitPriceTinybars: "10",
    maximumNoteUnits: "10",
    minimumPurchaseUnits: "1",
    reserveShareBps: "2000",
    issuerShareBps: "8000",
    platformFeeBps: "0",
    payoutCapTinybars: "300",
  },
  maturityAt: "2026-12-31T00:00:00.000Z",
  qualifyingResource: "riskscan.quick",
});
```

Assert its exact branded/frozen result, then mutate the original root and
terms records and prove the result is unchanged. Add table-driven rejection
coverage for missing, extra, symbol, inherited, nonenumerable, accessor, and
wrong-prototype fields at both levels; ensure accessors are never invoked.
Exercise throwing and descriptor-changing proxies, unsupported schema
versions, no-default behavior, exact/one-past string limits, whitespace in
`version`/`qualifyingResource`, canonical and noncanonical economics strings,
and valid/invalid UTC timestamps including impossible calendar dates. Verify a
proxy that throws on normal `get` but supports reflection can be parsed,
proving descriptor capture rather than direct reads.

- [ ] **Step 2: Write the failing compile-time fixture**

```ts
const definition: OfferingDefinition = parseOfferingDefinition(validInput);
const terms: OfferingTerms = definition.terms;
void terms;

// @ts-expect-error A parsed terms version is text, not a branded tinybar.
const amount: Tinybar = definition.terms.version;
// @ts-expect-error The parser does not return an arbitrary schema version.
const unsupportedVersion: 2 = definition.schemaVersion;
```

Import values and types only from `../src/index.ts`. Include positive use of
the accepted `OfferingTerms` type and a `void` use of all declarations so the
fixture verifies the public barrel rather than an internal implementation.

- [ ] **Step 3: Run and preserve the RED result**

Run `node --test packages/core/test/offering-definition.test.mjs` and
`npm run typecheck --workspace @tool402/core`. Both must fail only because the
new public parser/type is absent. Record the exact result before source or
barrel work.

- [ ] **Step 4: Commit the observed RED contract**

```bash
git add packages/core/test/offering-definition.test.mjs packages/core/test/offering-definition.types.ts
git commit -m "test: Add Offering Definition Schema RED Contract"
```

### Task 2: Minimal pure parser implementation

**Files:**

- Create: `packages/core/src/offering-definition.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**

- Consumes: `OfferingTerms` and `createOfferingTerms`.
- Produces: exactly `OfferingDefinition` and `parseOfferingDefinition`.

- [ ] **Step 1: Capture exact untrusted records safely**

Implement a private helper that accepts only `Object.prototype` records, checks
the complete `Reflect.ownKeys` set before field descriptors, requires every
declared descriptor to be enumerable data, captures values in declared-field
order, and returns `undefined` on any reflection failure. Keep the helper
module-private and do not add a reusable generic framework.

- [ ] **Step 2: Validate primitive metadata and delegate economics**

Require primitive numeric schema version `1`. Validate the timestamp format,
`Date.parse`, and ISO round trip without reading a clock. Validate trimmed
metadata and the documented 96/256 bounds before constructing a fresh
`OfferingTermsInput` from captured strings. Delegate canonical values and all
economics to `createOfferingTerms`; do not use `BigInt` or arithmetic in this
module.

- [ ] **Step 3: Return the immutable documented surface**

Create and freeze a new root containing the exact four fields and the frozen
terms returned from the existing constructor. Export only the function and
type from `packages/core/src/index.ts`; do not expose the capture or date
helpers.

- [ ] **Step 4: Run the GREEN contract**

Run the focused runtime test, Core typecheck, Core suite, and Core lint. Each
must pass with the existing no-I/O Core boundary.

- [ ] **Step 5: Commit the minimal GREEN implementation**

```bash
git add packages/core/src/offering-definition.ts packages/core/src/index.ts
git commit -m "feat: Add Offering Definition Schema"
```

### Task 3: Verification and review package

**Files:**

- Verify: `packages/core/src/offering-definition.ts`
- Verify: `packages/core/src/index.ts`
- Verify: `packages/core/test/offering-definition.test.mjs`
- Verify: `packages/core/test/offering-definition.types.ts`

**Interfaces:**

- Consumes: the completed public Core parser.
- Produces: verification and review evidence only; a confirmed defect restarts
  a bounded RED/GREEN loop.

- [ ] **Step 1: Run the quality suite**

Run the focused M20 test, Core and root typecheck/test/lint, clean-install dry
run, and `npm run queue:check`.

- [ ] **Step 2: Run repository-boundary checks**

Run the enabled reference guard against staged files, `git diff --check` from
the merge base through HEAD, and `git status --short --branch`. Expect guard
success, no whitespace error, a clean queue, and no unowned change.

- [ ] **Step 3: Obtain independent reviews**

Request one task review against the card/spec/plan/owned paths, then two fresh
Standards/Specification module-review generations after the final production
change. Every valid finding returns to a bounded RED/GREEN loop; root cannot
accept until both final generations are clean.

## Self-review

- Spec coverage: Task 1 proves closed safe ingress; Task 2 creates only a
  detached parser; Task 3 verifies chronology, quality, guard, and review
  gates.
- Placeholder scan: no unfinished marker, deferred validation, or unspecified
  interface.
- Type consistency: the plan uses the same `OfferingDefinition`,
  `OfferingTerms`, and `parseOfferingDefinition` names in all tasks.

## Execution handoff

Execute only after this authority is committed, independently reviewed, moved
through the queue, and activated. Use a fresh implementation worker for the
RED contract and a separate review boundary before root acceptance.
