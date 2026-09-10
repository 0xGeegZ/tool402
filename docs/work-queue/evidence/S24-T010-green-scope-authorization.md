# S24-T010 dashboard implementation scope authorization

The human explicitly directed the dashboard lane to proceed beyond test-only
RED. The active scope is exactly:

- `apps/web/src/app/dashboard/page.tsx`;
- `apps/web/src/components/workspace/workspace-shell.tsx`;
- `apps/web/src/components/workspace/workspace-overview.tsx`;
- `apps/web/src/components/workspace/workspace-navigation.tsx`;
- `apps/web/tests/workspace-shell.test.mjs`; and
- `apps/web/tests/dashboard-workspace-reconciliation.test.mjs`.

All visible content remains truth-first. No account, wallet, provider, balance,
payment, transaction, receipt, evidence, funding, return, or live state may be
added. All paths outside this list remain prohibited.
