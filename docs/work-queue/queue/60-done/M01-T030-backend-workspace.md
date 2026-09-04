# M01-T030 — Backend workspace foundation

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T010 accepted; M01-T090 accepted
- Owner: implementation lane owns `packages/backend/**`; root owns queue state and root integration.

## Scope

The local specification is [M01 backend workspace](../../../specs/m01-backend-workspace.md). Create only the local backend package and Convex source boundary. No deployment, credential, generated API, public state-changing command, or product behavior belongs here.

## Validation

- Missing-package RED followed by a focused GREEN check
- `npm run typecheck --workspace @tool402/backend`
- `npm run test --workspace @tool402/backend`
- `npm run lint --workspace @tool402/backend`
- Boundary test for public state-changing command exports

## Completion transition

Accepted at 2026-09-04T20:52:36Z after RED/GREEN evidence, focused typecheck, test, lint, no-public-command boundary checks, root workspace verification, and independent task review. No deployment, credential, generated API, or product behavior was added.
