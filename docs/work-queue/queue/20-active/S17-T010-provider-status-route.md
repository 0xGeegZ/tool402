# S17-T010 — Provider campaign status route

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M02-T020 accepted, M11-T020 accepted, M29-T010 accepted,
  M41-T010 accepted, S16-T010 accepted, and S11-T010 accepted. S11's
  accepted navigation assertions remain a constrained root integration
  boundary for this card.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly `apps/web/src/app/provider/page.tsx`,
  `apps/web/src/lib/offering-projection.ts`,
  `apps/web/src/app/api/offerings/route.ts`,
  `apps/web/src/components/provider/status/provider-status.tsx`,
  `apps/web/src/components/provider/status/provider-status-state.ts`,
  `apps/web/tests/provider-status.test.mjs`, and
  `apps/web/tests/offerings-api.test.mjs`, plus one navigation entry added as an
  amendment under a root integration reservation to
  `apps/web/src/components/discovery/local-navigation.tsx` and to the three
  accepted tests that freeze the exact navigation list,
  `apps/web/tests/workspace-shell.test.mjs`,
  `apps/web/tests/landing-explore.test.mjs`, and
  `apps/web/tests/guided-demo-route.test.mjs`.
- Human actions: none for local delivery. Reading a real record additionally
  requires the `HA-CAMPAIGN-CONVEX-001` row requested by the
  [HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md); until those
  environment values exist the route renders its explicit not-configured
  outcome and no request leaves the web host.

## Scope

The batch adds surfaces that sign commands and admit them durably, but no
accepted surface reads an offering or a directory version back. A provider who
has signed `offering.create` has no way to see what was stored, what state the
offering is in, or what remains to be done.

Add one server-rendered `/provider` route, one server-only reader for the two
accepted read-only projections, one browser-facing route that exposes the same
outcomes, one closed presentation state module, and one navigation entry. The
route renders a state ribbon, a next action derived from the offering state
alone, a four-row deployment evidence table, the active terms, the active
directory version, and the signer of the admitted command. It writes nothing,
signs nothing, and advances no state.

The approved shape is the now half of the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).
The field list the route may render is fixed by the accepted
[M40 durable admission contract](../../../specs/m40-offering-directory-durable-admission.md).
The local contract is the
[UI-S17 provider campaign status manifest](../../../ui/UI-S17.md), and the
accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The five source paths and two focused test paths are new files, disjoint from
  every accepted card's owned paths and from every sibling card in this batch.
  The sibling wizard card owns `apps/web/src/app/provider/deploy/` and the
  `provider/deploy` component directory; this card owns neither.
- `apps/web/src/components/discovery/local-navigation.tsx`,
  `apps/web/tests/workspace-shell.test.mjs`,
  `apps/web/tests/landing-explore.test.mjs`, and
  `apps/web/tests/guided-demo-route.test.mjs` belong to accepted M11-T020 or
  S11-T010 records, so the single navigation entry needs an explicit root
  integration reservation recorded in the ownership file before the
  amendment. The constrained guided-demo amendment may update only its exact
  navigation-list expectation; it preserves all nine demo steps, route links,
  and other S11 assertions. The other two tests remain named because one
  deep-equals the accepted entries and the other refuses any href outside the
  accepted set.
  The accepted `apps/web/tests/shell-accessibility.test.mjs` asserts only the
  navigation label and is not amended.
- The two closed outcome unions, the fixed region order, the next-action
  mapping, and the four evidence rows are fixed in the manifest before code, so
  no branch, row, or figure can be added while the slice is built.
- The route consumes the projections named by M41-T010 and links to the wizard
  route owned by S16-T010, so the root evaluates this card after both.

## Ready record

Ready at 2026-09-10T06:08:28Z after independent review at clean pushed
`13114343abf05043071cba80d3eefcfe3e2615aa`. The card, UI-S17 manifest, ledger,
catalog, ownership, State, and decision resolve locally; M41-T010, S16-T010,
and S11-T010 are accepted. The seven future source/test paths are absent and
disjoint. The root reservation allows only the `/provider` navigation entry and
the exact-list amendments in the three named navigation tests; the guided-demo
test retains all nine steps and its non-navigation behavior. Node 22.21.1
focused navigation/a11y checks and Web/root typechecks are clear. A separate
activation may authorize only the durable test-only RED contract; no source,
environment read, live request, command, write, wallet/provider, payment,
transaction, deployment, or other external capability is authorized.

## Activation record

Activated at 2026-09-10T06:32:00Z after an independent activation review at
clean pushed `2252545e4ea1183c45ea45ba8423ff05a8d5e412`. Every declared
predecessor remains accepted, the ready authority remains intact, and no
active-path collision exists. The authorized RED scope is limited to new
`apps/web/tests/provider-status.test.mjs` and
`apps/web/tests/offerings-api.test.mjs`, plus the frozen navigation-list
assertion amendments in `apps/web/tests/workspace-shell.test.mjs`,
`apps/web/tests/landing-explore.test.mjs`, and
`apps/web/tests/guided-demo-route.test.mjs`. Every source path, the navigation
source, `apps/web/tests/shell-accessibility.test.mjs`, environment read, and
external behavior remain prohibited pending fresh independent RED acceptance.

## RED acceptance record

Accepted at 2026-09-10T06:59:35Z after independent review of the durable
contracts at the clean pushed baseline
`133901baa3b1cfa066c924fc0c708999e88a7f11`. Under Node 22.21.1, the focused
combined check has only the two absent S17 source-boundary failures and the
three absent `/provider` navigation-entry failures; all source-dependent
assertions skip until their paths exist. The review is clear. Only the five
declared source paths and the root-reserved `/provider` navigation entry are
now authorized for minimal local GREEN. `shell-accessibility.test.mjs` remains
unchanged. No client state, timer, command, write, environment read outside
the declared reader/route boundary, live request, wallet/provider, payment,
transaction, deployment, or live behavior is authorized.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because the declared page, reader, route, component, and state paths do not
  exist.
- Focused tests prove the two closed outcome unions, that the offering outcome
  and the directory outcome are independent, and that a failed directory read
  leaves the offering result unchanged.
- Focused tests prove the not-configured outcome with `TOOL402_CONVEX_SITE_URL`
  absent, that no request is attempted in that outcome, that
  `offeringPublicId` is validated against the accepted public-id grammar before
  it enters a URL, that each read is bounded by a timeout and a maximum
  response size, and that an unparsable response yields the unexpected-response
  outcome rather than a partly rendered record.
- Focused tests prove `/api/offerings` returns both outcomes under `no-store`,
  rejects an invalid `offeringPublicId`, and discloses no reason detail,
  upstream status, or upstream error text, and logs no body, header, or URL.
- Focused tests prove the fixed region order, the exact next-action mapping
  including the closed state that renders no control, the four evidence rows
  with their explicit `not recorded` cells, and that the Hashscan link renders
  only for a recorded asset address in a state the accepted receipt
  verification boundary reaches.
- Focused tests prove that none of the non-adopted canvas figures appears:
  no funding-raised, units-issued, paid-task, or balance figure, no liveness or
  connection badge, and no second offering version.
- The amended navigation list is asserted in all three accepted navigation tests and
  the accepted shell accessibility suite passes unchanged.
- `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Browser evidence is limited to what an unconfigured host can produce: the
  not-configured route, the navigation entry, visible keyboard focus, and no
  horizontal overflow at narrow widths. No loaded-record, verified-receipt, or
  live-deployment browser claim is made by this card.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card reads two projections and renders them. It admits no command, writes
no record, resolves no authority, reads no Mirror Node or chain data, and never
turns an absent or failed read into a rendered value. Its exclusions are the
manifest's truthfulness and authority boundary, which governs; this card does
not restate them.

## Human worktree lane request

- Requested at `2026-09-09T21:00:31Z` by the human operator (repository owner) through the
  operator's delegated session, under the explicit-request rule of the
  [runtime worktree policy](../../WORKTREE-POLICY.md). The card's tier,
  dependencies, declared paths, verification list, and boundary are unchanged.
  M41-T010 and S16-T010 are now accepted and S11-T010 is done, so every
  dependency this card names is satisfied.
- The historical `work/s17` branch is stale and unreviewed relative to the
  current root control plane. It is not implementation evidence and must not
  be integrated. Any later lane starts from the ready current main head with
  the corrected four-file navigation reservation. Implementer: the operator's
  delegated session. Reviewer: the root's independent task review and module
  review, unchanged.
- The lane delivers, in this commit order: one test-only RED commit adding
  exactly the two declared focused tests and the navigation-list assertion
  amendments in the three accepted tests, failing only because the five
  declared source paths and the navigation entry are absent; then the minimal
  GREEN commits limited to the five declared source paths and the one
  navigation entry. It adds no dependency and touches no package manifest or
  lockfile.
- The lane changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, or evidence file. The root keeps the ready review,
  the activation decision, the independent reviews, the integration decision,
  and every queue record. The branch is mirrored as a pull request for human
  visibility only; nothing from it reaches `main` outside the root's
  integration decision.
