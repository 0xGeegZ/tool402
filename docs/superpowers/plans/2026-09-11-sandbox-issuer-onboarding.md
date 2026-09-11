# Sandbox issuer onboarding implementation plan

> **For agentic workers:** use `superpowers:executing-plans` task by task.

**Goal:** A successfully authenticated MetaMask wallet automatically receives
one isolated sandbox issuer that can create its own offering `DRAFT` in
`/provider/deploy` and nothing else.

**Design:** `docs/superpowers/specs/2026-09-11-sandbox-issuer-onboarding-design.md`

## Preconditions

- [ ] S38-T010 has been accepted at a recorded exact head.
- [ ] S39 readiness independently confirms that the dynamic-subject and
  capability boundaries do not collide with S21/M47/M49 or the manual ATS
  authority.
- [ ] A human has supplied the private deployment configuration. No source
  task may invent it or use a fallback.

## Task 1 — authorize and prove the capability model in RED

**Files:** S39 queue records; `packages/core/src/ingress-envelope.ts`, its
focused tests, `packages/backend/src/ingress/protected-ingress-verifier.ts`,
its focused tests, `packages/backend/convex/schema.ts`, ingress normalizers,
durable-admission modules, and their focused tests, only after activation.

- [ ] Extend the existing fixed ingress envelope to a closed union of
  `/internal/commands` and `/internal/sandbox-issuers`; pass the expected path
  into the verifier so an otherwise valid HMAC for one endpoint cannot be
  replayed to the other. Keep the command endpoint behaviour byte-for-byte.
- [ ] Add a backwards-compatible optional `allowedCommandTypes` field and
  exact-record parsers. Legacy absence preserves existing rows; a sandbox row
  must have exactly `["offering.create"]`.
- [ ] Write RED contracts proving one canonical personal authority is resolved;
  malformed, duplicate, disabled, conflicting, or capability-less sandbox
  records reject; `external.prepare`, `external.attachCandidate`, and
  `directory.publish` reject before durable side effects.
- [ ] Record independent RED acceptance before changing production sources.

## Task 2 — private, idempotent backend provisioning

**Files:** a dedicated Convex provisioning mutation and private HMAC HTTP
handler, capability/ingress seams, `apps/web/src/lib/wallet/command-relay.ts`
and its focused tests for the shared path-bound signer, a server-only sandbox
provisioning helper, and focused backend/web tests.

- [ ] Derive all authority values from only a canonical address. Query two rows
  to detect duplicates; return `NEW` only on atomic insertion and `EXISTS` only
  when every stored field exactly matches. Never mutate another authority.
- [ ] Use the Task-1 expected-path verifier and shared HMAC signer for the
  separate ingress path and replay identity. Accept only an exact address body
  from the Next server; never expose it as a public mutation or browser request.
- [ ] Prove replay, path substitution, malformed body, duplicate/mismatch, and
  no-write failures with injected clock/HMAC seams.

## Task 3 — make session issuance contingent on provisioning

**Files:** the declared S38 auth route/helper and its focused tests, plus a
small server-only provisioning relay.

- [ ] After S38 signature verification, call the private backend with the
  verified address; issue the `HttpOnly` session only for exact `NEW`/`EXISTS`.
- [ ] Return a closed `not_configured`/`unavailable` outcome for absent
  deployment config, bad response, transport failure, or conflict. Do not
  leak address, authority, HMAC, or backend detail.
- [ ] Prove the verifier runs first, provisioning gets the verified—not
  browser-supplied—address, and failure sets no session cookie.

## Task 4 — restrict provider deploy to the sandbox draft

**Files:** `/provider/deploy` page/route guard, provider wizard/signing state,
`command-bridge.ts`, and focused web tests.

- [ ] Require the signed S38 session before rendering `/provider/deploy` and
  derive its personal subject server-side. Require the active shared wallet to
  equal the signed session address before a signature request.
- [ ] Replace only the stage-0 subject in the command bridge with the
  server-derived personal subject. Keep shared ATS command projection unchanged.
- [ ] Render a clear `Create sandbox draft` action. Make stages 1–3 unavailable
  for this scope and keep backend rejection as a second line of defence.
- [ ] Prove no static shared subject occurs in sandbox stage 0 and no forbidden
  stage can request a signature or cause an external command.

## Task 5 — verify and release safely

- [ ] Run focused Backend and Web tests, complete root tests, typechecks, lint,
  build, queue/reference/Git guards, and independent task/specification/
  standards reviews.
- [ ] Human browser proof: authenticate, observe Dashboard navigation, open
  `/provider/deploy`, sign `offering.create`, and verify only `DRAFT`. Do not
  request or submit an ATS transaction.
- [ ] Record configuration/release and browser evidence separately from source
  proof. Keep the PR draft until all required human actions are complete.
