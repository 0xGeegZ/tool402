# M01-T020 — Core workspace foundation

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T010 accepted; M01-T090 accepted
- Owner: implementation lane owns `packages/core/**`; root owns queue state and root integration.

## Scope

The local specification is [M01 core workspace](../../../specs/m01-core-workspace.md). Create only the pure `@tool402/core` package boundary and its focused checks. No adapter, network, product, payment, or external behavior belongs here.

## Validation

- Missing-package RED followed by a focused GREEN check
- `npm run typecheck --workspace @tool402/core`
- `npm run test --workspace @tool402/core`
- `npm run lint --workspace @tool402/core`
- Boundary test for prohibited I/O imports

## Completion transition

After targeted verification and root integration, move this card to `60-done`.
