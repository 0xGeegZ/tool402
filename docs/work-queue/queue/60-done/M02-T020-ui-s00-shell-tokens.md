# M02-T020 — UI-S00 shell and tokens

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted
- Integration evidence: D-M01-FOUND-001 accepted
- Owner: implementation lane owns `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/components/ui/**`, `apps/web/src/components/tool402/logo.tsx`, `apps/web/public/brand/**`, `apps/web/postcss.config.mjs`, focused tests, and the local UI manifest; root owns this card, package metadata, lockfile, and queue records.
- Human actions: none

## Scope

Create only the local visual tokens, reusable primitives, and honest application shell required by later discovery work. Adapt only the selected local visual patterns that have no mock data, analytics, hosted font, provider, authentication, payment, or evidence dependency. The shell must make no claim about tools, settlement, providers, metrics, accounts, or live integrations.

The local UI manifest is [UI-S00](../../../ui/UI-S00.md) and the slice is recorded in the [local UI ledger](../../../ui/IMPORT-LEDGER.md).

## Validation

- Commit a local UI manifest before adaptation.
- Keep any dependency change root-integrated and limited to what the selected slice proves necessary.
- Add RED/GREEN focused component or route expectations for the local shell and primitives.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- `npm run build --workspace @tool402/web`
- Browser-check the static shell at desktop and narrow viewport widths.

## Completion transition

Accepted at 2026-09-04T21:48:40Z after focused web tests/typecheck, a production webpack build with Cache Components enabled, desktop and narrow browser checks, the local-reference guard, and two consecutive fresh clean review generations. The default Turbopack build was blocked by a host process policy before compilation; the official webpack fallback completed the production build. MODULE_BASE: `35a45debbdb878891c547155db6dd6e56de23e49`; MODULE_HEAD: `7d0896e3b1d355a273146c7c972a91fbd4da1c9c`. UI-S01 may use this shell; detail and paid-state screens remain separate cards.
