# M56-T010 — Backing demo MVP

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: S18-T010, S21-T010, M40-T010, M41-T010, and M50-T010 accepted.
- Owner: root owns the complete M56 control and implementation slice: control records, server/authority/page/detail/flow paths, tests, reviews, integration, and commits.
- Human actions: one separately accepted/revoked BACKER authority and one explicit testnet transfer are Human Ops actions.

## Purpose and root paths

S18 already implements local units → HEDERA_FUNDING → explicit transfer → local submitted state. It is unavailable because the page passes `projection={null}` and the treasury is missing. M56 unblocks that exact journey without redesign.

- `apps/web/src/lib/backing-demo-projection.ts` (new);
- `apps/web/src/app/explore/riskscan/back/page.tsx`;
- `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`;
- `apps/web/src/components/backing/backing-flow.tsx`;
- `apps/web/tests/backing-demo-projection.test.mjs` (new); and
- `apps/web/tests/backing-demo-route.test.mjs` (new).

The root also reserves `packages/backend/convex/schema.ts`, `packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts`, `packages/backend/convex/external_prepare_command_admission.ts`, and new `packages/backend/tests/backing-funding-authority.test.mjs`. M56 changes no S26-owned test or backing-state path. No allocation, directory, ATS candidate, package, lockfile, or generic wallet path is in scope.

## Contract

The full local contract is [M56 Backing demo MVP](../../../specs/m56-backing-demo-mvp.md). The detail PageHeader receives exactly one third action `{ href: "/explore/riskscan/back", label: "Back this tool" }` and no data/mutation. The page may hand the existing flow only a server-derived fixed RiskScan OPEN projection plus configured treasury. A canonical MetaMask hash maps only to `payment_submitted` with the exact UI copy `Payment submitted — allocation pending.`
