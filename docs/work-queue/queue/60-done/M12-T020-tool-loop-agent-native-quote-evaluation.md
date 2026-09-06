# M12-T020 — ToolLoopAgent native quote evaluation

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M05-T020 accepted; M06-T010 accepted; M12-T010 accepted
- Owner: the proposed implementation scope is
  `apps/agent/src/riskscan-tool-native-quote-evaluation.ts`,
  `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`, and
  `apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs`.
  The root-owned public package contract also reserves
  `apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`.
  The root owns this card, its local specification and plan, package export,
  explicit local dependency, `package-lock.json`, queue state, catalog, file
  ownership, decisions, reviews, integration evidence, and pushes.
- Human actions: none for controlled local Agent composition and tests.
  HA-X402-HEDERA-001 remains a later human-only prerequisite for a payment
  client or live proof; while pending it grants no external authority and does
  not block this local composition.

## Scope

Create one headless ToolLoopAgent boundary that requires a caller-supplied
fetcher and calls accepted local RiskScan directory discovery exactly once
through it. It never defaults to global `fetch`. It forwards
only a selected configured native summary to the accepted pure native quote
evaluator with a caller-supplied opaque policy. It returns only bounded
directory failures, a bounded unavailable-native-summary outcome, or the
bounded core eligibility result.

The Agent does not read a raw directory response or duplicate its validation.
It makes no direct fetch, POST, request, body, header, payment/client,
recipient/facilitator, wallet/account/key/signer, configuration/environment,
backend/store, timer/retry, result, settlement, persistence, deployment, or
live-service claim. A local eligible result is not payment authority.

The local contract is [M12 ToolLoopAgent native quote evaluation](../../../specs/m12-tool-loop-agent-native-quote-evaluation.md), the local specification record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), and execution is in the [M12 ToolLoopAgent native quote evaluation plan](../../../superpowers/plans/2026-09-06-m12-tool-loop-agent-native-quote-evaluation.md).

## Candidate ready requirements

- The local contract, runtime-local ledger row, and implementation plan are
  committed before a RED test or code change.
- M05-T020, M06-T010, and M12-T010 remain accepted locally, and no active
  card owns the reserved Agent paths or the root-owned package integration.
- The card records the exact one-GET composition, opaque-policy ordering,
  bounded outcomes, required injected fetcher, executable public package
  subpath, explicit local package export/dependency, tier, human boundary, and
  concrete validation rules.
- The delivery excludes directory revalidation, request/challenge flow,
  payment/header handling, a payment client, account/wallet/signer/key action,
  configuration/environment, backend/persistence, UI, deployment, external
  proof, transaction/finality, result, receipt, evidence, and live claims.

## Validation

- RED/GREEN Agent tests cover exact one-GET native compatibility, local
  equality/cap/asset results, directory failure propagation without hostile
  policy inspection, configuration/EVM unavailable-native-summary behavior,
  malformed native-policy decline, missing/non-function fetcher rejection
  without global fetch, and repeat-call request isolation.
- A package-level RED/GREEN test imports and exercises the public Agent
  subpath after the explicit local dependency and lockfile are in place.
- A dedicated source-boundary test rejects direct fetch, POST, body/header,
  payment/client, wallet/account/signer/key, environment, backend/store,
  timer/retry, response-body/result, and hidden-side-effect behavior.
- `npm run typecheck --workspace @tool402/agent`
- `npm run test --workspace @tool402/agent`
- `npm run lint --workspace @tool402/agent`
- Root clean-install, typecheck/test/lint, production Webpack build,
  queue/reference/whitespace checks, controlled local Agent exercise,
  independent task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-06T13:14:50Z after a fresh post-M12 rescan confirmed
M05-T020, M06-T010, and M12-T010 accepted; no active implementation owner of
the new Agent paths or root-owned package integration; and a remaining local
composition prerequisite before any later human-authorized payment client.
This inbox card authorizes only its local contract, ledger row, and plan. It
authorizes neither RED/code nor a payment, signing, account, wallet,
transaction, deployment, or live claim.

## Readiness amendment

At 2026-09-06T13:27:05Z, independent readiness review found that the original
plan could falsely GREEN through a hoisted core dependency, left the public
Agent subpath without an executable test, allowed a default global fetch, and
did not make all premature-policy-access paths executable. The amended
contract requires the injected fetcher, establishes a locally RED public
package boundary before source implementation, verifies the explicit local
dependency and public export through an exercising package-level test, and
uses a policy proxy that rejects property, reflection, enumeration, and
descriptor access before native selection. A fresh independent readiness
review is required before this card may leave inbox.

## Ready transition

Ready at 2026-09-06T13:36:26Z after a fresh independent review of pushed
`2a05c69aab09a8bb0024744311a8c470cfac52c2` found accepted M05-T020,
M06-T010, and M12-T010 dependencies; disjoint Agent and root package/lockfile
ownership; resolvable local links; required injected-fetcher enforcement;
executable public package-subpath RED/GREEN coverage; opaque-policy
noninspection coverage; and no local human blocker coherent. This ready state
authorizes only the bounded local RED package boundary and later Agent source
contract. It does not authorize a payment, signing, account, wallet,
transaction, deployment, or live claim.

## Activation

Activated at 2026-09-06T13:40:14Z after a fresh local rescan confirmed pushed
ready state, accepted M05-T020, M06-T010, and M12-T010 dependencies, no active
owner of the reserved Agent or root package/lockfile paths, resolvable local
records, and no human blocker for controlled local work. This active state
authorizes the root-owned RED public-package boundary followed by the bounded
Agent source contract. It does not authorize a payment, signing, account,
wallet, transaction, deployment, or live claim.

## Acceptance

Accepted at 2026-09-06T14:18:17Z after a fresh queue rescan confirmed the
accepted M05-T020, M06-T010, and M12-T010 dependencies and no conflicting
active owner of the Agent or root package paths.

- `MODULE_BASE` is `fcb1f67d335c139f41498625839513ffbf24b0ed`; `MODULE_HEAD`
  is `98c9c7af8f842b6b5e63ddef414bed277b96bc70`. The package-boundary RED
  commit is `509a39e`; the bounded Agent implementation commit is `98c9c7a`.
- Public-package RED first observed the missing public subpath, then the
  absent declared source target. The Agent source RED observed the missing
  source target before implementation. The final focused public/source/boundary
  suite has eight passing cases, including one injected credential-free GET,
  exact large-amount preservation, terminal directory propagation,
  untouched opaque policy before native selection, required-fetcher rejection,
  native policy declines, and request isolation.
- Root clean-install dry run, dependency-tree check, root typecheck/test/lint,
  queue/whitespace/reference checks, and the enabled local guard passed under
  Node 22.21.1. The controlled public Agent exercise passed with one injected
  directory GET and no POST. The production Webpack build passed with Cache
  Components; it retains only the pre-existing optional upstream
  `@x402/paywall` resolution warning. Default Turbopack build remains an
  environment-local IPC-listener permission limitation outside this card's
  paths.
- Independent task review was clean. The first fresh Standards/Specification
  module-review generation was clean. The second fresh Specification review
  was clean; an initial Standards judgement call about intentionally
  independent package/source test fixtures required no code change, and a
  fresh Standards convergence review found no reportable finding.

Acceptance covers only controlled local Agent composition and quote
compatibility. It does not prove or authorize a payment, signing, account,
wallet, transaction, settlement, deployment, or live behavior.
