# M01-T030 — Backend workspace foundation

## State

- Tier: CORE_P0
- Queue state: 20-active
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

After targeted verification and root integration, move this card to `60-done`.
