# MetaMask dashboard sign-in

## Status

Planning-only specification. It creates no runtime task, source authority,
wallet action, account, deployment, or production configuration. Before source
work, the human must add an `S38-T010` card to `00-inbox`; the root must then
record ownership, readiness, activation, and the durable RED contract.

## Outcome

Only a browser that has proved control of a MetaMask account on Hedera Testnet
may render the `/dashboard` route tree. The proof is a user-initiated
`personal_sign` signature over an EIP-4361-shaped message, bound to a short
lived, server-sealed challenge. A successful verification creates a signed,
`HttpOnly` dashboard session cookie. Missing, expired, malformed, or
tampered sessions redirect to `/sign-in` before dashboard content is rendered.

All valid MetaMask accounts on chain `0x128` are admitted. There are no
roles, allowlists, profiles, balances, account reads, provider commands,
transactions, or protected API changes in this slice. A connected wallet is
not an ATS issuer authority and cannot authorize a campaign command.

## Reused boundaries

- [UI-S15](../ui/UI-S15.md) remains the sole MetaMask selection, explicit
  account-request, Hedera Testnet chain-gate, and account-change boundary.
- [M50](m50-wallet-session-change-synchronization.md) continues to invalidate
  client wallet content after native account or chain events. The sign-in
  action independently performs its existing passive session re-read just
  before requesting a signature.
- The existing command signature and relay modules remain unchanged. An
  authentication signature is neither an EIP-712 command nor a relayed
  command.
- S26 remains an independent header/session-composition slice. This feature
  mounts the accepted `WalletIsland` only on `/sign-in` and does not reserve
  `app/layout.tsx`, `wallet-connect.tsx`, or `wallet-session.tsx`.

## Configuration

The server reads these values only from `process.env`; neither value reaches
the browser, response body, log, or error message.

| Name | Exact accepted form | Purpose |
| --- | --- | --- |
| `TOOL402_DASHBOARD_AUTH_ORIGIN` | one canonical absolute HTTPS URL, with no credentials, query, hash, or path other than `/` | fixes the EIP-4361 domain and URI, validates POST `Origin`, and sets host-only cookies |
| `TOOL402_DASHBOARD_AUTH_SECRET` | exactly 64 lower-case hexadecimal characters | HMAC-SHA-256 key for the challenge and session envelopes |

Missing or malformed configuration produces only `503 {"outcome":"not_configured"}` and no cookie. Local real-wallet testing therefore requires a separately configured HTTPS origin. Configuration remains a human-owned deployment action.

## Protocol

### Challenge

1. The existing `WalletIsland` obtains one MetaMask account only after an
   explicit click and reports `connected` only after observing chain `0x128`.
2. The sign-in control calls `readCurrentSession(provider)` immediately before
   it starts. It proceeds only when the observed state is `connected` and its
   lower-case address still equals the rendered address.
3. The browser sends `POST /api/auth/metamask/challenge` with exact JSON
   `{ "address": "0x…" }`, same-origin credentials, and the configured
   `Origin` header.
4. The server validates the exact body shape and lower-case EVM address,
   creates 16 random bytes, renders an unpadded base64url nonce, and seals the
   fixed challenge payload `{v,address,nonce,issuedAt,expiresAt,origin}` with
   HMAC-SHA-256. The lifetime is exactly 300 seconds.
5. The server sets the sealed payload in
   `__Host-tool402-dashboard-challenge` with `Path=/`, `Secure`, `HttpOnly`,
   and `SameSite=Strict`, then returns only `{message,expiresAt}` with
   `Cache-Control: no-store`.

The returned message is byte-for-byte:

```text
<origin-host> wants you to sign in with your Ethereum account:
<lower-case-address>

Sign in to the Tool402 dashboard.

URI: <origin>/dashboard
Version: 1
Chain ID: 296
Nonce: <22-character-base64url-nonce>
Issued At: <ISO-millisecond-UTC>
Expiration Time: <ISO-millisecond-UTC>
```

The client asks MetaMask for `personal_sign` with parameters `[message,
address]`; it never calls a transaction, `eth_signTypedData_v4`, a command
relay, or a wallet switch from the sign-in control.

### Verification and session

1. The browser sends exact JSON `{ "message": "…", "signature": "0x…" }`
   to `POST /api/auth/metamask/verify` with same-origin credentials and the
   configured `Origin`.
2. The server reads and validates the sealed challenge cookie before invoking
   signature verification. It rejects an absent, malformed, altered, expired,
   origin-mismatched, or noncanonical payload; it reconstructs the exact
   expected message and requires byte-for-byte equality.
3. `viem`'s local `verifyMessage` verifies the `personal_sign` signature
   against the challenge address. No RPC or third-party HTTP call is allowed.
4. On success, the response clears the challenge cookie and sets
   `__Host-tool402-dashboard-session`. Its fixed signed payload is
   `{v,address,issuedAt,expiresAt}`; its lifetime is exactly eight hours. The
   session cookie has `Path=/`, `Secure`, `HttpOnly`, `SameSite=Strict`, and
   `Cache-Control: no-store`.
5. On every verification failure, the response clears the challenge cookie
   and returns only `401 {"outcome":"rejected"}`. It never disclose whether
   the address, cookie, message, or signature failed.

The short-lived, sealed `HttpOnly` challenge binds a signature to the browser
that initiated it and is cleared before a session is issued. This V1 does not
add durable nonce storage, server-side session revocation, or audit history;
if the product later requires cross-device nonce-consumption records or
immediate revocation, that is a separate durable-authentication task.

### Route protection and sign-out

`app/dashboard/layout.tsx` reads the session through the server-only helper.
An invalid session calls `redirect("/sign-in")`; because it is a parent layout,
the dashboard landing and every existing nested RiskScan dashboard route share
the guard. Calling `cookies()` makes the layout dynamic, so no dashboard view
is cached as public content.

`/sign-in` redirects a valid session to `/dashboard`; otherwise it renders the
MetaMask island and the sign-in control. On successful verification, the
client navigates to `/dashboard`. `POST /api/auth/logout` clears both cookie
names and returns `204` with `Cache-Control: no-store`. It provides a bounded
server logout boundary only; this slice intentionally adds no header or
dashboard logout control because that belongs with the later S26 header work.

The dashboard title changes from `Guest dashboard` to `Dashboard` and keeps
the existing factual local-journey copy. This change reflects the route guard
without inventing account-specific data or a claim of account authority.

## Closed outcomes and failure handling

| Boundary | Result |
| --- | --- |
| missing/malformed auth configuration | `503 {"outcome":"not_configured"}`, no cookie and no signature request |
| no MetaMask, several MetaMask providers, declined account, or wrong chain | existing UI-S15 state and retry/switch controls; no auth request |
| declined/invalid `personal_sign`, challenge failure, invalid cookie, expired value, wrong origin, or invalid session | generic `rejected` outcome or `/sign-in` redirect; no internal detail |
| one successful signature | exactly one signed eight-hour session cookie and one navigation to `/dashboard` |
| session expiration or signature tampering | redirect before dashboard content, clear invalid cookies only through an explicit logout or next successful verification |

No automatic retry, provider discovery on render, storage API, timer,
analytics, console logging, external fetch, payment, transaction, command
relay, role decision, or configuration fallback is allowed.

## Verification and authority boundary

The durable RED contract must cover configuration fail-closed behavior,
canonical message construction, expiration, HMAC tampering, exact body and
origin validation, invalid signature rejection, session verification, cookie
attributes, dashboard layout guard, and the client method/endpoint boundary.
It must use injected clock, random-byte, and signature-verifier seams; no test
may invoke a real wallet, account, or signature.

Acceptance requires the focused auth tests, complete Web test suite, Web and
root typecheck/test/lint/build, queue/reference/whitespace/Git guards, and an
independent task review plus two clean module-review generations. S38 may not
activate until exact canonical `main` has a green Web baseline; unrelated
baseline failures must be independently corrected and accepted outside S38.

Browser evidence is limited to the unauthenticated redirect, sign-in no-wallet
state, keyboard focus, and a configured-safe route response. A real MetaMask
account request and signature remain a human-owned action and cannot be
claimed by automated acceptance.
