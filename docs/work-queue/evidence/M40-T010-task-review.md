# M40-T010 final task review

## Scope

Independent final review of the M40 implementation at clean pushed
`9f45f35a2dd43a80dd8e727be04ea3136e0c5cfa`:

- the [M40 control card](../queue/60-done/M40-T010-offering-directory-durable-admission.md);
- the [M40 specification](../../specs/m40-offering-directory-durable-admission.md);
- the additive `packages/backend/convex/schema.ts` reservation;
- `packages/backend/src/offering-command-admission.ts`;
- `packages/backend/convex/offerings.ts` and
  `packages/backend/convex/directory_versions.ts`; and
- the three declared M40 focused Backend tests.

The review checked parser-first command rebinding, current authority and
replay precedence, bounded durable reads, the offering and Directory state
machines, replay/conflict claims, sanitized projections, and every declared
local-only boundary.

## Verification

Under Node 22.21.1:

- focused M40 suites: 34/34 passed;
- direct M04/M32 regression suites passed;
- complete root test, typecheck, and lint passed;
- queue validation, whitespace check, local-reference guard, and enabled Git
  guard passed; and
- `HEAD` matched `origin/main` and the working tree was clean.

The final stored-offering integrity regression is covered: a canonical but
altered stored definition, narrative, or price produces only an unlinked
`IDEMPOTENCY_CONFLICT`, never an idempotent replay. No wallet, provider, SDK,
environment, network, external, transaction, deployment, or live behavior
appears in the reviewed paths.

## Verdict

CLEAR — no Critical, Important, or Minor finding. M40 may move to `60-done`
as a local durable admission layer only.
