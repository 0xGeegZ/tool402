# M55-T010 Task 1 — Green acceptance

## Scope

This acceptance covers only Task 1: server-generated provider-tool identity
allocation and authenticated owner-scoped read/list access. It does not create
an offering, ATS attempt, receipt binding, Directory record, UI action, or
live deployment.

The accepted code is limited to the Task 1 Core/Backend/Web paths recorded in
the [readiness review](M55-T010-task1-readiness-review.md), plus the one
activated M41 HTTP route-inventory expectation in the
[supplement](M55-T010-task1-http-route-supplement.md). No Task 2–6 or active
predecessor path is transferred.

## Contracts accepted

- A server-only allocator creates a detached 128-bit tool identity, binds it
  to the exact approved Stage-B issuer on chain 296, and transactionally
  revalidates authority before an idempotent replay or insert.
- `providerTools` stores ownership/identity facts only. Owner reads derive
  `ALLOCATED` when no matching offering exists, and otherwise expose only the
  matching offering's safe title and lifecycle state.
- The dashboard route allocates only on an exact-origin authenticated POST.
  Owner-scoped GET list/read does not allocate; it permits an ordinary
  same-origin GET without an `Origin` header and rejects an explicit foreign
  origin or duplicate session cookie.
- The dedicated Convex HTTP endpoint verifies its own provider-session HMAC
  domain, HTTPS target/path, bounded canonical timestamp/body/signature,
  durable nonce replay claim, current unexpired session assertion, and bounded
  response. It uses Web crypto primitives, not Node `Buffer`.

## Verification

Under Node 22.21.1, the following all passed on the exact integration diff:

- Task 1 focused contracts: 34/34.
- `npm test`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run queue:check` (`QUEUE_CHECK_OK`).
- `git diff --check`.

A fresh independent exact-head review is clear after correcting the GET
Origin gate. It reproduced an authenticated same-origin GET without `Origin`
as one session read and one forward, and confirmed an explicit foreign Origin
rejects before session work. No P0/P1/P2 findings remain for Task 1 Green.

## Remaining gate

M55 remains `20-active`. Tasks 2–6 still require their own documented scoped
transfer/release, readiness, RED acceptance, implementation and review. This
local Green acceptance is not browser proof of the new-tool button, a backend
deployment, a wallet signature, or a testnet deployment.
