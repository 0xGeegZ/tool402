# W01 — Wagmi wallet and dashboard-session migration

## Status and purpose

This is the implementation-local contract for replacing Tool402's browser
wallet-session plumbing with Wagmi v3 and Viem. It is a migration of client
transport and connection state, not a change to dashboard authentication,
business authorization, command admission, or payment finality.

The delivery base is `origin/dev` at `b52829e5a390ca49f09de3986d9157b19eacb716`.
W01 is not active until the root records readiness and accepts a focused RED
contract. Until then, this document grants no source, package, or runtime
change.

## Non-negotiable separation

1. A connected wallet is not a signed-in dashboard user.
2. A signed-in dashboard user is not an ISSUER or BACKER authority.
3. A transaction hash is not a confirmed payment or allocation.
4. Wagmi persistence is not the dashboard-authentication cookie.

The existing server challenge, exact-message signature verification, session
cookie grammar/expiry/origin policy, server route gate, command ingress,
nonce/idempotency/replay checks, ATS/backing reservation, durable payment
projection, and transaction verification remain authoritative.

## Target architecture

### Shared client integration

- Pin `wagmi@3.7.7` and `@tanstack/react-query@5.102.8`; retain the existing
  `viem@2.56.1` and exact-version lockfile convention.
- Define one typed Tool402 Wagmi config for Hedera Testnet only (`chain.id ===
  296`) with `ssr: true`, the repository's existing RPC/explorer/add-chain
  data, and a Wagmi-provided injected connector explicitly targeted at
  MetaMask. Do not add WalletConnect, RainbowKit, Auth.js, a MetaMask mobile
  SDK, or another wallet framework.
- Mount one client `WagmiProvider` and one stable browser `QueryClient` below
  the root layout. Neither provider may be constructed in a server component
  or shared between server requests.
- Use neutral client persistence rather than making every public route dynamic
  merely to pass a wallet cookie through the root layout. The initial UI must
  show reconnection/resolution rather than treating hydration's temporary
  disconnection as an explicit logout. Wagmi's persistence key is unrelated
  to every dashboard-auth cookie.
- `useTool402Wallet` may expose a small derived domain view, but it must read
  Wagmi's connection, connector and chain values directly. It must not keep a
  second provider/address/chain/connected/connecting store or install its own
  `accountsChanged`/`chainChanged` listeners.

### Connection and display

- Use Wagmi v3 APIs (`useConnection`, `useConnectionEffect`, `useConnectors`,
  `useConnect`, `useDisconnect`, and `useSwitchChain`) and their
  `mutate`/`mutateAsync` mutations. Do not retain v2 account-hook examples or
  the bespoke EIP-6963 discovery/timeout implementation.
- MetaMask absence, explicit connector selection, rejection, wrong-chain
  switch rejection, reconnecting, explicit disconnect and normal connected
  states remain visible and accessible. Only an explicit click may request an
  account; reconnect must not request, sign, relay, send, or switch.
- An explicit Wagmi disconnect must survive refresh through the connector's
  disconnect persistence. A reconnection indication is not authority evidence.
- The address used by Tool402 API payloads and role comparisons is normalized
  to lower case at the Tool402 boundary. An issuer mismatch is an advisory for
  issuer-only workflow UI, never a global connection failure.

### Dashboard authentication and synchronization

- `MetaMaskDashboardSignIn` obtains the existing challenge, signs the exact
  server-provided message via `useSignMessage().mutateAsync`, then submits the
  existing verification request. It must not substitute SIWE, EIP-712, a
  browser-only assertion, or an implicit signature during connection.
- A sign-in operation snapshots the connected account, chain and connection
  generation before its first request and rechecks them after each awaited
  boundary. A changed account/network/disconnect invalidates that operation;
  an old response must not sign in or refresh the newer wallet view.
- `DashboardSessionSync` derives account/network changes from Wagmi. It waits
  for connection hydration to settle. The same valid account on chain 296
  preserves the server session; an account mismatch, explicit disconnect, or
  wrong chain blocks sensitive UI and starts at most one logout request.
- Redirect to `/sign-in` only after the existing logout endpoint returns its
  success status. If logout fails, keep sensitive actions blocked and show a
  recovery message; never claim that server logout occurred.
- Abort or generation-guard obsolete auth/logout/data requests. Account- and
  chain-scoped private query keys must be removed or invalidated on a relevant
  change without deleting durable payment/transaction evidence. Do not loop
  `router.refresh`, duplicate logout, or let account A populate account B.

### Commands, ATS and backing

- Keep `tool402-command`'s canonical payload, EIP-712 domain, primary type,
  field types, nonce/timestamp limits, lower-case signer, digest and command
  body byte-for-byte compatible. Keep construction/validation pure.
- Replace `eth_signTypedData_v4` transport with an injected typed-data signer
  implemented by `useSignTypedData().mutateAsync`. The signing seam receives
  the exact typed-data object and validates the returned signature grammar and
  recovered signer. Set `retry: false`; no effect, reconnect, refresh or
  ambiguous failure may cause a second signing prompt or relay.
- Replace browser `eth_sendTransaction` transport with Wagmi/Viem transaction
  actions. Preserve calldata, destination, `bigint` values, EVM unit
  conversion, account, chain, idempotency key, reservation and returned hash.
  Do not use Hedera native decimals in EVM transfers.
- Each critical action captures account/chain/connector context, revalidates
  it after reservation or other asynchronous waits and immediately before the
  mutation. If it changed, do not send. Transaction mutations use `retry:
  false` and a local in-flight guard for an explicit user action only.
- A received hash is persisted under its original account, chain and attempt
  even if the current screen becomes stale. Hash recovery/verification remains
  read-only; no refresh or unknown outcome may recreate an ATS, funding or
  allocation transaction.

## Current-to-target map

| Current component | Current responsibility | Target replacement | Preserved logic |
| --- | --- | --- | --- |
| `wallet-session.tsx`, `wallet-state.ts`, `metamask-provider.ts` | discovery, connection store, chain/account listeners | shared Wagmi config/providers and derived hook | Hedera chain gate, address canonicalization, accessible states |
| `wallet-connect.tsx` | header control | Wagmi-derived connection control | explicit connect/switch copy and dashboard link |
| `metamask-dashboard-sign-in.tsx` | challenge and `personal_sign` transport | `useSignMessage` | exact challenge/verify server protocol |
| `dashboard-session-sync.tsx` | client account/session reconciliation | Wagmi connection effects plus one logout state machine | same-account retain, fail-closed mismatch/logout policy |
| `tool402-command.ts`, `command-relay.ts`, `signature-dialog.tsx` | EIP-712 request/sign/relay | injected Wagmi typed-data signer | all canonical command and relay checks |
| ATS Stage-B bridge and backing flow | MetaMask transaction transport | Wagmi/Viem send action with context guard | reservation, idempotency, recovery, hash evidence and verification |

## Required executable coverage

Tests must be behavior-driven, deterministic and written RED before each
corresponding source change. They must cover at least:

- MetaMask absent; multiple injected extensions with explicit MetaMask choice;
  rejected connect; wrong-chain and rejected switch; passive refresh reconnect;
  explicit disconnect followed by refresh; and one authoritative connection
  across navigation.
- Slow hydration without logout; successful exact challenge/sign/verify;
  account change during authentication; expired/invalid session; failed logout
  recovery; no stale private cache/result crossing accounts.
- Stable typed-data digest/body fixtures and recovered signer; expired command
  never relayed; declined signature never retried; dashboard A/current wallet
  B never sends; reservation-time account or chain change never sends;
  double-click produces one prompt; an existing hash verifies only; pending or
  unknown refresh never sends; and a post-broadcast account change retains the
  original attempt's hash.
- Browser-level mock-connector journeys for header navigation, hydration,
  account change and the signed dashboard flow, without a funded wallet or a
  live transaction.

## Documentation, review and validation

The final PR must document the replacement boundary, server responsibilities,
reconnect/logout/account-change policy, cookie distinction, dependencies,
local test procedure and rollback (revert the PR; do not retain two wallet
systems or a feature flag). It must update superseded S26/S40/S36 records
without erasing historical decisions or payment evidence.

Before delivery run targeted wallet/auth/command/ATS/backing tests, root
`npm run test`, `npm run typecheck`, `npm run lint`, `npm run queue:check`,
`npm run build`, and `git diff --check` under Node 22.21.1. Verify relevant
server routes, hydration and browser mock journeys separately from those
automated checks. Require a fresh independent review of connection-state
removal, account/network/auth races, double prompts/transfers, evidence
retention and secret exposure. No deployment, real wallet action, signature,
transaction, allocation or merge is authorized.
