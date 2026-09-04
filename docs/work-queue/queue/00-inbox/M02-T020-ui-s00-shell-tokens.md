# M02-T020 — UI-S00 shell and tokens

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T040 accepted
- Integration evidence: D-M01-FOUND-001 accepted
- Owner: implementation lane owns `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/components/ui/**`, `apps/web/src/components/tool402/logo.tsx`, focused tests, and the local UI manifest; root owns this card, package metadata, lockfile, and queue records.
- Human actions: none

## Scope

Create only the local visual tokens, reusable primitives, and honest application shell required by later discovery work. Adapt only the selected local visual patterns that have no mock data, analytics, hosted font, provider, authentication, payment, or evidence dependency. The shell must make no claim about tools, settlement, providers, metrics, accounts, or live integrations.

## Validation

- Commit a local UI manifest before adaptation.
- Keep any dependency change root-integrated and limited to what the selected slice proves necessary.
- Add RED/GREEN focused component or route expectations for the local shell and primitives.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run build --workspace @tool402/web`
- Browser-check the static shell at desktop and narrow viewport widths.

## Completion transition

Move to 10-ready only after the local manifest, owned-path preflight, and concrete commands are committed. UI-S01 may use this shell; detail and paid-state screens remain separate cards.
