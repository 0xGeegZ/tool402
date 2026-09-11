# M50-T010 independent activation review

## Scope

Independent read-only activation review at merged current control head
`96cce4c540c0510a9ab871b577a8b8f0b40ad9f6` covered the M50 card,
specification, plan, readiness evidence, catalog, State, decisions, ownership,
the accepted S15/S16 boundaries, M49 compatibility context, S26 inbox
reservation, and the four declared candidate paths.

## Findings

- S15-T010 and S16-T010 remain accepted. M49-T010 is accepted and has no
  active reservation on any M50 candidate path.
- S26-T010 remains `00-inbox`; its future shared-session reservation is not
  active and does not collide with M50. Merged S34/S35 documentation changes
  are disjoint from M50.
- `metamask-provider.ts`, `wallet-connect.tsx`, and `wallet-state.test.mjs`
  are present. `wallet-session-sync.test.mjs` remains absent. The worktree is
  clean before the activation record.
- The M50 contract remains native-event invalidation followed only by passive
  `eth_chainId`/`eth_accounts` re-evaluation. No wallet permission, account
  selection, chain switch, signature, relay, request, transaction, or live
  action is part of this activation.

## Verification

- Node 22.21.1 focused wallet baseline: 13/13 passed.
- Independent focused wallet/deploy/Stage-B baseline: 43/43 passed.
- `npm run queue:check`, the enabled local-reference guard, and
  `git diff --check` were clear.

## Verdict

**CLEAR — activate M50-T010 only for durable RED in:**

- `apps/web/tests/wallet-state.test.mjs`; and
- `apps/web/tests/wallet-session-sync.test.mjs`.

Every production source path, wallet/provider or account action, signature,
relay, request, transaction, deployment, and live action remains prohibited
pending independent RED acceptance.
