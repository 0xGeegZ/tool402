# M41-T010 RED contract review

## Scope

Independent review at `66f4ca5` covered the four M41 RED contracts:

- `packages/backend/tests/http-command-ingress.test.mjs`
- `packages/backend/tests/command-dispatch.test.mjs`
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
- `packages/backend/tests/offering-command-admission.test.mjs`

## Observed RED

Under Node 22.21.1, the focused run has 35 passing checks, 28 deferred checks,
and exactly five intended absence failures. Those failures are limited to the
three declared M41 Convex modules, the reserved transport-replay table/index,
the scoped atomic M32 mutation, and the M40 DRAFT-offering linker. Syntax and
whitespace checks are clear.

## Established contract

- The protected route uses production ingress handling, rejects malformed
  configuration before access, and maps the closed durable outcomes without
  leaking internal identifiers.
- Signed `offering.create` and `directory.publish` dispatches prove their
  exact status, public-ID, replay, conflict, and precondition mappings.
- The ATS_CREATE handoff selects only the atomic M32 admission and its exact
  M40 DRAFT-to-`ASSET_PENDING` link; no independent state transition exists.
- Router registration, transport replay, authority projection, and public
  offering/directory path grammars fail closed.

## Verdict

CLEAR. This authorizes the declared M41 production scope only: the three
Convex modules, the reserved replay table/index, the scoped M32 atomic
admission, the M40 DRAFT-offering link/index, and the already-declared focused
test amendments. It does not authorize configuration, key material,
publication, wallet/provider/SDK access, transaction, deployment, or live
behavior.
