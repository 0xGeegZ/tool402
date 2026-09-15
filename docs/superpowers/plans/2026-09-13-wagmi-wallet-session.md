# Wagmi Wallet Session Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Tool402's custom MetaMask connection/session transport with one Wagmi v3/Viem authority without changing server authentication or financial business safeguards.

**Architecture:** One typed Hedera-Testnet Wagmi config and stable browser provider tree owns account, chain and connector state. Components derive a thin Tool402 view from Wagmi; command and transaction workflow code remains protocol-focused and receives explicit signing/sending functions at its client boundary.

**Tech Stack:** Next.js App Router, React 19.2.8, TypeScript 5.9.3, Wagmi 3.7.7, Viem 2.56.1, TanStack Query 5.102.8, Node 22.21.1.

**Spec:** `docs/specs/w01-wagmi-wallet-session.md`

## Global Constraints

- Deliver against `origin/dev`; do not merge or deploy.
- Use Wagmi v3 `useConnection`, `useConnectionEffect`, `useConnectors`, `mutate` and `mutateAsync` APIs only.
- Permit injected MetaMask and Hedera Testnet (296) only.
- Keep wallet connection, dashboard cookie, server authority, received hash and allocation distinct.
- Effects, reconnect, refresh and retries never request, sign, relay or send.
- Signing/sending uses `retry: false`, explicit click and account/chain/connector revalidation after awaits and immediately before critical actions.
- Preserve command bytes, server challenge/verify, admission, idempotency, reservation, durable evidence and verification.

---

### Task 1: Add Wagmi configuration and a stable client provider

**Files:**
- Create: `apps/web/src/lib/wallet/wagmi-config.ts`, `apps/web/src/components/wallet/wallet-providers.tsx`, `apps/web/tests/wagmi-provider.test.mjs`
- Modify: `apps/web/package.json`, `package-lock.json`, `apps/web/src/app/layout.tsx`

**Interfaces:** Produces `tool402WagmiConfig` and `WalletProviders`; all later wallet components live beneath them.

- [ ] **Step 1: Write the failing test**

```js
test('creates one SSR connection configuration for Hedera Testnet', async () => {
  const { tool402WagmiConfig } = await import('../src/lib/wallet/wagmi-config.ts')
  assert.deepEqual(tool402WagmiConfig.chains.map((chain) => chain.id), [296])
  assert.equal(tool402WagmiConfig.state.status, 'disconnected')
})
```

- [ ] **Step 2: Verify RED** — `npm run test --workspace=@tool402/web -- tests/wagmi-provider.test.mjs`.
- [ ] **Step 3: Implement the minimum configuration**

```ts
export const tool402WagmiConfig = createConfig({
  chains: [hederaTestnet],
  connectors: [injected({ target: 'metaMask' })],
  ssr: true,
  transports: { [hederaTestnet.id]: http(hederaTestnet.rpcUrls.default.http[0]) },
})
```

Pin `wagmi@3.7.7` and `@tanstack/react-query@5.102.8`; create exactly one
`QueryClient` with `useState`; mount it once beneath `WagmiProvider`.

- [ ] **Step 4: Verify GREEN** — focused test and `npm run typecheck --workspace=@tool402/web`.
- [ ] **Step 5: Commit** — `refactor: Add Wagmi provider boundary`.

### Task 2: Replace the custom connection store and header consumers

**Files:**
- Create: `apps/web/src/components/wallet/use-tool402-wallet.ts`
- Modify: `apps/web/src/components/wallet/wallet-connect.tsx`, `apps/web/tests/wallet-session.test.mjs`, `apps/web/tests/wallet-state.test.mjs`, `apps/web/tests/wallet-session-sync.test.mjs`, `apps/web/tests/metamask-provider.test.mjs`
- Retain temporarily: `apps/web/src/components/wallet/wallet-session.tsx`, `apps/web/src/lib/wallet/wallet-state.ts`, `apps/web/src/lib/wallet/metamask-provider.ts` while the later auth, command, backing, and Stage-B consumers migrate. Their deletion belongs to Task 6, after the last import is removed.

**Interfaces:** `useTool402Wallet()` returns derived `connection`, `resolved`, account/chain/connector and explicit `connect`, `disconnect`, `switchToHedera` operations; it stores neither a provider nor a listener.

- [ ] **Step 1: Write failing behavior tests**

```js
test('keeps the dashboard session intact while a mock connector reconnects', async () => {
  const connector = createMockMetaMaskConnector({ state: 'reconnecting' })
  const screen = await renderWalletHarness({ connector, dashboardAddress: accountA })
  assert.equal(screen.logoutCalls, 0)
  assert.equal(connector.requestAccountCalls, 0)
})

test('keeps an explicit disconnect after remount', async () => {
  await wallet.disconnect()
  await wallet.remount()
  assert.equal(wallet.connection.kind, 'disconnected')
})
```

- [ ] **Step 2: Verify RED** — run the three wallet session/state focused tests.
- [ ] **Step 3: Implement the derived hook and migrate UI** — filter `useConnectors()` to configured MetaMask, normalize Tool402 addresses to lower case, derive resolving/no-provider/wrong-chain/connected view states, and invoke mutations only from explicit controls. Retain legacy modules solely for later consumers; do not add new imports of them.
- [ ] **Step 4: Verify GREEN** — focused hook/header tests pass. The final `rg` assertion that finds no `WalletSessionProvider`, `useWalletSession`, discovery or custom listener belongs to Task 6 after every consumer has migrated.
- [ ] **Step 5: Commit** — `refactor: Derive wallet state from Wagmi`.

### Task 3: Migrate dashboard sign-in and safe session synchronization

**Files:**
- Modify: `apps/web/src/components/auth/metamask-dashboard-sign-in.tsx`, `apps/web/src/components/auth/dashboard-session-sync.tsx`, `apps/web/src/app/dashboard/layout.tsx`, `apps/web/tests/dashboard-auth.test.mjs`, `apps/web/tests/dashboard-session-sync.test.mjs`

**Interfaces:** Consumes W01 wallet state and `useSignMessage`; produces a generation-guarded sign-in/logout coordinator.

- [ ] **Step 1: Write failing race tests**

```js
test('does not logout while Wagmi reconnection is unresolved', async () => {
  await sync.render({ status: 'reconnecting', dashboardAddress: accountA })
  assert.equal(fetchCalls('/api/auth/logout').length, 0)
})

test('does not redirect after a failed server logout', async () => {
  await sync.render({ status: 'connected', address: accountB, dashboardAddress: accountA })
  await logout.resolve(503)
  assert.equal(sync.redirected, false)
  assert.match(sync.message, /could not be ended/)
})
```

- [ ] **Step 2: Verify RED** — run dashboard auth and session-sync tests.
- [ ] **Step 3: Implement** — sign the unchanged challenge through `signMessage.mutateAsync({ message })` with `retry: false`; recheck account/chain/generation after challenge and signature; use one deduplicated logout that redirects only on `204` and blocks sensitive UI on failure.
- [ ] **Step 4: Verify GREEN** — focused dashboard tests pass.
- [ ] **Step 5: Commit** — `refactor: Synchronize dashboard auth with Wagmi`.

### Task 4: Preserve EIP-712 command compatibility through Wagmi signing

**Files:**
- Modify: `apps/web/src/lib/wallet/tool402-command.ts`, `apps/web/src/lib/wallet/command-relay.ts`, `apps/web/src/components/wallet/signature-dialog.tsx`, `apps/web/src/lib/wallet/command-bridge.ts`, `apps/web/tests/tool402-command.test.mjs`, `apps/web/tests/commands-api.test.mjs`
- Modify: `apps/web/tests/provider-tool-journey.test.mjs`
- Create: `apps/web/tests/tool402-command-wagmi-compatibility.test.mjs`

**Interfaces:** `signCommand(command, signTypedData)` consumes a narrow async signer and returns the existing signed envelope after grammar and recovered-signer validation. `signAndRelayCommand(context, request, dependencies)` accepts a `readCurrentContext(): WalletActionContext | null` assertion and checks it before signature and immediately before relay.

- [ ] **Step 1: Write failing compatibility tests**

```js
test('keeps the canonical typed-data digest and command body', async () => {
  const request = buildFixtureRequest()
  assert.equal(hashTypedData(request.typedData), fixture.digest)
  assert.equal(createCommandBody(await signFixture(request), fixture.payload), fixture.body)
})

test('does not relay after the injected context changes during signing', async () => {
  const context = createMutableWalletContext(accountA, 296)
  const operation = signAndRelayCommand({ readCurrentContext: context.read }, request, dependencies)
  context.set(accountB, 296)
  await resolveSignature(signatureForA)
  await operation
  assert.equal(relay.calls.length, 0)
})
```

- [ ] **Step 2: Verify RED** — run command, provider-tool journey, and new compatibility tests.
- [ ] **Step 3: Implement** — define `WalletActionContext = { address; chainId: 296; connectorId; generation }`, retain the existing typed-data object/expiry/body, call `useSignTypedData().mutateAsync` with `retry: false`, recover/compare signer, and require the injected context assertion before signing and before relay. Keep no `personal_sign` fallback.
- [ ] **Step 4: Verify GREEN** — command, provider-tool journey, and compatibility tests pass.
- [ ] **Step 5: Commit** — `refactor: Sign Tool402 commands through Wagmi`.

### Task 5: Migrate backing and Stage-B transaction transport

**Files:**
- Modify: `apps/web/src/components/backing/backing-flow.tsx`, `apps/web/src/components/backing/backing-state.ts`, `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`, `apps/web/src/components/provider/deploy/ats-create-action.tsx`, `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`
- Modify: `apps/web/tests/backing-route.test.mjs`, `apps/web/tests/backing-state.test.mjs`, `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`, `apps/web/tests/ats-create-action.test.mjs`, `apps/web/tests/deploy-stage-signing.test.mjs`

**Interfaces:** Backing and Stage-B receive an injected sender plus a current account/chain/connector assertion, never EIP-1193.

- [ ] **Step 1: Write failing no-send/recovery tests**

```js
test('does not send after reservation resolves for another account', async () => {
  const pending = backing.send()
  await reservation.waitUntilCalled()
  wallet.setAccount(accountB)
  reservation.resolvePrepared()
  await pending
  assert.equal(sendTransaction.calls.length, 0)
})

test('recovers an existing ATS hash without another send', async () => {
  await stageB.recover(existingHash)
  assert.equal(sendTransaction.calls.length, 0)
})
```

- [ ] **Step 2: Verify RED** — run backing and Stage-B focused tests.
- [ ] **Step 3: Implement** — reserve first, recheck current context before `sendTransaction.mutateAsync`, pass bigint EVM value and chain 296 with `retry: false`, retain one-click locks, calldata, candidate parsing, lower-case hash persistence and read-only recovery.
- [ ] **Step 4: Verify GREEN** — focused backing/ATS tests pass.
- [ ] **Step 5: Commit** — `refactor: Send wallet transactions through Wagmi`.

### Task 6: Remove obsolete paths, validate, review and open the draft PR

**Files:**
- Modify: `README.md`, W01 specification/queue records and only reviewed final rebase-conflict files.
- Delete: `apps/web/src/components/wallet/wallet-session.tsx`, `apps/web/src/lib/wallet/wallet-state.ts`, `apps/web/src/lib/wallet/metamask-provider.ts` and their obsolete tests only after all consumers move.

- [ ] **Step 1: Write failing cleanup assertion**

```js
test('ships no custom wallet store or EIP-6963 discovery', async () => {
  assert.equal(await exists('src/components/wallet/wallet-session.tsx'), false)
  assert.equal(await exists('src/lib/wallet/metamask-provider.ts'), false)
})
```

- [ ] **Step 2: Verify RED, remove obsolete artifacts and document** — record the Wagmi boundary, retained server duties, cookie distinction, local test setup, reconnect/logout/account behavior and rollback by reverting the PR; no feature flag or parallel system.
- [ ] **Step 3: Verify final suite** — under Node 22.21.1 run root test/typecheck/lint/queue/build/whitespace plus mock-connector browser paths without a real wallet/signature/transaction.
- [ ] **Step 4: Rebase and review** — `git fetch origin dev main`, rebase `origin/dev`, review exact `origin/dev..HEAD` for duplicate state, races, retry/double-send, evidence loss and secrets.
- [ ] **Step 5: Push and open draft PR** — push `refactor/wagmi-wallet-session`; create a draft PR with `--base dev`, never main.
