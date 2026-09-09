# S16-T010 — Provider deploy wizard

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M02-T020 accepted, M11-T020 accepted, M20-T010 accepted,
  M29-T010 accepted, M38-T010 (this batch), S15-T010 (this batch)
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly `apps/web/src/app/provider/deploy/page.tsx`,
  `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`,
  `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`,
  `apps/web/src/components/provider/deploy/provider-deploy-state.ts`,
  `apps/web/src/components/provider/deploy/campaign-fixture.ts`,
  `apps/web/src/components/provider/deploy/ats-create-configuration.ts`,
  `apps/web/tests/provider-deploy-state.test.mjs`, and
  `apps/web/tests/provider-deploy-route.test.mjs`. All eight are new files;
  this card amends no accepted file and needs no integration reservation.
- Human actions: none for local delivery. The wizard assembles a payload and
  offers a signature; with no reachable backend the relay it calls answers with
  its explicit not-configured outcome and every stage reads as unavailable.
  Recording a signed command additionally requires the
  `HA-CAMPAIGN-CONVEX-001` row, the first and fourth stages additionally
  require the `HA-COMMAND-AUTHORITY-002` row, the second stage additionally
  requires the `HA-ATS-RETARGET-001` row, and the third stage additionally
  requires the `HA-ATS-STAGE-B-001` row, all requested by the
  [HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md).

## Scope

The accepted repository has no provider-facing surface. Nothing lets a tool
provider assemble an offering, read the fixed revenue-note terms, or authorize
the four steps that would deploy it, and the sibling wallet island can produce
a signature but owns no payload and no screen to place one on.

Add one route at `/provider/deploy`: a five-step wizard over one labelled
`PREPARED / DEMO DATA` fixture, and a review step naming the four deployment
stages with a per-stage signature control. The wizard holds step and field
state and renders outcomes. It owns no wallet, provider selection, chain gate,
command builder, signature dialog, relay, or canonicalizer, holds no
configuration value outside one frozen ATS_CREATE configuration literal, and it
writes nothing durable.

The approved shape is the now half of the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).
The local contract is the
[UI-S16 provider deploy wizard manifest](../../../ui/UI-S16.md), and the
accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md). The economics it renders
read-only are the accepted
[M20 offering definition schema](../../../specs/m20-offering-definition-schema.md)
terms; the payload bounds it enforces before signing are the sibling
[M38 command payload contract](../../../specs/m38-offering-command-payloads.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The six source paths and two focused test paths are new files under one new
  route directory and one new component directory, disjoint from every accepted
  card's owned paths and from every sibling card in this batch. The sibling ATS
  SDK seam card adds its own action file under the same component directory and
  names it itself, so the two remain disjoint.
- The sibling wallet island and the sibling command payload contract are
  in-batch predecessors: this card imports their exported surfaces and defines
  neither. It is ready only once both are accepted.
- The five steps and their exact field sets, the closed category selection, the
  closed ten-kind stage union, and the relay outcome mapping are fixed in the
  manifest before code, so no step, field, or stage kind can be added while the
  slice is implemented.
- The card owns exactly one configuration file,
  `apps/web/src/components/provider/deploy/ats-create-configuration.ts`: the
  frozen ATS_CREATE configuration literal transcribed from the sibling retarget
  card's values — `network`, `chainId`, `subjectPublicId`, `offeringVersion`,
  `registryRevision`, `operationKind`, `targetKind`, `expectedTarget`,
  `canonicalParametersHash`, `factoryHederaId`, and `resolverHederaId`. The
  wizard receives the revenue-note parameters, the expected target, and
  `canonicalParametersHash` as one injected projection and with it absent the
  affected rows and stages read as not configured. No other source path in this
  card carries an address, registry revision, or digest, and no value is
  invented here.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because the declared route, wizard, stage, state, fixture, and configuration
  paths do not exist.
- Focused tests prove the five steps in order, their exact field sets, the
  closed category selection, the step caption, the disabled back control on the
  first step, and the forward control on step 4 staying disabled until the
  acknowledgement is checked.
- Focused tests prove the terms v1 economics are read-only under every state
  path, that no control or state transition can change them, and that the
  acknowledgement copy is rendered verbatim.
- Focused tests prove the HBAR-to-tinybar conversion at `10^8`, the refusal in
  the browser of any advertised price outside the accepted 1 through
  10,000,000 tinybar bound, and the refusal, never truncation, of any narrative
  field outside its byte or item bound.
- Focused tests prove the closed ten-kind stage union including the
  transport-only `unsupported_type` arm, the relay outcome mapping onto it and
  onto nothing else, the rejected-stage copy that states the server gave no
  reason and asserts no cause, the predecessor ordering of the four stages, the
  two sub-steps of the third stage whose second one signs
  `external.attachCandidate` with the candidate the sibling ATS SDK action
  returned, the return to an actionable stage after a declined signature with
  the statement that nothing was recorded, and the absence of any automatic
  retry.
- A focused test asserts the frozen ATS_CREATE configuration literal field for
  field against the sibling retarget specification, `canonicalParametersHash`
  included, and fails on any drift.
- Focused tests prove that with no configuration projection the revenue-note
  parameter rows and the second and third stages read as not configured, and
  that no address, identifier, or digest is rendered in that condition.
- A focused route contract proves the route renders the labelled fixture with
  no fetch, storage, configuration, or environment read on load or on any step
  change, and renders none of the design canvas's sample attempt ids,
  transaction ids, account ids, asset addresses, or elided digests.
- `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Browser evidence is limited to what a machine without MetaMask and without a
  reachable backend can produce: step navigation, the disabled forward control,
  keyboard focus order, the polite live region on stage outcomes, the
  unavailable stage readings, and no horizontal overflow at narrow widths. No
  connected-wallet, signed-command, or backend-accepted browser claim is made
  by this card.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## RED acceptance

At pushed `8bac790`, the independent [RED review](../../evidence/S16-T010-red-review.md)
confirmed that the focused Node 22.21.1 command fails exactly twice only for
the six declared absent source paths and skips its nine GREEN assertions. The
review closes the local candidate handoff, absent-projection, and direct
wallet/provider/SDK/relay capability boundaries.

Only these source paths are now authorized for the minimal GREEN cycle:

```text
apps/web/src/app/provider/deploy/page.tsx
apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx
apps/web/src/components/provider/deploy/provider-deploy-stages.tsx
apps/web/src/components/provider/deploy/provider-deploy-state.ts
apps/web/src/components/provider/deploy/campaign-fixture.ts
apps/web/src/components/provider/deploy/ats-create-configuration.ts
```

## Boundary

This card renders a draft and offers a signature. It advances no offering,
attempt, asset, or directory state of its own, treats no wallet callback as
success, and shows only outcomes a relay reported in the current browser
session. Its exclusions are the manifest's truthfulness and authority
boundary, which governs; this card does not restate them.
