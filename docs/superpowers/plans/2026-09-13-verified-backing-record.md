# Verified Backing Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and display server-verified proof for an already submitted RiskScan backing payment.

**Architecture:** The authenticated Next server accepts only a canonical hash tied to the signed dashboard address and relays a narrow assertion to a protected Convex HTTP endpoint. Convex binds that hash to the exact pre-existing HEDERA_FUNDING attempt, verifies a bounded Hedera Testnet RPC receipt, and exposes a safe projection that the Back page and dashboard can reload.

**Tech Stack:** Next.js 16, React, TypeScript, Convex HTTP/actions/mutations, viem, Node 22.21.1.

**Spec:** `docs/specs/m58-verified-backing-record.md`

## Global Constraints

- The browser must never receive the protected ingress secret.
- The user performs the only wallet signature and transfer; this work never retries, cancels, speeds up, or sends a transaction.
- `CONFIRMED` needs an exact Hedera Testnet receipt with matching hash, chain 296, sender, target, value, and success status.
- Missing evidence is `SUBMITTED` or `OUTCOME_UNKNOWN`, never confirmed.
- No allocation, note issuance, payout, authority/configuration change, deployment, or live network test is part of this delivery.

---

### Task 1: Backend durable payment admission and receipt verifier

**Files:**
- Create: `packages/backend/convex/backing_payment_records.ts`
- Create: `packages/backend/src/ats/hedera-funding-receipt-reader.ts`
- Modify: `packages/backend/convex/http.ts`
- Test: `packages/backend/tests/backing-payment-records.test.mjs`
- Test: `packages/backend/tests/hedera-funding-receipt-reader.test.mjs`

**Interfaces:**
- Consumes: the existing `externalPrepareCommandAttempts` row keyed by `idempotencyKey` and M43 state literals.
- Produces: `recordBackingPayment({ attemptPublicId, canonicalSignerAddress, transactionHash })` and `readBackingPayment({ canonicalSignerAddress, offeringPublicId })` protected functions.

- [ ] **Step 1: Write the failing tests**

```js
assert.deepEqual(await records.recordBackingPaymentForTest(ctx, validInput, verifiedReceipt), {
  status: "CONFIRMED",
  transactionHash: validInput.transactionHash,
});
assert.equal(await records.recordBackingPaymentForTest(ctx, wrongSigner, verifiedReceipt), null);
assert.equal(await records.recordBackingPaymentForTest(ctx, validInput, wrongValueReceipt), null);
```

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend -- tests/backing-payment-records.test.mjs tests/hedera-funding-receipt-reader.test.mjs`

Expected: FAIL because the backing-record module and the receipt reader do not exist.

- [ ] **Step 3: Implement the bounded verifier and internal Convex functions**

```ts
export type HederaFundingReceipt = Readonly<{
  hash: `0x${string}`; chainId: 296; from: string; to: string; value: bigint; status: "0x1";
}>;

export const recordBackingPayment = internalAction({
  args: { attemptPublicId: v.string(), canonicalSignerAddress: v.string(), transactionHash: v.string() },
  returns: backingPaymentOutcomeValidator,
  handler: async (ctx, args) => verifyAndRecord(ctx, args),
});
```

Read exactly one bounded JSON-RPC transaction and receipt pair from the pinned
Hedera Testnet endpoint. Validate canonical fields before a mutation can change
the attempt, preserve an identical recorded hash idempotently, and reject a
different hash or mismatched signer/amount/target. Add the protected
`/internal/backing-payment` HTTP route using the established ingress verifier;
the endpoint accepts only a server assertion and invokes the internal action.

- [ ] **Step 4: Run the focused tests to verify GREEN**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/backend -- tests/backing-payment-records.test.mjs tests/hedera-funding-receipt-reader.test.mjs`

Expected: PASS for valid confirmation, pending evidence, invalid signer, target,
value, chain, status, malformed hash, conflict, and read projection cases.

- [ ] **Step 5: Commit**

```bash
git add packages/backend/convex/backing_payment_records.ts packages/backend/convex/http.ts packages/backend/src/ats/hedera-funding-receipt-reader.ts packages/backend/tests/backing-payment-records.test.mjs packages/backend/tests/hedera-funding-receipt-reader.test.mjs
git commit -m "feat: verify backing payment records"
```

### Task 2: Authenticated web relay and reload-safe backing projection

**Files:**
- Create: `apps/web/src/lib/backing-payment-server.ts`
- Create: `apps/web/src/app/api/backing/payment/route.ts`
- Modify: `apps/web/src/lib/riskscan-backing-projection.ts`
- Test: `apps/web/tests/backing-payment-api.test.mjs`
- Test: `apps/web/tests/riskscan-backing-projection.test.mjs`

**Interfaces:**
- Consumes: `POST /internal/backing-payment`, dashboard session validation, and `{ attemptPublicId, transactionHash }`.
- Produces: `POST /api/backing/payment` and a BackingProjection including a safe backing record for the current session.

- [ ] **Step 1: Write the failing tests**

```js
const response = await handleBackingPaymentRequest(requestWithSession, env, { forward });
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { status: "CONFIRMED", transactionHash });
assert.equal((await handleBackingPaymentRequest(requestWithWrongOrigin, env)).status, 401);
```

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- tests/backing-payment-api.test.mjs tests/riskscan-backing-projection.test.mjs`

Expected: FAIL because the API handler and backing record projection do not exist.

- [ ] **Step 3: Implement the server-only forwarding path**

```ts
export async function handleBackingPaymentRequest(request: Request, env: DashboardAuthEnvironment): Promise<Response> {
  // require exact dashboard origin and valid session;
  // parse only attemptPublicId + lower-case transactionHash;
  // sign the fixed protected-ingress assertion and bound the upstream response.
}
```

Reuse the session-cookie, origin, bounded-body, HMAC, and response-size rules in
`provider-tools-server.ts`; do not use browser environment values or a client
side Convex credential. The route fails closed and returns no attempt data for
another signer.

- [ ] **Step 4: Run the focused tests to verify GREEN**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- tests/backing-payment-api.test.mjs tests/riskscan-backing-projection.test.mjs`

Expected: PASS for valid forwarding and all origin/session/body/configuration
rejections.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/backing-payment-server.ts apps/web/src/app/api/backing/payment/route.ts apps/web/src/lib/riskscan-backing-projection.ts apps/web/tests/backing-payment-api.test.mjs apps/web/tests/riskscan-backing-projection.test.mjs
git commit -m "feat: relay backing payment verification"
```

### Task 3: Back page and backer dashboard proof

**Files:**
- Modify: `apps/web/src/components/backing/backing-flow.tsx`
- Modify: `apps/web/src/components/backing/backing-state.ts`
- Modify: `apps/web/src/lib/dashboard-campaign.ts`
- Modify: `apps/web/src/components/dashboard/dashboard-campaign.tsx`
- Test: `apps/web/tests/backing-state.test.mjs`
- Test: `apps/web/tests/backing-route.test.mjs`
- Test: `apps/web/tests/dashboard-campaign.test.mjs`

**Interfaces:**
- Consumes: the backing-payment API’s durable `{ status, transactionHash }` result and a server projection restricted to the dashboard signer.
- Produces: `payment_confirmed`, pending, rejected, and unknown UI states plus a concise **Your backing** dashboard card.

- [ ] **Step 1: Write the failing tests**

```js
assert.match(renderedBackPage, /Payment confirmed/u);
assert.match(renderedDashboard, /Your backing/u);
assert.match(renderedDashboard, /View on HashScan/u);
assert.doesNotMatch(renderedDashboard, /Units issued|Payout/u);
```

- [ ] **Step 2: Run the focused tests to verify RED**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- tests/backing-state.test.mjs tests/backing-route.test.mjs tests/dashboard-campaign.test.mjs`

Expected: FAIL because M56 exposes only `payment_submitted` and the dashboard
does not project a backer record.

- [ ] **Step 3: Implement the minimum presentation change**

```tsx
{record.status === "CONFIRMED" ? <Badge>Payment confirmed</Badge> : null}
<a href={hashscanTransactionUrl(record.transactionHash)} rel="noreferrer">View on HashScan</a>
```

After MetaMask returns the hash, call the same-origin server endpoint once and
render only its durable response. Retain M56’s one-send lock and truthful
allocation-pending language; a browser failure displays unknown rather than
offering a resend. The dashboard card is visible only for the session signer
with a record and does not make an issuer campaign claim.

- [ ] **Step 4: Run the focused tests to verify GREEN**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web -- tests/backing-state.test.mjs tests/backing-route.test.mjs tests/dashboard-campaign.test.mjs`

Expected: PASS for confirmed/pending/unknown/rejected rendering, safe HashScan
link, reload projection, and no allocation or payout assertion.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/backing/backing-flow.tsx apps/web/src/components/backing/backing-state.ts apps/web/src/lib/dashboard-campaign.ts apps/web/src/components/dashboard/dashboard-campaign.tsx apps/web/tests/backing-state.test.mjs apps/web/tests/backing-route.test.mjs apps/web/tests/dashboard-campaign.test.mjs
git commit -m "feat: show verified backing proof"
```

### Task 4: Integration verification and draft PR

**Files:**
- Modify: `docs/work-queue/STATE.md`
- Modify: `docs/work-queue/queue/20-active/M58-T010-verified-backing-record.md`

- [ ] **Step 1: Run integration checks**

Run: `env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck && env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test && env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint && env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build && env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run queue:check && git diff --check`

Expected: all commands pass; tests use fixtures and do not execute a live action.

- [ ] **Step 2: Review the net diff and exact base**

Run: `git fetch origin main && git log --oneline origin/main..HEAD && git diff --check origin/main...HEAD`

Expected: only M58 commits are present and no whitespace error exists.

- [ ] **Step 3: Commit the verification record and open a draft PR**

```bash
git add docs/work-queue/STATE.md docs/work-queue/queue/20-active/M58-T010-verified-backing-record.md
git commit -m "docs: record verified backing validation"
gh pr create --draft --title "feat: verify backing payment records" --base main
```

## Plan self-review

- Spec coverage: Task 1 supplies exact binding, bounded verification and durable
  state; Task 2 supplies same-signer session ingress; Task 3 supplies both
  requested UI surfaces; Task 4 preserves the no-live-action verification and
  exact-head PR gates.
- Placeholder scan: no deferred implementation marker appears; each task gives
  exact paths, an interface, red command, implementation shape, green command,
  and commit.
- Type consistency: Task 1 returns the `{ status, transactionHash }` object
  Task 2 relays, and Task 3 consumes. The attempt key is `attemptPublicId`
  throughout; `transactionHash` is canonical lower-case `0x` + 64 hex.
