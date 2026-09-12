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

The following earlier integration checks were superseded by the final
remediation verification below:

- Task 1 focused contracts: 34/34.
- `npm test`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run queue:check` (`QUEUE_CHECK_OK`).
- `git diff --check`.

The initial review recorded here was also superseded by the fresh review of the
final executable implementation described below.

## Final Task 1 remediation

The final executable implementation SHA is
`c0caf21de8a01bc3c31d4b239e2b7d6ff50c2439`. The following evidence-only
commit `374e89f5b0fec86eeee071c8a76adbace3c8ee6b` adds no executable behavior;
the fresh reviews cover the exact `origin/main...374e89f5` diff. The
implementation tightens the owner-read projection so a linked offering must
match the allocated tool's offering ID/version, subject, canonical signer,
principal, and authority version. A differing linked context fails closed and
never becomes an `ALLOCATED` projection; `ALLOCATED` remains reserved for an
absent matching offering. The dashboard GET parser now permits only no query,
one `cursor`, or one `tool` selector before any dashboard-session read or
protected forward.

Under Node 22.21.1 at that implementation commit:

- the focused Core, provider-tool, provider-session ingress, M41 route, and
  provider-tools API contracts passed 46/46;
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run queue:check`, and
  `git diff --check origin/main...HEAD` passed;
- `npm run build` passed on exact `origin/main`
  `98cdbe29c59c44cc3145ddbef3615b985dfad45b` and the implementation commit.
- Fresh independent code/spec and standards reviews of
  `origin/main...374e89f5` found no executable P0/P1/P2 issue. The completed
  Codex Security diff scan `36c22b18-865a-4e38-ab42-edc5de1b2693` reviewed the
  eight changed executable surfaces and recorded zero findings.

POST retains its existing exact `{requestId}` JSON body. The Task 1 contract
closes the body fields and byte limit but does not define a separate
Content-Type rejection rule, so this remediation adds none.

## Remaining gate

M55 remains `20-active`. Tasks 2–6 still require their own documented scoped
transfer/release, readiness, RED acceptance, implementation and review. This
local Green acceptance is not browser proof of the new-tool button, a backend
deployment, a wallet signature, or a testnet deployment.

## PR #100 final merge-readiness addendum

The final executable implementation reviewed for PR #100 is
`ed28ce96a774f826169dfe3593eb4510eface037`, rebased on
`origin/main` `f080d5b2a637a261758e40be720b9723b2595c28`. It preserves the
Task 1 allocation/read acceptance above and includes the separately authorized
Tasks 2–6 source slices; M55 remains `20-active` pending human-controlled
runtime and live-testnet evidence.

At that exact executable head under Node 22.21.1:

- focused provider-tool and provider-session-ingress contracts passed 342/342;
- focused web provider-tool, deployment-resume, signing-race, API, route, and
  command contracts passed 481/481 (one existing skip);
- `npm run typecheck`, `npm run lint`, `npm run queue:check`, and
  `git diff --check` passed;
- a fresh independent code/spec/security review found no actionable P1/P2.

`npm test` on both that head and the exact current main has the same existing
failure in `apps/web/tests/dashboard-auth.test.mjs`: the test rejects the
`address` prop introduced by main's `DashboardSessionSync`. This PR does not
touch that dashboard-auth path. `npm run build` on both heads stops first at
the identical sandbox-only Turbopack error while processing `globals.css`
(`creating new process` / `binding to a port` / `Operation not permitted`).
Neither failure is attributed to this PR; a final Vercel Preview check remains
separate deploy-environment evidence.
