# RiskScan Settlement Observer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, private, best-effort server observation seam that delivers an exact core verified-settlement capability only after a successful compatible protected Quick settlement.

**Architecture:** Keep all state closure-local to the x402 server helper. The pure public Quick helper stays assessment-only. When a server-owned consumer is supplied, a private protected Quick handler registers an issued core pending capability under digests of the selected v2 payment-signature string and the exact generated response bytes. x402 lifecycle hooks consume it only on a successful, after-handler, same-network settlement with a nonblank transaction. Every abnormal path deletes the entry; no response, persistence, UI state, or external claim is created.

**Tech Stack:** TypeScript, Next.js route handlers, installed x402 packages, Node.js `crypto`, Node.js built-in test runner, npm workspaces.

**Spec:** `docs/specs/m03-riskscan-settlement-observer.md`

## Global Constraints

- Use the committed Node 22.21.1 runtime and no new dependency.
- Modify only `apps/web/src/lib/riskscan-x402.ts` and `apps/web/tests/riskscan-api.test.mjs` for implementation.
- Do not make `runRiskScanQuick` an issuance path or expose the observer map, header string, digest, pending state, or settlement capability through HTTP.
- Use only `payment-signature` for registration; never deliberately fall back to another header representation.
- Keep the observer disabled when no explicit server-owned consumer is supplied.
- Preserve native x402 response status, body, and payment headers even if local observation fails.
- Add no persistence, replay guarantee, backend/API/UI feature, runtime configuration, wallet/account action, payment action, receipt/evidence capture, deployment, or live claim.
- Run the enabled local-reference guard before every non-empty commit.

---

## File structure

- `apps/web/src/lib/riskscan-x402.ts` owns private Quick evaluation, optional closure-local observer registration, digest/correlation/cleanup helpers, and x402 lifecycle-hook wiring.
- `apps/web/tests/riskscan-api.test.mjs` owns fake-facilitator integration tests for the protected handler, emitted core capability, negative paths, digest collision isolation, timeout cleanup, and response preservation.

### Task 1: Add the optional protected settlement observer

**Files:**

- Modify: `apps/web/src/lib/riskscan-x402.ts`
- Modify: `apps/web/tests/riskscan-api.test.mjs`

**Interfaces:**

- Consumes: accepted `@tool402/core` request/pending/verified-settlement lifecycle functions and the installed x402 HTTP hook contexts.
- Produces: an optional server-owned callback receiving an exact `RiskScanVerifiedSettlement`; no HTTP output, persistence, or public registry.

- [ ] **Step 1: Write the failing protected-handler contracts**

Add a local successful-settlement facilitator and a callback collector. First assert that the callback is not invoked by a direct `runRiskScanQuick` call, an unsigned challenge, or invalid Quick input. Then write the expected successful protected flow:

```js
const settlements = [];
const handler = await createRiskScanProtectedHandler(configuration, {
  facilitatorClient: settlingFacilitator.client,
  onVerifiedSettlement: (settlement) => settlements.push(settlement),
});

const response = await handler(signedValidRequest);
assert.equal(response.status, 200);
assert.match(response.headers.get("payment-response") ?? "", /\S/u);
assert.equal(settlements.length, 1);
```

Use an accepted core transition such as receipt/evidence binding to prove the callback value is a genuine exact core capability. Add negative tests for settlement failure, wrong result network, blank/whitespace/non-string transaction, a consumer throw, duplicate active header with a differing Quick response, and a short test-only local timeout. Assert all negative paths emit no capability and preserve the relevant native x402 response shape.

- [ ] **Step 2: Run the focused web test to verify RED**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
```

Expected: FAIL because the current handler has no optional consumer, no private issued pending state, no lifecycle hook wiring, and no transient correlation cleanup.

- [ ] **Step 3: Split pure Quick evaluation from protected issuance**

Refactor the private parsing/evaluation flow so `runRiskScanQuick` remains behaviorally identical and never receives an observer callback. Add a private protected-only wrapper that sees a validated Quick result, creates the response, and registers an issued core pending state only if an explicit server-owned consumer exists and the request has a nonblank `payment-signature` string.

Add a private closure-local observer that:

1. hashes the selected header string and exact generated response bytes without returning or logging either value;
2. retains at most the first active entry per header digest and sets a fixed bounded cleanup timeout;
3. registers x402 after-settle, settle-failure, and verified-payment-cancel hooks;
4. accepts an entry only for v2, `after-handler`, successful, configured-network result/requirements, nonblank trimmed transaction, and matching response digest;
5. deletes before calling `createRiskScanVerifiedSettlement` and the consumer; and
6. catches every observer/core/consumer failure internally and fail-closes by deleting the entry.

When no consumer is supplied, do not construct the observer or alter the cached/default protected handler.

- [ ] **Step 4: Run the focused web checks to verify GREEN**

Run:

```bash
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/web
```

Expected: PASS. A successful local settlement invokes the supplied consumer exactly once with a genuine capability; all observer failures and duplicates fail closed without changing the protected response contract.

- [ ] **Step 5: Commit the isolated web change**

Run:

```bash
git add apps/web/src/lib/riskscan-x402.ts apps/web/tests/riskscan-api.test.mjs
sh .git/tool402-local-guards/reference-check --staged
git diff --cached --check
git commit -m "feat: Observe RiskScan Settlements Locally"
```

Expected: one conventional commit containing only the owned web source and test files.

## Plan self-review

- Spec coverage: Task 1 covers protected-only issuance, header/response correlation, no overwrite/cross-binding, compatible settlement filtering, cleanup, callback isolation, and all stated exclusions.
- Placeholder scan: no placeholder markers or deferred implementation instructions remain.
- Type consistency: the core capability, callback, x402 hook context, selected-header, and response-byte boundaries are named consistently across the specification and task.
