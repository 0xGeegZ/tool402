# M46-T040 activation review

## Scope

Independent current-head activation review at clean pushed
`48ca520c4904b1fe01c88cd6ea3d0d9d15d55078` of the ready M46-T040 card,
specification, accepted dependencies, compatibility amendment, ownership
reservation, declared RED paths, worktree records, queue, guard, and baseline
validation.

## Findings

- `HEAD` and `origin/main` were equal, the root worktree was clean, and the
  whitespace check was clear.
- M05-T010, M05-T020, M06-T010, M45-T010, and M46-T030 remain accepted. The
  card, specification, catalog, State, ownership reservation, compatibility
  amendment, D-M46-040-001, D-M46-040-002, and ready review resolve locally.
- `apps/web/src/lib/entity-check-tool-descriptor.ts` and
  `apps/web/tests/entity-check-tool-descriptor.test.mjs` remain absent. The
  ten declared existing Directory-consumer fixtures remain present.
- No active M46 ownership or registered M46 worktree collision exists. The
  independent M44 direct-contract review is confined to ATS paths and does
  not overlap any M46-T040 source or test path.
- Under Node 22.21.1, the focused Web/Agent Directory baseline (42/42), root
  typecheck, `npm run queue:check`, enabled local-reference guard, and
  whitespace check passed without a live call.

## Verdict

CLEAR — activate M46-T040 only for its durable test-only RED contract at:

- `apps/web/tests/entity-check-tool-descriptor.test.mjs`
- `apps/web/tests/tool-directory-api.test.mjs`
- `apps/agent/test/riskscan-tool-directory.test.mjs`
- `apps/agent/test/riskscan-tool-flow.test.mjs`
- `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`
- `apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`
- `apps/agent/test/riskscan-tool-payment.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`
- `apps/web/tests/riskscan-directory-discovery.test.mjs`
- `apps/web/tests/riskscan-native-quote-compatibility.test.mjs`
- `apps/web/tests/riskscan-tool-loop.test.mjs`

The three source paths, route, active-directory view, UI, package, lockfile,
configuration, source read, payment, wallet/provider, transaction,
deployment, and live behavior remain prohibited pending fresh independent RED
acceptance.
