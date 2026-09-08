# S17-T010 — Provider campaign status route

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M02-T020 accepted, M11-T020 accepted, M29-T010 accepted,
  M41-T010 (this batch), S16-T010 (this batch); S11-T010 (active at intake)
  must be accepted before this card's navigation amendment, because S11 holds
  the reserved integration pair over the same navigation file and test
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
  `apps/web/src/components/discovery/local-navigation.tsx` and to the two
  accepted tests that assert the exact navigation list,
  `apps/web/tests/workspace-shell.test.mjs` and
  `apps/web/tests/landing-explore.test.mjs`.
- Human actions: none for local delivery. Reading a real record additionally
  requires the `HA-CAMPAIGN-CONVEX-001` row requested by the
  [HI-002 intake card](HI-002-campaign-deploy-reinstatement.md); until those
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
  `apps/web/tests/workspace-shell.test.mjs`, and
  `apps/web/tests/landing-explore.test.mjs` belong to the accepted M11-T020
  card, so the single navigation entry needs an explicit root integration
  reservation recorded in the ownership file before the amendment. At intake,
  the active S11-T010 card already holds a reserved integration pair over
  `local-navigation.tsx` and `landing-explore.test.mjs` for its `/demo` entry;
  this card's amendment is sequenced after S11-T010 is accepted and applies to
  the navigation list as S11 leaves it. Both tests
  are named because both constrain the list today: one deep-equals the
  accepted entries and the other refuses any href outside the accepted set.
  The accepted `apps/web/tests/shell-accessibility.test.mjs` asserts only the
  navigation label and is not amended.
- The two closed outcome unions, the fixed region order, the next-action
  mapping, and the four evidence rows are fixed in the manifest before code, so
  no branch, row, or figure can be added while the slice is built.
- The route consumes the projections named by M41-T010 and links to the wizard
  route owned by S16-T010, so the root evaluates this card after both.

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
- The amended navigation list is asserted in both accepted navigation tests and
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
