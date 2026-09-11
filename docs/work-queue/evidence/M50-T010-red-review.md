# M50-T010 independent RED review

## Scope

Independent review covered durable test-only commit
`3d8ad88a5d654b974ef7154874a7564d0f3e938e` against the M50 card,
specification, activation evidence, and ownership records.

Only these activated paths changed:

- `apps/web/tests/wallet-state.test.mjs`; and
- `apps/web/tests/wallet-session-sync.test.mjs`.

## Findings and correction

The initial review correctly blocked GREEN because the first RED contract did
not prove zero registration with incomplete native event capability, did not
bind cleanup to unmount/disconnect, allowed unsafe work after a safe callback
prefix, and did not exclude direct raw listener wiring. The exact test-only
correction resolves all four findings:

- incomplete `on`/`removeListener` capability fakes record and require zero
  native calls;
- the island contract requires effect-owned cleanup, a shared cleanup ref,
  effect-return cleanup, and local-disconnect invocation;
- the complete native handler is checked for immediate `connecting` before the
  passive reader and rejects account/wallet/sign/relay/network/storage/timer
  work; and
- raw island event wiring is excluded so the named helper is the sole seam.

## Verification

- Node 22.21.1 focused RED run: 12 existing contracts passed and only three
  intended absent-helper/island-wiring contracts failed.
- `git diff --check` is clear.
- Scoped re-review found all four prior Important findings addressed with no
  new Critical or Important breakage.

## Verdict

**CLEAR — retain M50-T010 in `20-active` and authorize minimal GREEN only in:**

- `apps/web/src/lib/wallet/metamask-provider.ts`;
- `apps/web/src/components/wallet/wallet-connect.tsx`;
- `apps/web/tests/wallet-state.test.mjs`; and
- `apps/web/tests/wallet-session-sync.test.mjs`.

No `wallet-state.ts`, deploy-stage signing, command/relay, package,
configuration, wallet/provider action, signature, request, transaction,
deployment, or live boundary is authorized.
