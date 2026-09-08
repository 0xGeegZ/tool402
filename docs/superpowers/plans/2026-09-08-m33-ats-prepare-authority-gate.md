# ATS Prepare Authority Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject every unconfigured ATS external-prepare command before durable replay or idempotency state can be read or written.

**Architecture:** Add one private, underscore-safe Convex helper that resolves a compiled server-only authority manifest. The production manifest begins with no enabled entries, while a direct test-only helper accepts a supplied manifest to prove exact lookup, canonical JCS/Keccak binding, and failure behavior. Insert its production assertion into M32 only after M32 has rebound and revalidated the current signer authority, and before its replay query.

**Tech Stack:** TypeScript, Convex internal mutation helpers, `@tool402/core` RFC8785-JCS emitter, viem 2.56.1 Keccak helpers, Node built-in tests.

**Spec:** `docs/specs/m33-ats-prepare-authority-gate.md`

## Global Constraints

- M33 accepts no ATS target, ABI, descriptor, parameter, provider, wallet, account, funding, payment, transaction, deployment, or live authority.
- The production source is an immutable compiled manifest with zero enabled ATS records; all five ATS operation kinds fail closed.
- `HEDERA_FUNDING` does not inspect an ATS manifest and retains the accepted M32 BACKER path.
- ATS resolution occurs after M26/time rebinding and current command-authority revalidation, but before replay/idempotency lookup or durable writes.
- M33 adds no schema, public Convex function, generated API, backend barrel, package, lockfile, configuration, environment, or external integration.
- Use only underscore-safe Convex filenames and retain M32's registered mutation API and closed return arms exactly.
- Every test begins as an observed RED before the production source that satisfies it; commits are conventional and pushed after each verified phase.

## File structure

- Create `packages/backend/convex/ats_prepare_authority.ts`: private compiled-manifest parser, exact resolver, canonical preimage hash, and two documented internal exports.
- Create `packages/backend/tests/ats-prepare-authority.test.mjs`: direct test-only helper coverage and static scope exclusions.
- Modify `packages/backend/convex/external_prepare_command_admission.ts`: one M33 assertion after existing current-authority revalidation.
- Modify `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`: prove ATS denial has only the authority lookup and no writes, while funding retains current admission.

### Task 1: Record executable RED contracts

**Files:**
- Create: `packages/backend/tests/ats-prepare-authority.test.mjs`
- Modify: `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`

**Interfaces:**
- Consumes: accepted `ExternalPreparePayload`, existing M32 admission mutation input fixture, Core `canonicalizeRequirements`, and viem `keccak256(stringToHex(...))`.
- Produces: a direct expected interface for `assertAtsPrepareAuthorityForTest(payload, manifest)`, and an M32 regression that requires only the `commandAuthorities` lookup for rejected ATS input.

- [ ] **Step 1: Write the failing direct resolver test**

Create a test fixture with one immutable enabled `ATS_CREATE` record whose source fields are:

~~~js
const rule = {
  schemaVersion: 1,
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "subject_42",
  offeringVersion: "offering_v1",
  registryRevision: "registry_v1",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  operationDescriptor: { instrument: "equity", version: "1" },
  parameters: { action: "create", class: "A" },
  enabled: true,
};
~~~

Compute the candidate payload hash from the exact preimage required by the specification, invoke the missing exported test helper, and assert it accepts only this exact record. Add explicit rejection cases for missing, duplicate, disabled, malformed, proxy/accessor-backed, wrong-target, and wrong-hash manifest candidates. Add a separate `HEDERA_FUNDING` fixture that succeeds with an empty manifest.

- [ ] **Step 2: Write the failing M32 ordering regression**

Replace the current all-operation success loop with a loop over the five `ATS_*` kinds. For each, invoke the existing internal mutation fixture and assert:

~~~js
await assert.rejects(
  mutation._handler(db.ctx, withPayload({ operationKind })),
  TypeError,
);
assert.deepEqual(db.reads, lookups(args).slice(0, 1));
assert.deepEqual(db.writes, []);
~~~

Add a dedicated `HEDERA_FUNDING` input whose authority is an enabled `BACKER` with no owned subject and assert its pre-existing three lookups and two durable inserts remain unchanged.

Migrate every existing M32 test that intentionally reaches durable admission,
replay, idempotency, or persisted-attempt validation to that funding fixture;
do not leave it on the former default `ATS_CREATE`/ISSUER fixture. Set the
default command payload to `HEDERA_FUNDING`, set its command authority to
`BACKER` with an empty owned-subject list, and recompute the default detached
payload hash from the changed eight-field payload. Keep a separately named
static assertion for the prior ATS_CREATE M30 JCS hash vector so that moving
the durable control fixture does not remove that binding coverage.

The migrated durable-path set includes the inclusive expiry/future-skew
successes, current-authority/revocation behavior, replay-first outcomes,
malformed replay rows, fresh-nonce idempotency replay, and persisted attempt
conflicts. Malformed serialized command and payload cases may retain their
ATS-shaped input because they must fail before all database access.

- [ ] **Step 3: Run the focused RED commands**

Run:

~~~bash
node --test packages/backend/tests/ats-prepare-authority.test.mjs
node --test packages/backend/tests/external-prepare-command-durable-admission.test.mjs
~~~

Expected: the direct module import and every ATS ordering assertion fail because the M33 source and mutation assertion do not exist; the funding control remains green.

- [ ] **Step 4: Commit the test-only RED**

~~~bash
git add packages/backend/tests/ats-prepare-authority.test.mjs packages/backend/tests/external-prepare-command-durable-admission.test.mjs
git commit -m "test: Cover ATS Prepare Authority Gate"
git push origin main
~~~

### Task 2: Implement the private compiled authority resolver

**Files:**
- Create: `packages/backend/convex/ats_prepare_authority.ts`
- Test: `packages/backend/tests/ats-prepare-authority.test.mjs`

**Interfaces:**
- Consumes: `ExternalPreparePayload`.
- Produces: exactly:

~~~ts
export function assertCurrentAtsPrepareAuthority(
  payload: ExternalPreparePayload,
): void;

export function assertAtsPrepareAuthorityForTest(
  payload: ExternalPreparePayload,
  manifest: unknown,
): void;
~~~

- [ ] **Step 1: Implement descriptor-safe manifest capture**

Write the closed parser for exactly the record fields from the M33 specification. Reject non-ordinary objects, inherited fields, symbols, accessors, holes, unknown or missing fields, unsafe nested JSON, noncanonical target forms, unsupported operation kinds, and a record whose `enabled` field is not `true`. Preserve the M26 payload as the already accepted candidate; do not parse browser input or read a database/environment/configuration source.

- [ ] **Step 2: Implement exact lookup and preimage comparison**

Return immediately for `HEDERA_FUNDING`. For ATS input, select only records whose `network`, `chainId`, `subjectPublicId`, and `operationKind` equal the payload. Require exactly one valid enabled candidate. Build this exact value:

~~~ts
{
  protocol: "tool402:ats-parameters:v1",
  network: rule.network,
  chainId: rule.chainId,
  subjectPublicId: rule.subjectPublicId,
  offeringVersion: rule.offeringVersion,
  registryRevision: rule.registryRevision,
  operationKind: rule.operationKind,
  targetKind: rule.targetKind,
  expectedTarget: rule.expectedTarget,
  operationDescriptor: rule.operationDescriptor,
  parameters: rule.parameters,
}
~~~

Canonicalize it through the accepted Core emitter, hash its UTF-8 bytes with viem Keccak, remove `0x`, and require strict equality with the M26 hash and target. The immutable production manifest is an empty frozen array.

- [ ] **Step 3: Prove the direct helper becomes GREEN**

Run:

~~~bash
node --test packages/backend/tests/ats-prepare-authority.test.mjs
~~~

Expected: direct matching, mismatch, malformed-input, and no-external-surface assertions pass; the M32 ordering suite remains RED until Task 3.

- [ ] **Step 4: Commit and push the resolver**

~~~bash
git add packages/backend/convex/ats_prepare_authority.ts packages/backend/tests/ats-prepare-authority.test.mjs
git commit -m "feat: Add ATS Prepare Authority Resolver"
git push origin main
~~~

### Task 3: Gate durable admission before replay

**Files:**
- Modify: `packages/backend/convex/external_prepare_command_admission.ts`
- Modify: `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- Test: `packages/backend/tests/ats-prepare-authority.test.mjs`

**Interfaces:**
- Consumes: `assertCurrentAtsPrepareAuthority(bound.payload)` from the private resolver.
- Produces: an unchanged registered M32 mutation whose ATS path stops after current authority revalidation and whose funding path has no M33 manifest access.

- [ ] **Step 1: Add the one ordered production assertion**

Import only `assertCurrentAtsPrepareAuthority` into the existing M32 source. Directly after:

~~~ts
if (authorities.length !== 1) return reject();
revalidateAuthority(authorities[0], bound);
~~~

insert:

~~~ts
assertCurrentAtsPrepareAuthority(bound.payload);
~~~

Do not change M32 arguments, return validator, schema, recovery query, index usage, durable records, or the non-ATS path.

- [ ] **Step 2: Run focused GREEN verification**

Run:

~~~bash
node --test packages/backend/tests/ats-prepare-authority.test.mjs
node --test packages/backend/tests/external-prepare-command-durable-admission.test.mjs
~~~

Expected: both suites pass; each ATS candidate has only its current command-authority lookup and zero write, and funding retains the existing durable NEW/replay/idempotency behavior.

- [ ] **Step 3: Run static and package validation**

Run:

~~~bash
npm run typecheck
npm run test
npm run lint
npm run queue:check
git diff --check
~~~

Confirm the local reference guard remains enabled before committing.

- [ ] **Step 4: Commit and push the integration**

~~~bash
git add packages/backend/convex/external_prepare_command_admission.ts packages/backend/tests/external-prepare-command-durable-admission.test.mjs
git commit -m "feat: Gate ATS Admission Before Durable Replay"
git push origin main
~~~

## Plan self-review

- Spec coverage: Tasks 1 and 2 cover the private manifest, exact lookup, JCS/Keccak digest, malformed-source rejection, target/hash equality, and funding bypass. Task 3 covers the required M32 ordering and zero-write integration behavior.
- Type consistency: both production and direct-test entry points accept `ExternalPreparePayload`; M32 imports only the production assertion.
- Placeholder scan: no future authority value, target, ABI, credential, provider behavior, or live action is assumed. The initial production manifest is explicitly empty.
