# M44-T030 independent activation review

## Scope

Independent activation review at clean canonical
`9942da622f765b5247baf682db0a9247efe50d0f` of M44-T030's ready authority,
card, specification, plan, intake/ready evidence, catalog, ownership, State,
decisions, accepted M44-T020/M42 controls, issue #25 reopening reason, Factory
helper/test, active lanes, and registered worktrees.

## Checks

- M44-T020 and M42-T010 remain accepted.
- Issue #25 was reopened because an all-numeric fixture masked valid EIP-55
  decoded Factory event output. The corrective scope preserves the official
  Factory artifact + viem seam and does not reopen bundle work.
- M47, B03-T020, S22-T010, S24-T010, and active worktrees are disjoint from
  both M44-T030 paths.
- Under Node 22.21.1, focused Factory baseline passes 8/8; queue validation,
  enabled reference guard, and whitespace checks are clear.

## Verdict

CLEAR — activate M44-T030 only for durable test-only RED in
`apps/web/tests/factory-deploy-bond.test.mjs`. The helper source remains
prohibited pending a separate independent RED review. No package, lockfile,
SDK/browser graph, provider, wallet, RPC, transaction, deployment, or live
path is authorized.
