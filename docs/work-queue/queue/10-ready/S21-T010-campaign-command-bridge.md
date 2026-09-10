# S21-T010 — Campaign command bridge

## State

- Tier: CORE_P0
- Queue state: 10-ready — corrective test-only RED awaits a fresh activation
- Dependencies: M26-T010 accepted, M30-T010 accepted, M38-T010 accepted,
  S15-T010 accepted, S16-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed new implementation paths
  are exactly `apps/web/src/lib/wallet/command-bridge.ts`,
  `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`,
  `apps/web/src/components/provider/deploy/directory-record-literal.ts`,
  `apps/web/tests/command-bridge.test.mjs`, and
  `apps/web/tests/deploy-stage-signing.test.mjs`. The card also requests
  constrained amendments under root integration reservations to the accepted
  S15 files `apps/web/src/lib/wallet/tool402-command.ts`,
  `apps/web/src/lib/wallet/command-relay.ts`,
  `apps/web/tests/tool402-command.test.mjs`,
  `apps/web/tests/commands-api.test.mjs`, and `docs/ui/UI-S15.md`, and to
  the S16 files `apps/web/src/components/provider/deploy/provider-deploy-state.ts`,
  `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`,
  `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`,
  `apps/web/tests/provider-deploy-state.test.mjs`, and
  `apps/web/tests/provider-deploy-route.test.mjs`. It adds no dependency and
  touches no package manifest or lockfile.
- Human actions: none for local delivery. Every stage control renders the
  same closed state it renders today until a wallet is connected and a
  signature is requested by the human. A relayed `ACCEPTED` for stage 1 or
  stage 4 additionally needs the `HA-CAMPAIGN-CONVEX-001` environment values
  on the web host and the accepted M40 and in-batch M41 boundaries; stage 2
  additionally needs an enabled M33 mapping, which only `HA-ATS-STAGE-B-001`
  supplies; the second sub-step of stage 3 additionally needs the in-batch
  M43 dispatch entry and a candidate returned by the separately carded M44
  action. This card marks no human action complete.

## Scope

The accepted wallet island signs and relays exactly one command type,
`external.prepare`. The accepted `HA-COMMAND-AUTHORITY-002` decision admits
`offering.create`, `directory.publish`, and `external.attachCandidate` under
the same EIP-712 domain and primary type, the accepted M38 Core parsers and
canonical-bytes builders exist for all three, and the S16 wizard renders four
deployment stages whose controls are disabled because no local code can build,
sign, or relay those commands. This card adds that missing bridge and nothing
else.

Add one pure browser module that turns the wizard's reviewed values, the
frozen S16 ATS_CREATE literal, an M44 candidate, and one frozen directory
record literal into the four `SignatureRequest` values the accepted signature
dialog already accepts; one client island that composes the accepted
`WalletIsland` and `SignatureDialog` per stage and maps each dialog result onto
the closed ten-kind S16 stage union; and one frozen local directory record
literal. Widen the accepted S15 command type check from one literal to the
closed four-member set the human decision admits, and let the S16 stage
control become enabled only when this bridge reports a signature request for
that stage.

The local contract is the
[UI-S21 campaign command bridge manifest](../../../ui/UI-S21.md). It composes
the accepted [UI-S15 wallet island](../../../ui/UI-S15.md) and the
[UI-S16 provider deploy wizard](../../../ui/UI-S16.md) manifests, serves the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md),
and closes the bridge gap the S16 corrective amendment recorded.

## Why this card exists now

The S16 corrective task review found that the four deployment commands could
not be truthfully signed by the one-type wallet surface and required a
separately scoped bridge before any signature. No card in the HI-002 batch
owns that bridge. Without it the campaign path has a wizard that cannot record
a draft offering, a backend that admits `offering.create` and
`directory.publish`, and no path between them. M40 is accepted, so the first
stage has a durable admission to reach as soon as M41 lands.

## Candidate ready requirements

- The manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The historical bridge source and tests were integrated at
  `48421352607a00c1a73f593dcc48160fac771e6a`; that integration is not
  acceptance evidence. The corrective scope below is limited to the named
  existing S21 paths and remains disjoint from M44's `ats-create-action.tsx`,
  S17's `components/provider/status/`, and S18's `components/backing/`.
- The S15 amendment is limited to replacing the single-type literal with the
  closed set `external.prepare`, `offering.create`, `directory.publish`,
  `external.attachCandidate`, the matching check in `signAndRelayCommand`,
  the focused assertions that name the single type, and one sentence in
  UI-S15. Domain, primary type, field order, nonce, timestamp, signature,
  body, and relay behavior are unchanged.
- The accepted S16 amendment is limited to: the stage
  control type gaining an enabled form whose activation opens the dialog for
  that stage; `providerDeployStageStates` accepting this session's reported
  results; the stages component rendering the enabled control; the wizard
  mounting the signing island on its review step; and the two focused tests
  asserting exactly that. Step order, copy, fixture, economics, the ten-kind
  union, the relay mapping, and the frozen ATS_CREATE literal are unchanged.
- The bridge owns no payload schema: each request is built by the accepted
  `@tool402/core` parser and canonical-bytes builder for its type, and
  `payloadHash` is computed by the accepted S15 builder over those bytes.
  `idempotencyKey` reuses the accepted S15 nonce grammar and generator, and
  `expiresAt` is one clock reading shared byte for byte between payload and
  command.
- Stage 4 needs `issuerRevenueAccount` and `clearingAccount` in its directory
  record. The accepted `HA-ISSUER-ACCOUNT-001` evidence records the issuer
  account; no accepted record carries a clearing account. Root decision
  `D-S21-010-001` fixes the safe local default: the literal leaves
  `clearingAccount` absent, the stage 4 builder refuses to produce a request,
  and stage 4 remains `unavailable` with its recorded reason. The bridge never
  invents one.

## Verification

- Durable test-only RED first: the bridge contract fails only for the absent
  new source paths and the stage tests fail only for the absent enabled
  control, with no incidental failure in the accepted S15 and S16 suites.
- Focused contracts assert each request type, the exact payload field sets
  through the accepted parsers, the shared `expiresAt`, the fresh idempotency
  key per request, refusal of a request for a stage whose predecessor is not
  `done`, the result-to-stage mapping, the declined-signature return to
  `actionable`, and that no stage reaches `done` from anything but a relayed
  `ACCEPTED`.
- Web typecheck, test, and lint, root quality, the equivalent Webpack
  production build, local browser evidence on desktop and mobile widths,
  queue, reference, and whitespace checks, the enabled guard, an independent
  task review, and two fresh clean module-review generations pass before
  acceptance.

## Boundary

This card signs nothing by itself, creates no offering, attempt, asset,
directory version, payment, or transaction, adds no dependency, environment
read outside the accepted relay route, storage, session, retry, or polling,
and renders no value a relay outcome did not return in this browser session.
A relayed `ACCEPTED` remains a backend admission, never an on-chain fact. The
first sub-step of stage 3 stays with M44, live ATS execution stays with
`HA-ATS-STAGE-B-001`, and the provider status route stays the only surface
that reports an offering state.

## Stage 4 control recommendation

Root decision `D-S21-010-001` adopts the safe local default: no accepted
record carries a clearing account, so the literal ships with `clearingAccount`
absent, the stage 4 builder refuses to produce a request for an incomplete
literal, and the stage 4 control stays `unavailable` with the reason "No
accepted clearing account is recorded." until a later human-owned record
supplies that account and a root amendment transcribes it. This keeps stages 1
through 3 deliverable now and invents nothing.

## Corrective local scope amendment

The historical S21 source remains unaccepted. Its focused baseline passed 64
tests, but independent review found that a blank or noncanonical
`qualifyingResource` could reach the signing island and throw during request
construction without linked feedback. It also found that the stage-four detail
was broader than the exact clearing-account reason adopted by
`D-S21-010-001`.

The corrective sequence is test-first against the existing source; it must not
delete historical files to manufacture source absence. A fresh test-only RED
review may amend only `apps/web/tests/provider-deploy-state.test.mjs`,
`apps/web/tests/provider-deploy-route.test.mjs`, and
`apps/web/tests/deploy-stage-signing.test.mjs`, with
`apps/web/tests/command-bridge.test.mjs` only if necessary to pin the existing
Core rejection. It must prove the linked field error, closed dialog/no-result
failure path, preserved Core rejection, and exact stage-four reason.

Only after an independent RED acceptance may the minimal GREEN correction touch
`apps/web/src/components/provider/deploy/provider-deploy-state.ts`,
`apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`, and
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`. It may add
no command, schema, canonicalizer, wallet/provider/SDK behavior, relay
semantics, configuration, durable write, transaction, deployment, or live
authority. The historical source and every excluded path remain unchanged.

## Human worktree lane request

- Requested at `2026-09-09T18:05:42Z` by the human operator (repository owner) through the
  operator's delegated session, under the explicit-request rule of the
  [runtime worktree policy](../../WORKTREE-POLICY.md). The card's tier,
  dependencies, declared paths, verification list, and boundary are unchanged.
- Worktree `.worktrees/s21`, branch `work/s21`, pushed to `origin/work/s21`.
  Implementer: the operator's delegated session. Reviewer: the root's
  independent task review and module review, unchanged.
- The lane delivers, in this commit order on that branch: the local
  implementation plan; one test-only RED commit adding exactly the two
  declared focused tests and the named assertion amendments in the accepted
  S15 and S16 focused tests, failing only because the three declared source
  paths and the enabled stage control are absent; and the minimal GREEN
  commits limited to the three declared source paths and the constrained S15
  and S16 amendments this card names. It adds no dependency and touches no
  package manifest or lockfile.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, or evidence file. The root keeps the ready review,
  the activation decision, the independent reviews, the integration decision,
  and every queue record. The branch is mirrored as a pull request for human
  visibility only; nothing from it reaches `main` outside the root's
  integration decision.
