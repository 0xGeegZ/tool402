# S18 Backer funding route implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the truthful, wallet-gated `/explore/riskscan/back` funding-intent route defined by UI-S18 without creating a payment, allocation, or unsupported campaign state.

**Architecture:** A pure `backing-state` module owns the closed eight-kind view union, exact `bigint` arithmetic, terms validation, JCS-bound `HEDERA_FUNDING` payload construction, and local payment outcome transitions. A client `BackingFlow` receives its projection from a caller, composes the existing WalletIsland and SignatureDialog seams, and can request `eth_sendTransaction` only after a relayed accepted command. The initial direct route deliberately supplies no projection, so it truthfully renders unavailable until a separately accepted read/configuration boundary provides a lowercase treasury.

**Tech Stack:** Next.js App Router, React, TypeScript, `@tool402/core`, viem, existing Tool402 WalletIsland/SignatureDialog/command relay, Node 22.21.1 test runner.

**Spec:** `docs/ui/UI-S18.md` and `docs/work-queue/queue/20-active/S18-T010-backer-funding-route.md`.

## Global Constraints

- Create or amend only the five S18 paths authorized by the root control plane.
- The production route owns no fixture, projection parser, fetch, environment read, treasury default, or Hedera-account-to-EVM conversion.
- View state is exactly `offering_unavailable | choosing | prepared | payment_submitted | payment_outcome_unknown | allocation_pending | complete | refused`; `complete` remains unreachable from this slice.
- Validate terms with `createOfferingTerms`; preserve all money and unit values as integer `bigint` values and serialise payload numbers as canonical decimal strings.
- The funding payload is `external.prepare` / `HEDERA_FUNDING` / `hedera:testnet` / chain `296`; its JCS parameters are exactly `{ offeringPublicId, units, tinybars, purchaseIntentId }` and its hash is lowercase Keccak-256 without `0x`.
- Never send a transaction before a relayed `ACCEPTED`; never retry a relay or transfer; a no-hash return, relay transport failure, or malformed result becomes `payment_outcome_unknown`.
- An actual transfer needs a projection-provided lowercase `0x` forty-hex treasury. With no configured treasury or invalid/missing offering, show only unavailable.
- Reuse `WalletIsland`, `SignatureDialog`, command timestamps/nonces, and relay. Do not add a second provider selector, signer, typed-data builder, nonce source, command endpoint, dependency, storage, or timer.
- Do not claim funding, settlement, verification, allocation, balance, capacity remaining, percentage raised, HBAR account, explorer evidence, or a retry.

---

### Task 1: Durable S18 RED contract

**Files:**
- Create: `apps/web/tests/backing-state.test.mjs`
- Create: `apps/web/tests/backing-route.test.mjs`
- Test: `apps/web/tests/backing-state.test.mjs`
- Test: `apps/web/tests/backing-route.test.mjs`

**Interfaces:**
- Consumes: accepted `OfferingRecord` projection shape, `createOfferingTerms`, `canonicalizeRequirements`, `parseExternalPreparePayload`, existing WalletIsland/SignatureDialog contracts.
- Produces: a durable test-only contract for `backing-state.ts`, `backing-flow.tsx`, and the `/explore/riskscan/back` page.

- [ ] **Step 1: Write the failing state contract**

```js
const backing = await loadModule("../src/components/backing/backing-state.ts");

assert.deepEqual(backing.BACKING_VIEW_KINDS, [
  "offering_unavailable", "choosing", "prepared", "payment_submitted",
  "payment_outcome_unknown", "allocation_pending", "complete", "refused",
]);
assert.equal(backing.toWeiHex(10n), "0x2540be400");
assert.throws(() => backing.prepareFundingIntent(invalidTermsProjection, "10"));
```

Add isolated vectors for the exact lifecycle labels, lower/upper unit bounds, `bigint` multiplication, no-float quantity encoding, prefix-free JCS/Keccak parameters digest, and missing/noncanonical treasury refusal. Assert `payment_submitted` only after the accepted command plus a returned hash; assert every ambiguous condition selects `payment_outcome_unknown` without a resend transition.

- [ ] **Step 2: Write the failing route contract**

```js
const source = await readFile(routePath, "utf8");
assert.match(source, /BackingFlow/);
assert.doesNotMatch(source, /fixture|sample|Hedera account|units remain|percentage funded/i);
assert.doesNotMatch(source, /process\.env|fetch\(/);
```

Assert the source contains the unavailable boundary, one polite live region and the fixed two-confirmation copy, but contains no canvas simulation controls, balance, allocation, attach-signature, payment retry, or claimed verified state.

- [ ] **Step 3: Run the focused RED suite**

Run:
```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- backing-state.test.mjs backing-route.test.mjs
```

Expected: failures occur only because the three declared S18 source paths are absent; no existing test fails.

- [ ] **Step 4: Commit the RED contract**

```bash
git add apps/web/tests/backing-state.test.mjs apps/web/tests/backing-route.test.mjs
git commit -m "test: Add S18 Funding Route Contract"
```

### Task 2: Pure funding intent and view-state module

**Files:**
- Create: `apps/web/src/components/backing/backing-state.ts`
- Modify: `apps/web/tests/backing-state.test.mjs`
- Test: `apps/web/tests/backing-state.test.mjs`

**Interfaces:**
- Consumes: an externally supplied `OfferingRecord`, a one-time `purchaseIntentId`, and selected units as text.
- Produces: `deriveBackingState`, `validateUnits`, `prepareFundingIntent`, `tinybarsToWeiHex`, and a closed serialisable state DTO for `BackingFlow`.

- [ ] **Step 1: Confirm the state test is RED**

Run the Task 1 focused command. Expected: module-not-found/absent-source failure only.

- [ ] **Step 2: Implement exact pure helpers**

```ts
export const BACKING_VIEW_KINDS = [
  "offering_unavailable", "choosing", "prepared", "payment_submitted",
  "payment_outcome_unknown", "allocation_pending", "complete", "refused",
] as const;

export function tinybarsToWeiHex(tinybars: bigint): `0x${string}` {
  if (tinybars <= 0n) throw new RangeError("tinybars must be positive");
  return `0x${(tinybars * 10_000_000_000n).toString(16)}`;
}
```

Use `createOfferingTerms` as the sole economics validator. Accept an actual funding projection only if `state === "OPEN"` and its `fundingTreasuryEvmAddress` is already canonical lowercase. Construct the M26 payload with `parseExternalPreparePayload`, canonicalise it with the accepted Core canonicalizer, and return immutable canonical payload bytes alongside the local `tinybars`/`purchaseIntentId`. Do not generate a default target or call browser APIs in this module.

- [ ] **Step 3: Run the state suite to GREEN**

Run the Task 1 focused command. Expected: state vectors pass; route-source assertions remain RED because the route has not yet been created.

- [ ] **Step 4: Commit the state implementation**

```bash
git add apps/web/src/components/backing/backing-state.ts apps/web/tests/backing-state.test.mjs
git commit -m "feat: Add Backing Funding Intent State"
```

### Task 3: Backer flow and server route

**Files:**
- Create: `apps/web/src/components/backing/backing-flow.tsx`
- Create: `apps/web/src/app/explore/riskscan/back/page.tsx`
- Modify: `apps/web/tests/backing-route.test.mjs`
- Test: `apps/web/tests/backing-route.test.mjs`

**Interfaces:**
- Consumes: the Task 2 immutable intent DTO, existing `WalletIsland`, `SignatureDialog`, and `LandingFooter`.
- Produces: a direct-address-only backer route with truthful unavailable and locally bounded intent states.

- [ ] **Step 1: Confirm the route test is RED**

Run the Task 1 focused command. Expected: only the absent flow/page assertions fail.

- [ ] **Step 2: Add the smallest server composition**

```tsx
export default function BackingRoute() {
  return <BackingFlow offering={null} />;
}
```

The direct route starts deliberately unavailable: no accepted S18 data reader can supply the required lowercase treasury. It must not invent that field or pass a raw offering record into an enabled payment path. It renders the Footer and `BackingFlow` only; it creates no navigation entry.

- [ ] **Step 3: Add the client flow**

```tsx
<WalletIsland>
  {(session) => request === null ? null : (
    <SignatureDialog provider={session.provider} request={request} onResult={handleSignatureResult} />
  )}
</WalletIsland>
```

Render only the terms, the unit input, acknowledgement, two-confirmation hint, and closed state copy allowed by UI-S18. Keep the action disabled until a valid selection, acknowledgement, wallet session, and actual treasury exist. On `ACCEPTED`, call `eth_sendTransaction` once with `{ to, value }`; on a missing hash, error, or non-accepted relay select unknown and leave no resend control. Do not render an attach action or promote a submitted hash to verification/allocation.

- [ ] **Step 4: Run focused tests to GREEN**

Run:
```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- backing-state.test.mjs backing-route.test.mjs
```

Expected: all S18 contracts pass.

- [ ] **Step 5: Commit the route and flow**

```bash
git add apps/web/src/app/explore/riskscan/back/page.tsx apps/web/src/components/backing/backing-flow.tsx apps/web/tests/backing-route.test.mjs
git commit -m "feat: Add Backer Funding Route"
```

### Task 4: Verify the closed UI boundary

**Files:**
- Modify: only S18 files when a failing verification proves the existing contract is insufficient.
- Test: both focused S18 tests and full Web/root checks.

**Interfaces:**
- Consumes: Tasks 1–3 and the UI-S18 exclusions.
- Produces: review-ready S18 implementation evidence.

- [ ] **Step 1: Run targeted and complete validation**

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- backing-state.test.mjs backing-route.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace @tool402/web
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck && npm run lint && npm run queue:check
git diff --check
```

- [ ] **Step 2: Perform the limited browser check**

Start the application with all offering/treasury configuration absent. Verify the unavailable state, keyboard focus, polite status text, and no horizontal overflow at 390px. Do not connect a wallet, sign, relay, or send a transaction during this verification.

- [ ] **Step 3: Commit only a proven corrective change**

```bash
git add <only-authorized-s18-files>
git commit -m "fix: Harden Backer Funding Boundary"
```

Commit only if a focused failing validation required a minimal S18 correction.

## Self-Review

- Spec coverage: Task 1 locks all eight states, terms bounds, exact arithmetic, canonical payload shape, treasury gate, confirmation ordering, no-retry rule, and route exclusions. Task 2 implements only pure state/payload mechanics. Task 3 composes the existing wallet seams and page reader without adding a data source. Task 4 validates the intentionally unavailable production-safe state.
- Placeholder scan: no task delegates a requirement to unspecified work; source signatures, tests, commands, and transition conditions are named above.
- Type consistency: the server route is the only projection caller; `BackingFlow` consumes the DTO created by `backing-state`; `SignatureDialog` consumes the established `SignatureDialogRequest` contract.

## Execution Handoff

Execute this plan with `superpowers:subagent-driven-development`: one delegated test-only RED task after root activation, independent RED review, then fresh implementation/review tasks within the explicitly accepted GREEN scope.
