# M56-T010 — Backing demo MVP

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: S18-T010, S21-T010, M40-T010, M41-T010, and M50-T010 accepted.
- Owner: root owns control records, all Backend authority paths, the one constrained S26 integration seam below, reviews, integration, and commits. The user-requested delegated lane owns the listed backing-specific Web/new-test paths after root records the authority control plane and a separate RED activation.
- Human actions: one separately accepted/revoked BACKER authority and one explicit testnet transfer are Human Ops actions.

## Purpose and root paths

S18 already implements local units → HEDERA_FUNDING → explicit transfer → local submitted state. It is unavailable because the page passes `projection={null}` and the treasury is missing. M56 unblocks that exact journey without redesign.

- `apps/web/src/lib/backing-demo-projection.ts` (new);
- `apps/web/src/app/explore/riskscan/back/page.tsx`;
- `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`;
- `apps/web/tests/backing-demo-projection.test.mjs` (new);
- `apps/web/tests/backing-demo-route.test.mjs` (new);
- `packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs`;
- `packages/backend/tests/authenticated-wallet-command-normalizer.test.mjs`;
- `packages/backend/tests/command-dispatch.test.mjs`;
- `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`;
- `packages/backend/tests/external-prepare-command-durable-schema.test.mjs`;
- `packages/backend/tests/http-command-ingress.test.mjs`; and
- `packages/backend/tests/offering-durable-schema.test.mjs`.

The root reserves `packages/backend/convex/schema.ts`, `packages/backend/convex/wallet_command_replay.ts`, `packages/backend/src/ingress/authenticated-external-prepare-normalizer.ts` (the shared authority record only), `packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts`, and `packages/backend/convex/external_prepare_command_admission.ts`. The delegated lane owns the listed Web page, projection helper, detail entry point, and its two new tests. S26 retains its active island mount, header, and Funding composition ownership in `backing-flow.tsx`; M56's only root integration seam in that file is the `payment_submitted` display branch, which shows the canonical hash and the exact status copy. M56 changes no S26-owned test or backing-state path. No allocation, directory, ATS candidate, package, lockfile, or generic wallet path is in scope.

`packages/backend/tests/command-dispatch.test.mjs` and its current adapter
correction remain actively owned by M51-T010. Per the owner's no-competing-M51
direction, M56 must not activate or amend that path. The Backend authority
implementation, including its named test paths, waits for M51 acceptance or a
separate root-recorded non-competing handoff. This does not block the delegated
Web-only RED lane below.

## Contract

The full local contract is [M56 Backing demo MVP](../../../specs/m56-backing-demo-mvp.md). The detail PageHeader receives exactly one third action `{ href: "/explore/riskscan/back", label: "Back this tool" }` and no data/mutation. The page may hand the existing flow only a server-derived fixed RiskScan OPEN projection plus configured treasury. A canonical MetaMask hash maps only to `payment_submitted`, is displayed as an unqualified transaction hash, and accompanies the exact UI copy `Payment submitted — allocation pending.`

## Readiness

The independent [M56 readiness review](../../evidence/M56-T010-ready-review.md) is
clear at `10299ede`. M56 is ready only for a separate test-only RED activation.
No source or test path is active, and no environment mutation, authority-row
provisioning, signature, transaction, allocation, deployment, or live action is
authorized by this transition.

## Partial RED activation

The independent [M56 activation review](../../evidence/M56-T010-activation-review.md)
blocks the complete M56 RED scope on active M51 ownership. It authorizes only
`apps/web/tests/backing-demo-projection.test.mjs` and
`apps/web/tests/backing-demo-route.test.mjs` for durable RED. All source paths,
every Backend test, the M51-owned command-dispatch path, and every S26-owned
flow composition path remain prohibited pending a new review.
