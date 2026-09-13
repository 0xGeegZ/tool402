# Public Testnet Self-Service Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an authenticated, previously unknown Hedera Testnet wallet create and deploy its own supported tool and back another eligible OPEN offering without manual authority insertion.

**Architecture:** A server-provisioned, durable self-service membership provides command-scoped access without creating ambiguous legacy `commandAuthorities` rows. Existing M55 selected-tool identities and M58 payment records remain the ownership and recovery boundaries; new projections are explicitly offering/attempt scoped. A backend-only flag, durable account state, and server-side limits gate every new self-service write.

**Tech Stack:** TypeScript, Convex, Next.js App Router, React, viem, Hedera Testnet chain 296, Node 22.21.1; no new dependency.

**Spec:** [public self-service design](../specs/2026-09-13-public-testnet-self-service-onboarding-design.md)

## Global Constraints

- Keep the dashboard challenge/session, HMAC, Origin, expiry, replay, MetaMask-signature, and transaction-confirmation boundaries intact.
- `TOOL402_PUBLIC_TESTNET_SELF_SERVICE_ENABLED` is false unless configured; `TOOL402_SELF_SERVICE_MAX_TOOLS` and `TOOL402_SELF_SERVICE_MAX_PENDING_ATTEMPTS` are parsed server-side and fail closed.
- Preserve legacy RiskScan, manually provisioned authorities, B03/x402, and mainnet behavior byte-for-byte where the selected branch does not apply.
- Use chain 296 only. No user private key, platform-funded gas, automatic payment, arbitrary user code hosting, shared deployment, data migration, or live wallet action.
- Run tests using Node 22.21.1; a passing local/injected test is not a claim of deployed or live testnet proof.

## File map

- `packages/backend/convex/self_service_accounts.ts`: atomic membership provisioning, account status, capability resolution, limits, and protected reads.
- `packages/backend/convex/provider_session_ingress.ts`: closed HMAC assertion variants for ensure/read operations.
- `packages/backend/convex/schema.ts`: additive account, rate-limit, recipient-policy, and scoped backing indexes.
- `packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts` and `convex/*admission*.ts`: selected, durable capability checks.
- `packages/backend/src/ats/provider-tool-ats-configuration.ts` and `apps/web/src/lib/ats/*`: per-tool owner-bound ATS configurations and browser allowlists.
- `packages/backend/convex/backing_payment_*.ts` and `apps/web/src/lib/*backing*`: offering-scoped projection, frozen terms/recipient, payment claims, and recovery.
- `apps/web/src/lib/self-service-server.ts`, dashboard/provider/backer components, and route tests: authenticated UX and explicit unavailable/error states.

### Task 0: Establish the local specification and control record

**Files:**
- Create: `docs/superpowers/specs/2026-09-13-public-testnet-self-service-onboarding-design.md`
- Create: `docs/work-queue/queue/00-inbox/M59-T010-public-testnet-self-service-onboarding.md`
- Modify: `docs/work-queue/{STATE,DECISIONS,TASK-CATALOG,FILE-OWNERSHIP}.md`

- [ ] **Step 1: Verify the design is complete**

Run a placeholder scan over the design document.

Expected: no placeholder markers are found.

- [ ] **Step 2: Verify queue links and whitespace**

Run: `npm run queue:check && git diff --check`

Expected: `QUEUE_CHECK_OK` and no whitespace output.

- [ ] **Step 3: Commit the specification gate**

Run: `git add docs && git commit -m "docs: define public testnet onboarding"`

Expected: one documentation-only commit before executable work.

### Task 1: Add atomic, disabled-by-default self-service membership

**Files:**
- Create: `packages/backend/convex/self_service_accounts.ts`
- Create: `packages/backend/tests/self-service-accounts.test.mjs`
- Modify: `packages/backend/convex/schema.ts`, `packages/backend/convex/provider_session_ingress.ts`, `packages/backend/convex/http.ts`
- Modify: `apps/web/src/lib/dashboard-auth/dashboard-auth-routes.ts`, `apps/web/tests/dashboard-auth-routes.test.mjs`, `packages/backend/tests/provider-session-ingress.test.mjs`

**Interfaces:**

```ts
type SelfServiceAccount = Readonly<{
  canonicalSignerAddress: string;
  principalPublicId: string;
  policyVersion: "public_testnet_v1";
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
}>;

ensureSelfServiceAccount({ canonicalSignerAddress, sessionExpiresAt }):
  Promise<{ outcome: "ACTIVE" | "DISABLED" | "SUSPENDED" | "UNAVAILABLE" }>;
```

- [ ] **Step 1: Write RED backend contracts**

Create A/B tests that invoke concurrent `ensure` calls for A and assert one
indexed row with a stable principal; assert a later A session returns the same
row; assert disabled/config-missing, suspended, revoked, malformed address,
expired assertion, altered HMAC body, replayed nonce, and browser-direct
requests create zero rows.

- [ ] **Step 2: Run the RED contracts**

Run: `npm run test --workspace=@tool402/backend -- tests/self-service-accounts.test.mjs tests/provider-session-ingress.test.mjs`

Expected: failures because the account mutation and closed assertion variant do not exist.

- [ ] **Step 3: Implement minimal additive storage and ingress**

```ts
const derivedPrincipal = `self_service_${canonicalSignerAddress.slice(2)}`;
// Transactionally return an exact existing record; insert only when no record
// exists and the server-only flag/configuration is valid. Never update status
// or policy version from a session assertion.
```

Use an exact HMAC body variant such as `{ type: "self_service_ensure",
canonicalSignerAddress, sessionExpiresAt }`; expose it only through the
existing server assertion path. Invoke it after successful dashboard challenge
verification and before writing the session cookie, returning a clear
unavailable state rather than an authenticated-looking button.

- [ ] **Step 4: Run GREEN and regression contracts**

Run: `npm run test --workspace=@tool402/backend -- tests/self-service-accounts.test.mjs tests/provider-session-ingress.test.mjs && npm run test --workspace=@tool402/web -- tests/dashboard-auth-routes.test.mjs`

Expected: all targeted tests pass.

- [ ] **Step 5: Commit the membership boundary**

Run: `git add packages/backend apps/web && git commit -m "feat: provision self-service memberships"`

### Task 2: Resolve command-scoped provider and backer capabilities

**Files:**
- Modify: `packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts`, `packages/backend/convex/wallet_command_replay.ts`, `packages/backend/convex/external_prepare_command_admission.ts`, `packages/backend/convex/command_dispatch.ts`, `packages/backend/convex/provider_tools.ts`
- Test: `packages/backend/tests/{authenticated-wallet-command-normalizer,external-prepare-command-durable-admission,offering-command-admission,provider-tools,command-dispatch}.test.mjs`

**Interfaces:**

```ts
type ResolvedCommandCapability = Readonly<{
  principalPublicId: string;
  authorityVersion: "public_testnet_v1" | string;
  capability: "TOOL_CREATE" | "TOOL_OPERATE" | "BACK_OFFERING";
}>;
resolveCapability(signer, command): Promise<ResolvedCommandCapability | null>;
```

- [ ] **Step 1: Write RED A/B authorization cases**

Cover A creates A's tool; B cannot create/edit/prepare/attach/publish it;
A can be both tool owner and backer without row collisions; B may prepare
funding only for A's OPEN offering; altered subject, owner, principal,
policy-version, role, amount, recipient, offering version, and disabled
membership reject before a durable write. Keep the existing legacy issuer and
RiskScan cases unchanged.

- [ ] **Step 2: Run RED cases**

Run: `npm run test --workspace=@tool402/backend -- tests/authenticated-wallet-command-normalizer.test.mjs tests/external-prepare-command-durable-admission.test.mjs tests/offering-command-admission.test.mjs`

Expected: new self-service cases fail without weakening an existing assertion.

- [ ] **Step 3: Implement selected capability resolution and durable recheck**

```ts
if (operationKind === "HEDERA_FUNDING") {
  assert(activeMembership && offering.state === "OPEN" && offering.owner !== signer);
} else {
  assert(activeMembership && selectedTool.owner === signer);
}
```

Resolve only from the recovered signer plus durable operation/target; do not
accept a browser role. Re-execute the same check in every mutation/replay
branch immediately before insertion or state advancement.

- [ ] **Step 4: Run GREEN cases and typecheck**

Run: `npm run test --workspace=@tool402/backend -- tests/authenticated-wallet-command-normalizer.test.mjs tests/external-prepare-command-durable-admission.test.mjs tests/offering-command-admission.test.mjs tests/provider-tools.test.mjs tests/command-dispatch.test.mjs && npm run typecheck --workspace=@tool402/backend`

Expected: targeted tests and backend typecheck pass.

- [ ] **Step 5: Commit the authorization slice**

Run: `git add packages/backend && git commit -m "feat: scope self-service command access"`

### Task 3: Bind new ATS deployment configuration to each owner tool

**Files:**
- Modify: `packages/backend/src/ats/provider-tool-ats-configuration.ts`, `packages/backend/convex/{ats_prepare_authority,stage_b_ats_create_runtime_binding,provider_tool_receipts,ats_candidate_receipts,ats_receipt_verification}.ts`
- Modify: `apps/web/src/lib/ats/{factory-deploy-bond,provider-tool-ats-projection,stage-b-ats-create-execution-projection,stage-b-ats-create-command-projection}.ts`
- Test: existing corresponding backend/web ATS, Factory, receipt, and projection contracts.

- [ ] **Step 1: Write RED per-owner configuration cases**

For distinct A/B tool IDs with equal titles, independently decode Factory
calldata and assert distinct owner/admin/info/digest/calldata. Reject a swapped
tool, foreign signer, arbitrary admin/target/calldata, duplicate asset/hash,
and stale/revoked membership. Assert every legacy RiskScan calldata and digest
fixture remains byte-identical.

- [ ] **Step 2: Establish the caller model with read-only evidence**

Run the existing Factory artifact/ABI unit fixtures and a non-mutating testnet
call simulation using configured public read endpoints only. Record the
factory caller requirement in the PR; if it rejects arbitrary caller creation,
keep self-service ATS unavailable and stop before claiming deployment support.

- [ ] **Step 3: Implement server-derived configuration and corroboration**

```ts
const config = createProviderToolAtsConfiguration({
  toolPublicId, subjectPublicId, title: admitted.title,
  canonicalSignerAddress: membership.canonicalSignerAddress,
});
assert(receipt.input === encodeFactoryDeployBond(config));
```

Reconstruct this configuration on preparation, attachment, receipt read, and
final mutation. Keep fixed Factory/Resolver/ABI/network controls and preserve
M55/M54 recovery without re-sending a transaction.

- [ ] **Step 4: Run GREEN ATS/receipt suites**

Run: `npm run test --workspace=@tool402/backend -- tests/provider-tool-ats-configuration.test.mjs tests/provider-tool-receipt.test.mjs tests/provider-tool-receipts.test.mjs tests/ats-candidate-receipts.test.mjs && npm run test --workspace=@tool402/web -- tests/factory-deploy-bond.test.mjs tests/provider-tool-ats-projection.test.mjs tests/stage-b-ats-create-execution-projection.test.mjs`

Expected: all focused suites pass with no wallet submission.

- [ ] **Step 5: Commit the ATS binding slice**

Run: `git add packages/backend apps/web && git commit -m "feat: bind self-service ATS deployments"`

### Task 4: Generalize public offering projection and frozen backing terms

**Files:**
- Modify: `packages/backend/convex/{backing_payment_records,backing_payment_store,backing_payment_claims,provider_session_ingress}.ts`, `packages/backend/convex/schema.ts`
- Modify: `apps/web/src/lib/{riskscan-backing-projection,backing-payment-server}.ts`, `apps/web/src/app/api/backing/payment/{route.ts,reserve/route.ts}`
- Test: `packages/backend/tests/backing-payment-records.test.mjs`, `apps/web/tests/{riskscan-backing-projection,backing-payment-api,backing-route}.test.mjs`

- [ ] **Step 1: Write RED offering-scoped payment cases**

Seed OPEN A and B offerings plus DRAFT/CLOSED variants. Assert B can reserve
and confirm only A's terms, not a self-transfer; recipient, version, units,
tinybars, and purchase intent are server-recomputed/frozen; two attempts
cannot claim one hash; a reload/unknown receipt cannot trigger a second send;
RiskScan keeps its configured treasury and routes.

- [ ] **Step 2: Run the RED payment cases**

Run: `npm run test --workspace=@tool402/backend -- tests/backing-payment-records.test.mjs && npm run test --workspace=@tool402/web -- tests/riskscan-backing-projection.test.mjs tests/backing-payment-api.test.mjs`

Expected: generic-offering and recipient-freeze cases fail.

- [ ] **Step 3: Implement server-owned selection and immutable attempt terms**

```ts
const terms = readOpenOfferingTerms(offering);
const recipient = offering.isLegacyRiskScan ? legacyTreasury : offering.owner;
assert(recipient !== canonicalSignerAddress);
storeAttempt({ offeringPublicId, offeringVersion, recipient, tinybars: calculateTinybars(terms, units) });
```

Read the exact stored tuple when binding/verifying; do not consult a mutable
current offering to reinterpret a reviewed transaction.

- [ ] **Step 4: Run GREEN payment and recovery suites**

Run: `npm run test --workspace=@tool402/backend -- tests/backing-payment-records.test.mjs tests/external-prepare-command-recovery.test.mjs && npm run test --workspace=@tool402/web -- tests/riskscan-backing-projection.test.mjs tests/backing-payment-api.test.mjs tests/backing-route.test.mjs`

Expected: payment, uniqueness, and recovery tests pass without wallet RPC.

- [ ] **Step 5: Commit the backing slice**

Run: `git add packages/backend apps/web && git commit -m "feat: support self-service offering backing"`

### Task 5: Deliver the authenticated provider/backer UX and limits

**Files:**
- Create: `apps/web/src/lib/self-service-server.ts`, `apps/web/tests/self-service-onboarding.test.mjs`
- Modify: `apps/web/src/components/dashboard/{dashboard-campaign,dashboard-identity}.tsx`, `apps/web/src/components/provider/deploy/{new-tool-action,provider-deploy-wizard,deploy-stage-signing}.tsx`, `apps/web/src/components/backing/backing-flow.tsx`, relevant dashboard/provider/back route pages.

- [ ] **Step 1: Write RED browser-facing behavior contracts**

Use injected server/wallet seams to cover fresh and pre-existing sessions,
flag-off/unavailable/revoked states, intended-destination sign-in return,
both `Your tools` and `Your backing`, faucet link, wrong network, insufficient
balance, expired session, A-session/B-wallet mismatch, rejected signature,
pending receipt, and recovery controls. Assert every recovery/status control
makes zero `eth_sendTransaction` calls.

- [ ] **Step 2: Run RED UI contracts**

Run: `npm run test --workspace=@tool402/web -- tests/self-service-onboarding.test.mjs tests/provider-tool-journey.test.mjs tests/backing-route.test.mjs`

Expected: new public-self-service states fail before implementation.

- [ ] **Step 3: Implement explicit, session-derived UI projections**

```tsx
{state.kind === "unavailable" ? <UnavailableNotice retryHref={returnTo} /> : null}
{state.kind === "active" ? <SelfServiceDashboard tools={state.tools} backing={state.backing} /> : null}
```

Use protected server reads only; no browser identity/permission decision. Reuse
the existing wallet-session account/chain check immediately before a signature
or send. Render honest supported-template wording rather than claiming API
hosting.

- [ ] **Step 4: Run GREEN UI and accessibility suites**

Run: `npm run test --workspace=@tool402/web -- tests/self-service-onboarding.test.mjs tests/provider-tool-journey.test.mjs tests/deploy-stage-signing.test.mjs tests/backing-route.test.mjs && npm run typecheck --workspace=@tool402/web`

Expected: focused web tests and typecheck pass.

- [ ] **Step 5: Commit the UI slice**

Run: `git add apps/web && git commit -m "feat: guide self-service onboarding"`

### Task 6: Validate operational controls and deliver release material

**Files:**
- Modify: current M59 card/design/README or onboarding guidance, `.env.example` only when this repository already documents public variable names.
- Create: `docs/work-queue/evidence/M59-T010-release-guide.md`, `docs/work-queue/evidence/M59-T010-security-review.md`
- Test: feature/membership/authorization/ATS/backing/web contracts from Tasks 1–5.

- [ ] **Step 1: Add control regression cases**

Assert feature-flag-off blocks new membership/tool/funding writes while reads
and reconciliation remain available; quota/rate limits survive refresh and
concurrent requests; suspension/revocation blocks new writes but not history;
bounded malformed inputs do not reach a mutation.

- [ ] **Step 2: Run all focused, package, and root checks**

Run: `npm test && npm run typecheck && npm run lint && npm run queue:check && git diff --check`

Expected: every command exits zero. Run `npm run build` under Node 22.21.1 and
record any environment-only failure separately.

- [ ] **Step 3: Write release and rollback evidence**

Document exact environment variable names, additive schema-first rollout,
disabled-flag deployment, operator enablement, non-destructive rollback,
two-wallet browser checklist, and the distinction between automated/local and
deployed-testnet proof. Do not include values or secrets.

- [ ] **Step 4: Perform an authorization-focused final review**

Review all current-branch changes for cross-user reads/writes, altered command
fields, durable rechecks, recipient/amount binding, replay/hash races,
legacy compatibility, and frontend-only gates. Record each result in the
security review document.

- [ ] **Step 5: Commit delivery material and open/update the draft PR**

Run: `git add docs .env.example && git commit -m "docs: add self-service release guide"`

Push the feature branch and create/update a draft PR titled
`feat: public testnet self-service onboarding`.

## Final acceptance matrix

- [ ] A and B independently sign in, are provisioned once, create separate tools, and cannot operate each other's tools.
- [ ] A can be provider and backer; B backs A's OPEN offering; DRAFT/CLOSED/self-transfer cases reject.
- [ ] ATS receipt/candidate/hash/asset binding remains per tool and survives reload without re-send.
- [ ] Feature flag, limits, revoked accounts, origin/HMAC/replay/session/wallet mismatch, and malformed inputs fail closed.
- [ ] Legacy RiskScan provider and backing behavior passes its existing regression suites.
- [ ] Root test, typecheck, lint, queue/reference guard, diff check, build, and separate authorization review are recorded.
