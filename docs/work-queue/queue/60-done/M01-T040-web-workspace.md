# M01-T040 — Web workspace foundation

## State

- Tier: CORE_P0
- Queue state: 60-done
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

Accepted at 2026-09-04T20:52:36Z after RED/GREEN evidence, production build, browser runtime verification, root typecheck, Cache Components diagnostics, and independent task review. The review-found fresh-clone route-type issue was corrected with local `next typegen` before TypeScript; no product route, wallet, payment, credential, provider, or deployment behavior was added.
