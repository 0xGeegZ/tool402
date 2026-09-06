# M13-T010 — Browser native quote compatibility

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M11-T020 accepted; M12-T020 accepted
- Owner: `apps/web/src/app/dashboard/riskscan/compatibility/page.tsx`,
  `apps/web/src/components/riskscan/native-quote/**`, and
  `apps/web/tests/riskscan-native-quote-compatibility.test.mjs` are this
  card's implementation paths. The card also owns the constrained local route
  link amendment in `apps/web/src/components/workspace/workspace-navigation.tsx`
  and its matching assertion amendment in
  `apps/web/tests/workspace-shell.test.mjs`. The root owns this card, local
  specification/UI manifest/ledger, plan, queue state, catalog, ownership,
  decisions, reviews, integration evidence, and pushes.
- Human actions: none for controlled current-origin local compatibility
  evaluation. HA-X402-HEDERA-001 remains a later human-only prerequisite for
  a payment client or live proof; while pending it grants no external
  authority and does not block this card.

## Scope

Add a guest Dashboard route at `/dashboard/riskscan/compatibility` that makes
the accepted native quote compatibility boundary inspectable in the product
surface. A user explicitly enters a network, asset identifier, and maximum
atomic amount, then asks the browser to evaluate that caller-defined policy
against the local Agent's safe Directory discovery result.

The new client island uses only the public
`@tool402/agent/riskscan-tool-native-quote-evaluation` subpath. On an explicit
form submission, it passes the current origin and an injected browser fetcher
to that boundary. The Agent remains the sole owner of the bounded directory
read, including its target and request metadata. The UI renders only the
bounded `directory_*`, `native_summary_unavailable`, `declined`, and
`eligible` outcomes. An eligible outcome means local compatibility only; it
is never consent, availability, a quote guarantee, a payment authorization,
or a completed transaction.

The local contract is [M13 browser native quote compatibility](../../../specs/m13-browser-native-quote-compatibility.md), its UI boundary is [UI-S08](../../../ui/UI-S08.md), the local UI ledger is [UI import ledger](../../../ui/IMPORT-LEDGER.md), and execution is in the [M13 browser native quote compatibility plan](../../../superpowers/plans/2026-09-06-m13-browser-native-quote-compatibility.md).

## Candidate ready requirements

- The local contract, UI-S08 manifest/ledger row, and implementation plan are
  committed before a RED test or code change.
- M01-T040, M11-T020, and M12-T020 remain accepted locally, and no active
  card owns the new route/island/test paths or the explicitly constrained
  workspace-navigation amendment.
- The card records three required no-default policy inputs, exact public-Agent
  delegation, one bounded directory read per deliberate submission,
  duplicate-submit locking, truthful outcome language, tier, human boundary,
  and concrete validation rules.
- The delivery excludes Sign/session/provider behavior, identity, account,
  wallet, signer, configuration/environment reads, direct endpoint/header/body
  construction, POST, payment client behavior, persistence, result/receipt/
  evidence, deployment, and live claims.

## Validation

- RED/GREEN contracts prove the exact policy record has only the three
  user-supplied fields and no defaults; public-Agent native compatibility
  yields one bounded Directory GET and zero POSTs; each bounded outcome has
  truthful fixed presentation; and repeat submits are locked until the active
  evaluation settles.
- Focused source checks prove a static server route plus one client island,
  required controls, current-origin/public-Agent delegation, the constrained
  Workspace route-map link, and the absence of prohibited authority, request,
  storage, configuration, timer/retry, and external-link behavior.
- Web/root typecheck, test, lint, clean-install dry run, production Webpack
  build, queue/reference/whitespace checks, enabled local guard, desktop and
  narrow browser checks, independent task review, and two fresh clean
  module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-06T14:37:21Z after a fresh post-M12 rescan found the
accepted Web foundation, guest workspace shell, and public Agent native quote
composition; no active owner of the new Dashboard route/island paths; and no
human blocker for a controlled current-origin compatibility view. The user has
confirmed that the future signed-in application is product scope, but this
card intentionally does not invent its unresolved session/provider contract.
This inbox card authorizes only its local contract, UI manifest/ledger row,
and plan. It authorizes neither RED/code nor Sign/session, payment, signing,
account, wallet, transaction, deployment, or live behavior.

## Ready transition

Ready at 2026-09-06T14:46:45Z after two fresh independent readiness reviews
found accepted M01-T040, M11-T020, and M12-T020 dependencies; resolvable local
records; a disjoint new Dashboard route/island/test boundary; the explicitly
constrained Workspace navigation/test amendment; public-Agent browser
feasibility; no-default policy semantics; and no human blocker for controlled
local compatibility evaluation. This ready state authorizes only the local
RED/GREEN compatibility contract. It does not authorize Sign/session, payment,
signing, account, wallet, transaction, deployment, or live behavior.

## Activation

Activated at 2026-09-06T14:48:00Z after a fresh local rescan confirmed pushed
ready state, accepted M01-T040, M11-T020, and M12-T020 dependencies, no active
conflicting owner, resolvable local records, and no human blocker for the
controlled guest compatibility surface. This active state authorizes the
focused local RED/GREEN route, island, state, and constrained navigation
contract only. It does not authorize Sign/session, payment, signing, account,
wallet, transaction, deployment, or live behavior.

## Acceptance

Accepted at 2026-09-06T15:15:27Z after a fresh queue rescan confirmed the
accepted M01-T040, M11-T020, and M12-T020 dependencies and no conflicting
active owner of the new route/island/test paths or its constrained Workspace
navigation amendment.

- `MODULE_BASE` is `99275b56e99ff59bb1dbd291a3d9e46c2f07d89f`; `MODULE_HEAD`
  is `7a30ace45cce1e1a87edd0d5a78add49d2a9a568`. The focused RED contract first
  observed the missing planned route/state sources. A later no-default
  regression observed missing form fields becoming empty strings, then GREEN
  preserved their raw `null` values without inventing a policy default.
- The focused M13 contracts, Web suite, root typecheck/test/lint, root queue
  validation, whitespace/reference checks, enabled local guard, and
  clean-install dry run passed under Node 22.21.1. The production Webpack build
  passed with Cache Components and the new static Dashboard route; it retains
  only the pre-existing optional upstream `@x402/paywall` resolution warning.
- Browser and Next runtime checks registered the route, found no compilation or
  runtime errors, and verified blank policy controls, Workspace navigation,
  one local `GET /api/tools` with no POST, an honest unavailable-native-summary
  outcome for current configuration, zero axe violations, visible keyboard
  focus, and no horizontal overflow at 390px.
- Independent task review and two fresh clean module-review generations found
  no Critical, Important, or Minor finding.

Acceptance covers only the guest local compatibility surface. It does not
provide or authorize Sign/session, identity, account, wallet, payment,
signing, transaction, settlement, deployment, or live behavior.
