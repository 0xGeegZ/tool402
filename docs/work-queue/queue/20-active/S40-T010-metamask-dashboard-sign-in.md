# S40-T010 — MetaMask dashboard sign-in

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: S15-T010 accepted, M50-T010 accepted, S24-T010 accepted.
  S26-T010 is not a dependency and remains an independent header-wallet slice.
- Owner: the root owns this card, source contract, catalog, ownership, state,
  readiness/activation/RED/acceptance evidence, commits, and pushes. The only
  proposed source/test paths are those declared below and in the
  [MetaMask dashboard sign-in specification](../../../specs/metamask-dashboard-sign-in.md).
- Human actions: configuring the canonical origin and secret, connecting a real
  wallet, requesting an account, and signing a real message remain human-owned.
  This card creates no deployment, account, provider permission, transaction,
  payment, relay, or live authority.

## Scope

The public dashboard is currently a truthful local workspace. This card adds a
bounded authentication boundary: a user who explicitly controls one MetaMask
account on Hedera Testnet (`0x128`) may sign the fixed EIP-4361-shaped message,
receive a signed `HttpOnly` dashboard session, and render `/dashboard`. An
invalid, expired, missing, or altered session redirects to `/sign-in` before
any dashboard child renders.

The local contract is the
[MetaMask dashboard sign-in specification](../../../specs/metamask-dashboard-sign-in.md).
`UI-S38` is independently owned by the Back this tool entry card and is not
part of this authentication lane.
It reuses UI-S15 for provider selection, account request, chain gate, and
`WalletIsland`, and M50 for passive client-session re-reads. It does not change
either accepted slice, the command signature/relay path, or any public API.

On 2026-09-11 the repository owner explicitly added one bounded acceptance
requirement: a validated dashboard session must reveal a `Dashboard` link in
both desktop and mobile main menus. The link is derived only from the signed
`HttpOnly` session on the server. It is not a wallet-connected indicator and
does not modify S26's wallet-header contract.

The card may add exactly these new paths:

- `apps/web/src/lib/dashboard-auth/dashboard-auth.ts`;
- `apps/web/src/lib/dashboard-auth/dashboard-auth-routes.ts`;
- `apps/web/src/app/api/auth/metamask/challenge/route.ts`;
- `apps/web/src/app/api/auth/metamask/verify/route.ts`;
- `apps/web/src/app/api/auth/logout/route.ts`;
- `apps/web/src/components/auth/metamask-dashboard-sign-in.tsx`;
- `apps/web/src/app/sign-in/page.tsx`;
- `apps/web/src/app/dashboard/layout.tsx`;
- `apps/web/src/components/auth/dashboard-navigation.tsx`;
- `apps/web/src/components/auth/dashboard-session-sync.tsx`;
- `apps/web/tests/dashboard-auth.test.mjs`; and
- `apps/web/tests/dashboard-auth-routes.test.mjs`; and
- `apps/web/tests/dashboard-session-sync.test.mjs`.

The repository owner additionally reserves `.env.example` and
`apps/web/.env.example` as documentation-only templates for the two fixed
dashboard-auth keys. They may show the canonical local HTTPS origin and an
empty secret placeholder with generation guidance; they neither configure a
running environment nor commit a secret or authorize a real signature.

Under a root integration reservation it may additionally amend the existing
header-navigation slot of `apps/web/src/app/layout.tsx` and the link-list/prop
contract of `apps/web/src/components/discovery/local-navigation.tsx`, solely
to mount the server-validated `Dashboard` menu boundary inside `Suspense`.
It must not alter wallet header/session behavior, connect a provider, expose
the account, or change another header region.

Under a root integration reservation it may amend only the `Guest dashboard`
eyebrow in `apps/web/src/app/dashboard/page.tsx` and the two matching wording
assertions in `apps/web/tests/dashboard-workspace-reconciliation.test.mjs`.
It must not amend `app/layout.tsx`, `wallet-connect.tsx`, `wallet-session.tsx`,
nested dashboard pages, workspace components, public APIs, package files, or
the lockfile.

## Candidate ready requirements

- Card, manifest, catalog, ownership, and state records are committed before
  any test or source change.
- The exact canonical `origin/main` Web baseline is green before activation.
- A fresh independent readiness review confirms the declared paths are absent
  or explicitly reserved, the dependencies remain accepted, and S26's inbox
  scope has no collision.
- A separate independent activation review may authorize only a durable
  test-only RED contract. Production source remains prohibited until the RED
  review is accepted.
- The protocol is fixed before source work: canonical HTTPS origin and
  64-lowercase-hex secret, with the separately documented development-only
  `http://localhost:<port>` exception; lower-case EVM address; 16-byte/22-character
  base64url nonce; 300-second challenge; 28,800-second session; signed
  challenge and session envelopes; exact cookie names; exact `personal_sign`
  message; exact POST bodies; closed generic failures; and server layout gate.

## Verification

- Durable RED contracts use injected clock, random-byte, HMAC, and signature
  verifier seams. They cover malformed configuration, lower-case address and
  signature grammar, exact message equality, origin/body own-key validation,
  HMAC tampering, challenge/session expiry, cookie attributes, generic
  rejection, route POST-only behavior, client boundary, and server redirect.
- Focused tests, Web/root typecheck, Web/root tests, root lint, Web build,
  `npm run queue:check`, local-reference guard, and whitespace checks pass.
- Browser evidence is limited to unsigned `/dashboard` redirect, no-provider
  sign-in state, keyboard focus, and a configured-safe route response. No
  automated check requests an account or signature.
- Independent task review and fresh specification and standards module reviews
  are clear before acceptance.

## Boundary

All valid MetaMask accounts on chain 296 are eligible; this card adds no role,
allowlist, profile, balance, account read, protected API, durable nonce store,
revocation record, analytics, browser storage, polling, external HTTP call,
command relay, transaction, payment, deployment, or live action. A connected
wallet and an authentication signature are not issuer or campaign authority.

The routes fail closed when configuration is absent or malformed. They never
log or return a secret, cookie payload, signature, wallet address, verifier
error, or configuration detail. The sign-in surface never requests a chain
switch, transaction, typed-data signature, or relay action.

## Human worktree lane request

- Requested on 2026-09-11 by the repository owner through the delegated
  session. The owner explicitly authorizes this root-created inbox card and
  direct implementation in `feat/metamask-dashboard-auth-plan`.
- Worktree: `.worktrees/metamask-dashboard-auth-plan`; branch:
  `feat/metamask-dashboard-auth-plan`. The root is implementer/integrator for
  queue records; independent task and module reviews remain required.
- The branch may not alter any source until the root records an independent
  readiness review, test-only RED activation, and durable RED acceptance.

## Readiness

The independent [S40 readiness review](../../evidence/S40-T010-ready-review.md)
is clear at control head `71a059caa525cbfa397f40f262b01207ba46dab7`, rebased on
canonical `ca80c6edddae09b0577678e4b61c63f87553321f`, with the Web baseline
green 362/362. S40-T010 is `10-ready` only. No test or source path is active;
only a fresh independent activation may next authorize the two new RED test
paths.

## RED activation

The independent [S40 activation review](../../evidence/S40-T010-activation-review.md)
is clear at control head `473b4edd346ce45249c257e36432684b1429112f`.
S40-T010 is `20-active` only for durable RED in
`apps/web/tests/dashboard-auth.test.mjs` and
`apps/web/tests/dashboard-auth-routes.test.mjs`. Every production source path,
the existing dashboard wording amendment, configuration/environment value,
wallet account request/signature, provider command, relay, transaction,
payment, deployment, and live action remains prohibited pending independent
RED acceptance.

## RED acceptance

The independent [S40 durable RED review](../../evidence/S40-T010-red-review.md)
is clear at `5a7ca33bd23e3877f77798a8b3490d643eb9a154`. The focused RED contract
has exactly one source-absence failure covering all eight declared S38 sources
and twenty staged skips. The card may now implement only its eight declared
production source paths and the root-reserved dashboard eyebrow plus two
matching wording assertions in the plan's staged order. Every other path and
every configuration/environment value, real wallet account request/signature,
provider command, relay, transaction, payment, deployment, and live action
remains prohibited.

## User-directed environment-template amendment

The repository owner explicitly requested a documented root local-environment
template and its Web counterpart. The two reserved `.env.example` files above
are template documentation only. The actual `.env.local`, any origin/secret
value used at runtime, TLS trust, wallet account request, and real signature
remain human-owned and outside this card.

## User-directed local HTTP amendment

The repository owner explicitly requires dashboard sign-in to work on the
ordinary local HTTP dev server. The declared dashboard-auth source and test
paths may therefore accept only `http://localhost:<port>` when `NODE_ENV` is
exactly `development`, bind every request and signed message to that exact
origin, and use dedicated non-`__Host`, non-`Secure` challenge/session cookies
for that exception. Every non-loopback HTTP origin, any non-development
environment, Vercel Preview, and production remains HTTPS-only and fail-closed.
This authorizes no real wallet account request or signature by an agent.

## User-directed navigation amendment

The owner explicitly authorized the narrow authenticated-navigation extension
above after durable RED. The root reserves only the declared server boundary,
the root header navigation slot, the existing local-navigation link list/prop,
and matching assertions in `dashboard-auth.test.mjs`,
`guided-demo-route.test.mjs`, `landing-explore.test.mjs`,
and `static-shell.test.mjs`. The root also keeps
the existing `provider-deploy-visual-reconciliation.test.mjs` synchronized
with the merged S26 header-session layout. It is staged after the
server session reader and remains subject to the same no-wallet/no-live-action
boundary and fresh review.

## User-directed sign-in clarity amendment

After testing the connected-address navigation, the repository owner found the
unsigned redirect too implicit for a human. The existing declared sign-in page,
sign-in component, and `dashboard-auth.test.mjs` are additionally reserved to
make the remaining step explicit: the signed-in dashboard needs one secure
MetaMask authentication signature, it is not a transaction and costs no HBAR,
and the primary action reads `Sign and open dashboard`. This does not change
the route, protocol, shared wallet state, server guard, or post-success target
(`/dashboard`), and authorizes no real signature.

## User-directed Vercel Preview-origin amendment

The repository owner explicitly requires working ephemeral Vercel previews
without manually updating an origin for every deployment. The declared auth
sources and focused auth tests may derive the canonical origin from
`https://${VERCEL_URL}` only when `VERCEL_ENV` exactly equals `preview` and no
explicit `TOOL402_DASHBOARD_AUTH_ORIGIN` is present. The derived value must
pass the existing canonical HTTPS validation; production, development, and any
request-derived host remain fail-closed. `TOOL402_DASHBOARD_AUTH_SECRET`
remains required and human-configured for Preview.

## User-directed wallet-session preservation amendment

The repository owner directs the existing sign-in component and its focused
auth assertion to replace the successful full-document navigation with the
fixed internal App Router `replace("/dashboard")` transition. The root layout
and its shared wallet session stay mounted for this transition, while the
server still authorizes dashboard access solely from the sealed `HttpOnly`
cookie. This adds no storage, wallet discovery, account request, signature,
wallet-state mutation, route target, or live authority.

## User-directed MetaMask sign-out synchronization amendment

After observing that disconnecting MetaMask left an eight-hour dashboard
session active, the repository owner directs the root to synchronize accepted
wallet loss with the existing logout route. The root additionally reserves one
new `dashboard-session-sync.tsx` client component, its focused
`dashboard-session-sync.test.mjs` contract, and its mount inside the existing
server-authenticated navigation boundary.
After the shared wallet state has exposed one settled identity, a later
`disconnected` state may send exactly one same-origin `POST /api/auth/logout`;
after a successful response it replaces the route with `/sign-in` and refreshes
the App Router. Initial disconnected, rejected-connect, connecting, and
wrong-chain states do nothing. The amendment adds no provider discovery,
account request, event-payload trust, signature, storage, retry, transaction,
relay, deployment, or external request, and it does not amend S26 or M50 source.
