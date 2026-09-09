# M40-T010 payload and lifecycle module review

## Scope

Fresh independent review at clean pushed
`9f45f35a2dd43a80dd8e727be04ea3136e0c5cfa` of the M40 offering and command
binding portion, against the committed M40 card and specification:

- `packages/backend/src/offering-command-admission.ts`;
- `packages/backend/convex/offerings.ts`; and
- `packages/backend/tests/offering-command-admission.test.mjs`.

## Review

- The command helper parses and canonical-hashes the raw M38 payload before
  durable access, enforces exact command/payload expiry equality and server
  time bounds, then revalidates the current authority and replay identity.
- An offering replay now reconstructs every persisted M38 field using the
  already-bound command expiry and compares canonical payload bytes before it
  can return `IDEMPOTENCY_REPLAYED`.
- Drift in definition terms, narrative, either advertised price, identifiers,
  or idempotency data consumes only an unlinked conflict claim. The
  DRAFT-to-pending and pending-to-ready seams retain their bounded ownership,
  attempt, and canonical asset-link checks.
- The public projection stays read-only and excludes admission-sensitive
  fields. No external capability, environment, provider, wallet, SDK, or
  network behavior was added.

## Verification

Under Node 22.21.1, the focused offering suite passed 17/17 and Backend
typecheck, complete Backend tests, queue validation, whitespace, and a clean
working-tree check passed.

## Verdict

CLEAR — no Critical, Important, or Minor finding. This is one required fresh
M40 module-review generation.
