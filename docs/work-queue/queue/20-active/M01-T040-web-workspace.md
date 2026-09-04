# M01-T040 — Web workspace foundation

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T010 accepted; M01-T090 accepted
- Owner: implementation lane owns `apps/web/**`; root owns queue state and root integration.

## Scope

The local specification is [M01 web workspace](../../../specs/m01-web-workspace.md). Create only the Next foundation shell with Cache Components enabled. No product route, wallet, payment, credential, provider, or deployment behavior belongs here.

## Validation

- Missing-app RED followed by a focused GREEN check
- `npm run build --workspace @tool402/web`
- `npm run typecheck --workspace @tool402/web`
- Static-shell and cache-configuration smoke

## Completion transition

After targeted verification and root integration, move this card to `60-done`.
