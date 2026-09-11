# MetaMask Dashboard Sign-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require a user-initiated MetaMask signature before the server renders
the `/dashboard` route tree.

**Architecture:** Reuse the accepted UI-S15 MetaMask island only to obtain a
chain-gated account and request `personal_sign`. New server-only auth modules
seal a five-minute challenge and an eight-hour dashboard session with
HMAC-SHA-256. Thin same-origin routes issue and verify the challenge; a new
dashboard parent layout checks the signed session before it renders any child.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Web Crypto,
existing `viem` 2.56.1, Node 22.21.1 injected-fake tests.

**Spec:** `docs/specs/metamask-dashboard-sign-in.md`

**Follow-up:** The user-directed sandbox authority that is created after a
successful S38 signature is specified and planned separately in
`docs/specs/s39-sandbox-issuer-onboarding.md` and
`docs/superpowers/plans/2026-09-11-sandbox-issuer-onboarding.md`. It must not
be folded into S38 source work: S39 starts only after S38 acceptance and gives
the wallet only `offering.create` on its own `DRAFT` subject.

## Global Constraints

- Before source work, the human creates `S38-T010` in `00-inbox` and the root
  records its card, UI manifest, catalog row, ownership, readiness, activation,
  and durable RED authorization. This planning PR grants none of that authority.
- Do not add a package, database, durable identity record, role, allowlist,
  balance, external HTTP call, analytics, wallet connector, or browser storage.
- Reuse `WalletIsland` and `readCurrentSession`; do not modify UI-S15/M50 wallet
  selection, chain switching, command signing, relay, or provider event code.
- Accept only the configured HTTPS origin, chain `0x128`, a lower-case EVM
  address, a 22-character base64url nonce, a five-minute challenge, and an
  eight-hour session.
- Never log or return a secret, cookie payload, signature, wallet address,
  verifier error, or configuration detail.
- Protect pages under `/dashboard` only. Existing public APIs and routes keep
  their current contracts and are not authentication evidence.
- Do not activate the task until the exact canonical `main` Web baseline is
  independently green.

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/Web/src/lib/dashboard-auth/dashboard-auth.ts` | Validates config and inputs; creates/parses HMAC envelopes; builds the exact message; verifies injected signatures; issues and reads sessions. |
| `apps/Web/src/lib/dashboard-auth/dashboard-auth-routes.ts` | Converts same-origin `Request` objects into closed challenge, verify, and logout responses without exposing internals. |
| `apps/Web/src/app/api/auth/metamask/challenge/route.ts` | POST-only wrapper around the challenge handler. |
| `apps/Web/src/app/api/auth/metamask/verify/route.ts` | POST-only wrapper around the verification handler. |
| `apps/Web/src/app/api/auth/logout/route.ts` | POST-only wrapper around the logout handler. |
| `apps/Web/src/app/sign-in/page.tsx` | Redirects an already-valid session or renders the public sign-in boundary. |
| `apps/Web/src/components/auth/metamask-dashboard-sign-in.tsx` | Calls the three local auth endpoints and `personal_sign` only after the accepted wallet island reports a current connected session. |
| `apps/Web/src/app/dashboard/layout.tsx` | Server-side session gate for all dashboard descendants. |
| `apps/Web/src/app/dashboard/page.tsx` | Replaces only the inaccurate `Guest dashboard` eyebrow. |
| `apps/Web/tests/dashboard-auth.test.mjs` | Injected crypto/verifier and static client/guard contracts. |
| `apps/Web/tests/dashboard-auth-routes.test.mjs` | HTTP response, cookie, origin, and closed-body contracts. |
| `apps/Web/tests/dashboard-workspace-reconciliation.test.mjs` | Replaces only the guest-only assertions invalidated by the server guard; retains local journey and no-account-data assertions. |

### Task 1: Record the runtime authority before source work

**Files:**

- Create: `docs/work-queue/queue/00-inbox/S38-T010-metamask-dashboard-sign-in.md`
- Create: `docs/ui/UI-S38.md`
- Modify: `docs/work-queue/TASK-CATALOG.md`
- Modify: `docs/work-queue/FILE-OWNERSHIP.md`
- Modify: `docs/work-queue/STATE.md`

**Interfaces:**

- Consumes: `docs/specs/metamask-dashboard-sign-in.md`, UI-S15, and M50.
- Produces: a dependency-satisfied, root-owned `S38-T010` intake with the
  exact source and test paths in the file-structure table.

- [ ] **Step 1: Have the human add the S38 intake and UI manifest**

  Copy the fixed protocol, configuration names, cookie names, route paths,
  source paths, test paths, no-API boundary, and human-only wallet-signature
  boundary from `docs/specs/metamask-dashboard-sign-in.md`. State that S26 is
  not a dependency and that the task cannot modify `app/layout.tsx` or
  `wallet-connect.tsx`.

- [ ] **Step 2: Reserve only the declared paths**

  Record the eight new source paths and three test paths in the catalog and
  ownership ledger. Reserve the existing dashboard page and reconciliation test
  only for their `Guest dashboard` wording change. Do not reserve nested
  dashboard pages, workspace components, public APIs, S26 paths, package files,
  or the lockfile.

- [ ] **Step 3: Establish a green canonical baseline**

  Run:

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
  ```

  Expected: all Web tests pass on the exact canonical `origin/main` SHA. If
  unrelated UI assertion failures remain, stop and have their owning task
  correct them; do not fold them into S38.

- [ ] **Step 4: Commit root-only authority records**

  ```bash
  git add docs/work-queue/queue/00-inbox/S38-T010-metamask-dashboard-sign-in.md docs/work-queue/TASK-CATALOG.md docs/work-queue/FILE-OWNERSHIP.md docs/work-queue/STATE.md docs/ui/UI-S38.md
  git commit -m "docs: Authorize MetaMask dashboard sign-in"
  ```

### Task 2: Write the durable RED contracts

**Files:**

- Create: `apps/Web/tests/dashboard-auth.test.mjs`
- Create: `apps/Web/tests/dashboard-auth-routes.test.mjs`
- Modify: `apps/Web/tests/dashboard-workspace-reconciliation.test.mjs`

**Interfaces:**

- Consumes: the accepted S38 card and specification.
- Produces: executable contracts for the absent auth modules, routes, client
  component, and dashboard layout.

- [ ] **Step 1: Write failing unit contracts for the auth core**

  Require these exact exports from
  `../src/lib/dashboard-auth/dashboard-auth.ts`:

  ```ts
  export const DASHBOARD_AUTH_CHAIN_ID = 296;
  export const CHALLENGE_MAX_AGE_SECONDS = 300;
  export const SESSION_MAX_AGE_SECONDS = 28_800;
  export function createChallenge(input: CreateChallengeInput, deps: AuthDependencies): Promise<ChallengeResult>;
  export function verifyChallenge(input: VerifyChallengeInput, deps: AuthDependencies): Promise<VerificationResult>;
  export function readDashboardSession(cookie: string | null, env: NodeJS.ProcessEnv, nowMilliseconds: number): Promise<DashboardSession | null>;
  ```

  Use fixed `nowMilliseconds`, random bytes, HMAC key, and injected
  `verifyMessage` function. Assert the exact message grammar, lower-case
  address, 22-character nonce, five-minute expiry, HMAC tamper rejection,
  origin mismatch rejection, signature grammar rejection, generic rejection,
  and an eight-hour session expiration.

  ```js
  test("rejects an altered challenge before signature verification", async () => {
    const challenge = await api.createChallenge(validChallengeInput, fixedDependencies);
    const result = await api.verifyChallenge({
      challengeCookie: tamper(challenge.cookie),
      message: challenge.message,
      signature: validSignature,
      origin: configuredOrigin,
    }, countingDependencies);

    assert.deepEqual(result, { kind: "rejected" });
    assert.equal(countingDependencies.verifyMessageCalls, 0);
  });
  ```

- [ ] **Step 2: Write failing HTTP and UI/guard contracts**

  Test `POST` only routes with native `Request` objects. Assert `503
  not_configured` before a cookie or verifier call; exact `Set-Cookie`
  attributes; `Cache-Control: no-store`; challenge clearing after rejection;
  and `204` logout clearing both cookie names. Source-parse the client to
  require `readCurrentSession`, `personal_sign`, the two MetaMask auth POST
  paths, and `window.location.assign("/dashboard")`; reject transaction,
  relay, storage, timer, and discovery references. Source-parse the dashboard
  layout to require server session validation and `redirect("/sign-in")`.

- [ ] **Step 3: Amend only the dashboard wording assertions**

  Replace the two `Guest dashboard` expectations in
  `dashboard-workspace-reconciliation.test.mjs` with `Dashboard`. Retain the
  six local route assertions and the prohibition on account, wallet, provider,
  balance, payment, transaction, receipt, evidence, funding, and live data in
  the reusable workspace components.

- [ ] **Step 4: Prove RED and commit only tests**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/Web/tests/dashboard-auth.test.mjs apps/Web/tests/dashboard-auth-routes.test.mjs
  git add apps/Web/tests/dashboard-auth.test.mjs apps/Web/tests/dashboard-auth-routes.test.mjs apps/Web/tests/dashboard-workspace-reconciliation.test.mjs
  git commit -m "test: Define dashboard sign-in contract"
  ```

  Expected: the focused command fails only because the declared auth modules,
  routes, client component, and dashboard layout are absent.

### Task 3: Implement sealed challenge and session primitives

**Files:**

- Create: `apps/Web/src/lib/dashboard-auth/dashboard-auth.ts`
- Modify: `apps/Web/tests/dashboard-auth.test.mjs`

**Interfaces:**

- Consumes: Task 2's `CreateChallengeInput`, `VerifyChallengeInput`, and
  `AuthDependencies` contracts.
- Produces: `createChallenge`, `verifyChallenge`, and `readDashboardSession`
  for route handlers and the dashboard layout.

- [ ] **Step 1: Add strict configuration and canonical serialization**

  Validate only the two environment variables from the spec. Decode the secret
  only after matching `/^[0-9a-f]{64}$/u`; validate an HTTPS origin with no
  credentials, query, hash, or non-root pathname. Serialize challenge payloads
  in the fixed field order `v,address,nonce,issuedAt,expiresAt,origin` and
  session payloads in the fixed field order `v,address,issuedAt,expiresAt`.
  Base64url-encode the UTF-8 payload and HMAC bytes without padding; compare
  decoded MAC bytes with a constant-time equal-length loop.

  ```ts
  const payload = JSON.stringify({ v: 1, address, nonce, issuedAt, expiresAt, origin });
  const mac = await signHmac(secretBytes, new TextEncoder().encode(payload));
  const envelope = `${toBase64Url(payload)}.${toBase64Url(mac)}`;
  ```

- [ ] **Step 2: Build and verify the exact sign-in message**

  Create the message literal specified above from the validated challenge;
  never parse a browser-supplied message permissively. `verifyChallenge`
  reconstructs the message, requires strict string equality, and invokes its
  injected `verifyMessage({ address, message, signature })` exactly once only
  after every cookie, time, origin, and signature grammar check passes.

  ```ts
  const expectedMessage = buildSignInMessage(challenge);
  if (message !== expectedMessage || !isCanonicalSignature(signature)) {
    return { kind: "rejected" };
  }
  if (!await dependencies.verifyMessage({ address: challenge.address, message, signature })) {
    return { kind: "rejected" };
  }
  ```

- [ ] **Step 3: Issue and read sessions**

  On a verified challenge, create the fixed eight-hour session envelope. Make
  `readDashboardSession` return only `{address,issuedAt,expiresAt}` for a
  valid current envelope and `null` for every missing, malformed, expired, or
  tampered value. Keep crypto, clock, random, and signature seams injectable;
  make no filesystem, database, provider, fetch, or logging call.

- [ ] **Step 4: Prove the core GREEN contract and commit**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/Web/tests/dashboard-auth.test.mjs
  git add apps/Web/src/lib/dashboard-auth/dashboard-auth.ts apps/Web/tests/dashboard-auth.test.mjs
  git commit -m "feat: Add sealed dashboard auth primitives"
  ```

### Task 4: Add fail-closed same-origin route handlers

**Files:**

- Create: `apps/Web/src/lib/dashboard-auth/dashboard-auth-routes.ts`
- Create: `apps/Web/src/app/api/auth/metamask/challenge/route.ts`
- Create: `apps/Web/src/app/api/auth/metamask/verify/route.ts`
- Create: `apps/Web/src/app/api/auth/logout/route.ts`
- Modify: `apps/Web/tests/dashboard-auth-routes.test.mjs`

**Interfaces:**

- Consumes: Task 3's core auth functions and `process.env`.
- Produces: POST-only `challenge`, `verify`, and `logout` handlers.

- [ ] **Step 1: Decode exact bodies and origins before side effects**

  Require exactly one own `address` string for challenge and exactly own
  `message` and `signature` strings for verify. Reject arrays, inherited keys,
  accessors, extra keys, invalid content type, and a missing or unequal
  `Origin` with the closed generic response. Do not call a verifier or set a
  session cookie on rejection.

- [ ] **Step 2: Materialize only the declared responses**

  Use helper constructors so both cookies are host-only, `Secure`,
  `HttpOnly`, `SameSite=Strict`, `Path=/`, and use the documented max ages.
  Every response sets `Cache-Control: no-store`. Challenge success returns the
  message and expiry only; verify success returns `{ "outcome": "authenticated" }`;
  logout returns an empty `204` response. No handler logs request bodies,
  cookies, signatures, addresses, or secret-derived values.

- [ ] **Step 3: Keep app-route files thin and POST-only**

  Each route exports only `POST(request: Request)`, passes `process.env` to
  its handler, and exposes neither GET nor a runtime-specific secret. The
  routes must not import wallet, command, relay, Convex, or ATS code.

  ```ts
  import { handleChallengePost } from "../../../../lib/dashboard-auth/dashboard-auth-routes.ts";

  export async function POST(request: Request) {
    return handleChallengePost(request, process.env);
  }
  ```

- [ ] **Step 4: Prove route GREEN and commit**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/Web/tests/dashboard-auth-routes.test.mjs
  git add apps/Web/src/lib/dashboard-auth/dashboard-auth-routes.ts apps/Web/src/app/api/auth/metamask/challenge/route.ts apps/Web/src/app/api/auth/metamask/verify/route.ts apps/Web/src/app/api/auth/logout/route.ts apps/Web/tests/dashboard-auth-routes.test.mjs
  git commit -m "feat: Add dashboard sign-in routes"
  ```

### Task 5: Compose the sign-in page and server dashboard gate

**Files:**

- Create: `apps/Web/src/components/auth/metamask-dashboard-sign-in.tsx`
- Create: `apps/Web/src/app/sign-in/page.tsx`
- Create: `apps/Web/src/app/dashboard/layout.tsx`
- Modify: `apps/Web/src/app/dashboard/page.tsx`
- Modify: `apps/Web/tests/dashboard-auth.test.mjs`
- Modify: `apps/Web/tests/dashboard-workspace-reconciliation.test.mjs`

**Interfaces:**

- Consumes: `WalletIsland`, `readCurrentSession`, the three Task 4 endpoints,
  and Task 3's `readDashboardSession`.
- Produces: explicit MetaMask sign-in interaction and a server gate for the
  entire dashboard route tree.

- [ ] **Step 1: Render a bounded public sign-in control**

  Mount `<WalletIsland heading="Sign in with MetaMask">` in a client
  component. Render the sign button only from its `connected` child callback.
  On click, re-read the existing passive session; request the challenge; call
  `provider.request({ method: "personal_sign", params: [message, address] })`;
  send the exact returned message/signature to verify; and navigate only after
  `{ outcome: "authenticated" }`. Display one polite generic failure message
  and disable duplicate clicks while challenge, signature, or verification is
  pending.

  ```ts
  const current = await readCurrentSession(provider);
  if (current.state.kind !== "connected" || current.state.address !== address) return;
  const challenge = await requestChallenge(address);
  const signature = await provider.request({
    method: "personal_sign",
    params: [challenge.message, address],
  });
  if (typeof signature === "string" && await verifyChallenge(challenge.message, signature) === "authenticated") {
    window.location.assign("/dashboard");
  }
  ```

- [ ] **Step 2: Guard all dashboard descendants on the server**

  In `app/dashboard/layout.tsx`, read the session cookie with Next's
  server-side `cookies()`, call the Task 3 session reader, and redirect an
  invalid result to `/sign-in`. Render `children` unchanged for a valid
  session. Do not put the guard in a client component or a CSS-hidden branch.

  ```tsx
  export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await readDashboardSession(
      (await cookies()).get("__Host-tool402-dashboard-session")?.value ?? null,
      process.env,
      Date.now(),
    );
    if (session === null) redirect("/sign-in");
    return children;
  }
  ```

- [ ] **Step 3: Keep dashboard content factual**

  Replace only `eyebrow="Guest dashboard"` with `eyebrow="Dashboard"` in
  `app/dashboard/page.tsx`. Keep the established local-journey description,
  footer, workspace components, routes, and no-account-data boundary intact.

- [ ] **Step 4: Prove client and guard GREEN and commit**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/Web/tests/dashboard-auth.test.mjs apps/Web/tests/dashboard-auth-routes.test.mjs apps/Web/tests/dashboard-workspace-reconciliation.test.mjs
  git add apps/Web/src/components/auth/metamask-dashboard-sign-in.tsx apps/Web/src/app/sign-in/page.tsx apps/Web/src/app/dashboard/layout.tsx apps/Web/src/app/dashboard/page.tsx apps/Web/tests/dashboard-auth.test.mjs apps/Web/tests/dashboard-workspace-reconciliation.test.mjs
  git commit -m "feat: Protect dashboard with MetaMask sign-in"
  ```

### Task 5b: Reveal Dashboard in navigation only for a validated session

**Files:**

- Create: `apps/Web/src/components/auth/dashboard-navigation.tsx`
- Modify: `apps/Web/src/app/layout.tsx`
- Modify: `apps/Web/src/components/discovery/local-navigation.tsx`
- Modify: `apps/Web/tests/dashboard-auth.test.mjs`

**Interfaces:**

- Consumes: Task 3's `readDashboardSession` and the accepted root
  `LocalNavigation` component.
- Produces: one server-validated `Dashboard` main-menu link without any wallet
  connection or address boundary.

- [ ] **Step 1: Keep the session decision on the server**

  Add a server component that reads only the signed dashboard cookie and calls
  `readDashboardSession`. It passes `showDashboard` to `LocalNavigation` only
  when the session is valid. It must neither import wallet UI/state nor expose
  an address.

- [ ] **Step 2: Preserve Cache Components and the public fallback**

  Mount that component in the existing root-header `Suspense` boundary with
  `<LocalNavigation />` as its fallback. Do not make the root layout itself
  await `cookies()`, and do not move navigation into a client auth guard.

- [ ] **Step 3: Render one link in each menu form**

  Extend `LocalNavigation` with a narrow optional boolean prop. It conditionally
  appends `{ href: "/dashboard", label: "Dashboard" }` to its local link list,
  so desktop and mobile menus use one identical source of truth. Do not alter
  wallet/header controls, other navigation labels, or mobile focus behavior.

- [ ] **Step 4: Prove behavior and commit**

  Extend the auth static contract for the server session reader, Suspense
  fallback, and conditional desktop/mobile Dashboard link. Run focused tests,
  typecheck, and the Web build; then commit the authorized files only.

### Task 6: Verify, review, and integrate

**Files:**

- Modify: root-owned S38 card, evidence, catalog, ownership, and state records
  only after implementation is complete.

**Interfaces:**

- Consumes: all Task 1–5 contracts and the exact branch SHA.
- Produces: an accepted S38 task or a documented blocking condition; it never
  produces a wallet signature, account action, deployment, or live authority.

- [ ] **Step 1: Run complete local quality checks**

  ```bash
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run build --workspace @tool402/web
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint
  npm run queue:check
  git diff --check
  ```

  Expected: all commands pass on the current exact canonical base. Do not
  attribute unrelated pre-existing UI failures to S38 or weaken their tests.

- [ ] **Step 2: Perform bounded browser checks**

  Confirm an unsigned visit to `/dashboard` redirects to `/sign-in`, the
  no-provider state is clear and keyboard reachable, and the page makes no
  signature, command, relay, transaction, or API call before user action. Do
  not connect a real wallet or sign a message without a new explicit human
  instruction.

- [ ] **Step 3: Obtain independent review**

  Compare the exact diff with this spec and S38 ownership. Review cookie
  attributes, message equality, envelope integrity, input own-key checks,
  redirect placement, absence of public API changes, and no secret/signature
  disclosure. Run two fresh clean module-review generations after the last
  production-code change.

- [ ] **Step 4: Rebase, commit acceptance, and publish**

  ```bash
  git fetch origin main
  git rebase origin/main
  git log --oneline origin/main..HEAD
  git add docs/work-queue/queue/60-done/S38-T010-metamask-dashboard-sign-in.md docs/work-queue/evidence/S38-T010-ready-review.md docs/work-queue/evidence/S38-T010-activation-review.md docs/work-queue/evidence/S38-T010-red-review.md docs/work-queue/evidence/S38-T010-task-review.md docs/work-queue/evidence/S38-T010-module-review-spec.md docs/work-queue/evidence/S38-T010-module-review-standards.md docs/work-queue/TASK-CATALOG.md docs/work-queue/FILE-OWNERSHIP.md docs/work-queue/STATE.md
  git commit -m "docs: Accept MetaMask dashboard sign-in"
  git push -u origin feat/metamask-dashboard-sign-in
  ```

  Publish a draft PR only after the branch contains the intended commits and
  the report separately lists tests, browser evidence, review status, and the
  unperformed human wallet-signature action.

## Plan Self-Review

- The specification's configuration, message, cookie, timing, client, server
  guard, failure, and human-authority requirements each map to Tasks 2–6.
- No code task names an undefined module or an unspecified interface; the
  Task 3 exports and Task 4–5 consumers are explicit.
- The plan adds no future document link that the current planning commit cannot
  resolve. S38 runtime authority is intentionally a future human/root gate.
