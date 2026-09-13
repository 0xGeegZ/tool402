# HI-013 — Delivered lane records and active-queue reconciliation

## Purpose

Human intake card. Three delegated lanes are delivered and pushed as pull
requests #105, #103, and #114, three inbox cards still have no decision row,
and eleven `20-active` cards carry merged work on `main` that no ledger entry
records, so the root is holding every outstanding record at once with a day
and a half left before the submission deadline. This card supplies
ready-to-paste decision rows, ownership paragraphs, ledger rows, card moves,
and one recommended ruling for each open lane question so the root's
integration is transcription and review rather than re-derivation. It
authorizes no wallet, SDK, provider, transaction, deployment, or live action.
The one exception is ruling 6 and the matching S39 ownership paragraph below,
which extend S39's reservation to the module-scope `chipClass` helper and the
five presentation imports it implies, beyond the four blocks the UI-S39
manifest names as amendable; every other card's scope is unchanged.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-12
- Owner: root integrator on intake. Every decision row, ownership paragraph,
  ledger row, ruling, and card move below is root-recorded; nothing here is
  self-executing.
- Human actions: none.

## Observation

- Three delegated lanes are delivered, pushed, and open for the root as input
  only. S38-T010 is pull request #105 on `work/s38` at head `f5c07de6`;
  S39-T010 is pull request #103 on `work/s39` at head `d355a8bb`; S47-T010 is
  pull request #114 on `work/world-human-check` at head `b365f282`. Each pull
  request body states that the root integrates it and that it must not be
  merged by hand.
- S47-T010's card and specification exist only on `work/world-human-check`,
  at `docs/work-queue/queue/00-inbox/S47-T010-world-human-check.md` and
  `docs/specs/s47-world-human-check.md`. Neither path is tracked on `main`
  yet, so this card names them as plain paths rather than links. No
  `docs/ui/UI-S47.md` exists on any branch.
- `docs/ui/UI-S38.md` and `docs/ui/UI-S39.md` are tracked on `main`, but
  `docs/ui/IMPORT-LEDGER.md` carries no `UI-S38` or `UI-S39` row, and
  `docs/work-queue/FILE-OWNERSHIP.md` carries no S38-T010, S39-T010, or
  S47-T010 ownership paragraph. `docs/work-queue/TASK-CATALOG.md` already
  holds an S38-T010 row.
- HI-008, HI-009, and HI-012 are all `00-inbox` and none has a decision row.
  Their requested root records are each a small, fixed set of rows.
- Of the cards in `20-active`, none of M51-T010, M53-T010, M54-T010,
  M55-T010, M56-T010, S40-T010, S42-T010, S44-T010, S45-T010, S26-T010, or
  S36-T010 has a `STATE.md` or `DECISIONS.md` entry recording integration or
  acceptance of delivered work on `main`. The newest entry for each is an
  intake, readiness, activation, RED-acceptance, or refinement record. The
  one partial exception is M55-T010, where `D-M55-010-008` records Task 1
  integrated and then states in the same row that M55 stays `20-active`
  because Tasks 2 to 6 retain their overlap gates.
- Work matching several of those cards is nevertheless merged on `main`
  through pull requests #98, #100, #106, #107, #108, #110, #112, #113, and
  #115. The ledger therefore records activation and RED acceptance for this
  batch but no integration record for the merged result.
- Pull request #53 on `feat/world-selfie-check-reapply` is open and is the
  earlier World Selfie Check attempt. Pull request #114 replaces it with a
  dashboard-scoped slice that gates no publication.
- The secret-scan and README evidence the human owes for
  `HA-REPO-VISIBILITY-001` is prepared as a recommended packet at
  [the repository-visibility confirmation packet](../../evidence/HA-REPO-VISIBILITY-001-recommended-confirmation.md).
  It is a draft for the human to complete at the submitted commit and
  authorizes nothing.

## Requested sequence

1. Record the three missing inbox decision rows (HI-008, HI-009, HI-012) from
   the drafts below, so the sequencing and acceptance those cards carry stop
   being unrecorded input.
2. Rule on the eleven lane questions below, one ruling per question, and
   record them with the integration decision for each lane. The
   recommendations are conservative by design: where the alternative amends an
   accepted test or widens a card's declared paths, the recommendation is to
   accept what shipped and name a follow-up instead.
3. Record the three ownership paragraphs and the ledger rows before merging
   any lane, because each lane amends at least one shared accepted file whose
   integration reservation does not exist yet.
4. Reconcile the `20-active` queue from the card-move list below: on this
   card's evidence nothing moves to `60-done` and nothing moves to
   `90-cancelled`; every card in the batch is listed with the exact record
   that is missing.
5. Record pull request #53 as superseded by #114 and close it.

## Requested root records

### 1. Decision rows for the three inbox cards without one

Column order is the existing `DECISIONS.md` order: Decision ID, Status,
Authority/evidence, Local-card effect, UTC.

```
| D-HI-008-001 | SEQUENCE RECORDED | Human intake card HI-008 records the operator's GO on one working order before the Stage B rehearsal: M47-T010 acceptance, the HI-007 mirror-form ruling, B03-T020 GREEN, then ready review and activation of the delivered S25-T010, S23-T010, and S18-T010 lanes, then S22-T010 and S24-T010 after rehearsal evidence. The card supersedes no card scope and requests no human-action change. | Recorded as the root's working order for that batch; every step named in it is now either complete or superseded by a later delivered lane, so the row closes HI-008 as an input record rather than an open sequence. No card tier, dependency, path, boundary, or human-action row changes, and no wallet, SDK, provider, transaction, deployment, or live authority is granted. | 2026-09-12 |
| D-HI-009-001 | PHASE A ACCEPTANCE RECORDED | Human intake card HI-009 records the operator's acceptance, at 2026-09-10T19:15:51Z and in the packet's own words, of HA-ATS-M33-ENABLEMENT-001 as recorded in `docs/work-queue/evidence/HA-ATS-STAGE-B-001-recommended-decision-v2.md`. The acceptance covers only Phase A local source-only M33 ATS_CREATE enablement and supersedes only the earlier allocation of that static source mapping to HA-ATS-STAGE-B-001. | M48-T010 is created exactly as the packet describes, with one schema-versioned enabled fixed ATS_CREATE record byte-identical to the frozen M42 projection, and the deferred browser/provider transaction-execution successor is catalogued with M48-T010 acceptance as its gate. Every live, provider, wallet, authority-row, deployment, host, transaction, candidate, receipt-verifier, funding, and lifecycle action stays rejected; HA-ATS-STAGE-B-001 remains PENDING and is the only execution gate. | 2026-09-12 |
| D-HI-009-002 | TRIMMED LIVE STAGE B RULING | HI-009 item 3 asks the root to rule whether a live Stage B packet may be requested once M48-T010 and the transaction-execution successor are accepted, scoped to exactly one Factory `deployBond`, a terminal `SUBMITTED` attempt with the candidate attached and the offering at `ASSET_PENDING`, redacted transaction and Mirror Node finality evidence, no verification action invoked, and no lifecycle operation. The human's stated fallback is that the demo keeps its truthful pending gate and makes no Stage B claim. | Recommended ruling: a live Stage B packet may be requested, conditional on both M48-T010 and the transaction-execution successor being accepted first and on the rehearsal commit being named with a local host or runtime proof. If either acceptance does not land before the submission deadline, the human's own fallback applies without a further ruling: the demo keeps its truthful pending gate and makes no Stage B claim. The conditional form adds no gate and removes none; HA-ATS-STAGE-B-001 stays PENDING and remains the sole execution gate, and this row authorizes no wallet, provider, transaction, deployment, or live action. The ruling is the root's call. | 2026-09-12 |
| D-HI-012-001 | S18 LANE ORDER AND BACKER RULINGS | Human intake card HI-012 records the operator's GO on taking `work/backing` (pull request #41, head `18de36f`) as input for the S18-T010 ready review, and asks for the two rulings HI-002 deferred to S18 ready time: whether an enabled BACKER `commandAuthorities` row is provisioned so the HEDERA_FUNDING signature can pass the authority predicate, and whether M40 adds a `fundingTreasuryAccount` field as the route's `expectedTarget` or S18 stays parked. | S18-T010 is accepted at rebased source `164f170` with no continuing reservation, so this row records the lane order as satisfied and answers the two deferred rulings. If either ruling parks the backer path, it is recorded as parked with that reason; S18 is PRIZE_OPTIONAL and creates no transfer path without an `expectedTarget`. The row provisions no authority row, schema field, wallet action, transaction, deployment, or live behavior. | 2026-09-12 |
```

HI-009 item 4 leaves the position in the working order to the root. The
human's stated preference, and this card's recommendation, is after HI-008
step 3 and before its step 4; it remains the root's call.

### 2. Recommended rulings for the three delivered lanes

Each ruling is one recommendation with its basis. They are recommendations
only; the root records the ruling it makes.

**S38-T010, pull request #105, `work/s38`, head `f5c07de6`.**

1. The RiskScan href written as the JSX expression `href={"/explore/riskscan/back"}` rather than a quoted
   attribute, against the href pin in `apps/web/tests/riskscan-detail.test.mjs`:
   **accept with a named follow-up** that corrects the UI-S38 manifest prose to
   state the expression spelling and why the accepted lock is left untouched.
   Basis: the manifest's two claims cannot both hold, and correcting the prose
   changes no accepted test, while switching the source to the quoted attribute
   would require amending the accepted href list under a new reservation.
2. The `<aside>` newly created in
   `apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`:
   **accept with a named follow-up** that records the created complementary
   landmark in the integration reservation and checks the page carries no
   second one. Basis: the alternative placement wraps the accepted descriptive
   Card onto a second grid row, a real layout regression, so creating the
   landmark is the layout-preserving reading of "mount the card".

**S39-T010, pull request #103, `work/s39`, head `d355a8bb`.**

3. The second `WalletIsland` mount inside the Funding section while S26-T010
   is active and `apps/web/src/app/layout.tsx` already mounts one on every
   route: **needs re-ruling, not accepted here**. The route is reachable, not
   unreachable: `back/page.tsx` renders `<BackingFlow projection={projection}
   />` from a loaded `loadRiskScanBackingProjection`, and `projection={null}`
   appears only in the `Suspense` fallback while the projection loads. So in
   the loaded state the second `WalletIsland` sits alongside the shell header's
   island on every visit to the route, not only transiently. This card
   withdraws the "accept with a named follow-up owned by the header-island
   owner" recommendation and leaves the root to weigh accept-with-follow-up
   against requiring S39 to suppress or dedupe the second island itself before
   the previous recommendation's alternative (reserving `layout.tsx`, which
   widens the card) can be ruled out.
4. The relaxed back-page link scan in `apps/web/tests/backing-route.test.mjs`,
   where a blanket no-link assertion became exactly one `<Link`, exactly one
   `href=`, and that href pinned to `/explore/riskscan` with its label:
   **accept, with the relaxation named explicitly in the integration
   reservation**. Basis: the manifest mandates the link, so the original
   assertion could not survive verbatim, and the replacement is strictly
   tighter than what it replaced apart from that one mandated link.
5. The literals "Mirror Node records the transfer" and "allocation_pending",
   fixed verbatim by the manifest's Control contract and also named in its
   Explicit exclusions: **accept the shipped copy with a named follow-up** that
   corrects the exclusion text. Basis: the Control contract is the more
   specific rule and no source change is available, since widening the
   exclusion scan would turn the manifest's own mandated copy red.
6. The module-scope `chipClass(selected)` helper in `backing-flow.tsx`,
   outside the four blocks the manifest names as amendable: **accept under the
   integration reservation**. Basis: it is a presentation helper serving only
   the reserved units card, and the alternative duplicates the same class
   string in both chip labels.
7. The deleted accepted UI-S18 paragraph beginning "Connect MetaMask from the
   header": **accept with a named follow-up** that records the deletion in the
   UI-S18 ledger row so the accepted copy is not silently lost. Basis: the
   wallet control the slice mounts replaces the sentence and the focused test
   now pins its absence, so the record, not the source, is what is missing.

**S47-T010, pull request #114, `work/world-human-check`, head `b365f282`.**

8. Ownership and integration reservations: **accept exactly the Owner
   paragraph of the card on that branch**, reproduced as the ownership
   paragraph in section 3 below. Basis: the card already enumerates each new
   path and caps each amended path at one named change, so no re-derivation
   from the pull request file list is needed.
9. The dashboard session cookie read from the request header rather than
   through the framework's header accessor, gating both World routes:
   **accept**. Basis: without the gate the request route is an open
   RP-signature oracle and the verify route mints a thirty-day cookie for a
   caller who is not signed in, and reading the header keeps both routes
   loadable in the existing test harness while adding no authority.
10. Logout not clearing the `tool402-world-human` cookie: **accept with a
    named follow-up root card**. Basis: the clearing path lives in
    `apps/web/src/lib/dashboard-auth/dashboard-auth-routes.ts`, outside the
    lane's declared paths, and the cookie is address-bound and MAC-verified, so
    a different account on the same browser already reads it as unverified.
11. The strict `signal_hash` equality check: **accept as shipped**. Basis: it
    is a trust-boundary check that the task pinned, and loosening it to "absent
    or matching" is a security-relevant change that needs its own decision
    rather than a lane ruling.

The same pull request flags two further items for which it requests no ruling
and this card recommends none: the absent nonce and action binding, and the
cookie MAC secret derived from the World signing key by domain-separated
hashing. Both are the root's call.

### 3. Ownership paragraphs

To be appended to `docs/work-queue/FILE-OWNERSHIP.md` in its existing prose
style. Paths are taken from each pull request's own file list.

```
S38-T010 owns new `apps/web/src/components/backing/back-tool-card.tsx` and
new `apps/web/tests/back-tool-card.test.mjs`. Its root-only integration
reservation is limited to the aside block of
`apps/web/src/components/riskscan/detail/riskscan-detail.tsx` and the aside
block of `apps/web/src/components/entitycheck/detail/entitycheck-detail.tsx`,
where the reservation additionally covers the complementary landmark the
amendment creates around the existing accepted descriptive Card. Both call
sites supply no projection, so the card renders its no-offering variant and
adds no reachable link in this slice. It owns no route, reader, projection,
fetch, client behavior, state, capacity figure, wallet, provider, payment,
transaction, deployment, or live boundary, and it amends no accepted test.

S39-T010 owns new `apps/web/src/components/backing/backing-presentation.ts`,
new `apps/web/src/components/backing/backing-step-rail.tsx`, and new
`apps/web/tests/backing-presentation.test.mjs`. Its root-only integration
reservation is limited to the units, acknowledgement, funding, and
`payment_submitted` blocks of
`apps/web/src/components/backing/backing-flow.tsx` together with the
module-scope `chipClass` helper and the five presentation imports that block
implies, the single back link in
`apps/web/src/app/explore/riskscan/back/page.tsx`, and, in
`apps/web/tests/backing-route.test.mjs`, the source-path list, the required
literals, and the named replacement of the blanket no-link scan by exactly one
`<Link`, exactly one `href=`, and the pinned `/explore/riskscan` target with
its label. `apps/web/src/components/backing/backing-state.ts` is not amended:
the closed eight-kind union, picker bounds, integer amount, command payload,
transfer, and every refusal and unknown outcome remain the accepted UI-S18
contract. The reservation covers the wallet-island mount inside the Funding
section only as shipped; deduplication against the shell header island belongs
to the header-island owner, not to S39. It owns no projection, API, session,
authority, payment, settlement, transaction, deployment, or live boundary.

S47-T010 owns new `apps/web/src/lib/world/human-check.ts`, new
`apps/web/src/app/api/world/request/route.ts`, new
`apps/web/src/app/api/world/verify/route.ts`, new
`apps/web/src/components/dashboard/dashboard-identity.tsx`, new
`apps/web/src/components/dashboard/world-human-check.tsx`, new
`apps/web/tests/world-human-check.test.mjs`, new
`docs/specs/s47-world-human-check.md`, new
`docs/submission/world-selfie-check-feedback.md`, and new
`docs/work-queue/queue/00-inbox/S47-T010-world-human-check.md`. Its pull
request also amends the root-owned `docs/work-queue/TASK-CATALOG.md`, which
this ownership paragraph does not reserve; the root records that catalog
amendment on its own account rather than under an S47 reservation. Its
root-only integration reservations are limited to mounting
`<DashboardIdentity />` once in
`apps/web/src/app/dashboard/page.tsx` between the page header and
`<DashboardCampaign />`; adding only `@worldcoin/idkit` at one pinned version
to `apps/web/package.json` and the root `package-lock.json`; the matching
dependency literal in `apps/web/tests/static-shell.test.mjs`; and appending
the five `WORLD_*` names with empty values to `apps/web/.env.example`. Both
World routes read the signed dashboard session before acting and answer
`401` unless the session address equals the address in the body. The slice
unlocks nothing: every route, control, and command available before the check
remains exactly as available after it. It stores no proof, nullifier, or
World identifier, and it adds no command, relay, wallet, transaction, schema,
Convex, authority, role, allowlist, payment, or account behavior. Clearing the
human cookie on logout lives in
`apps/web/src/lib/dashboard-auth/dashboard-auth-routes.ts` and stays outside
this card.
```

### 4. UI slice ledger rows

To be appended to `docs/ui/IMPORT-LEDGER.md`, whose columns are Slice, Local
status, Local target boundary, Explicit exclusions.

```
| UI-S38 | Back this tool entry card intake | One new server-rendered backer entry card rendered from a projection its page hands it, mounted as the first aside child of both accepted tool detail pages, with a no-offering variant when no OPEN offering is supplied | Fetch, client behavior, state, capacity or progress figures, price, wallet/provider/session surfaces, payment, settlement, receipt, evidence, route changes, amended accepted tests, external links, live claims, and full-tree import |
| UI-S39 | Backer amount presets and funding rail intake | Presentation over the accepted UI-S18 state module only: preset amount chips derived from the offering terms, the HBAR readout as the primary figure, a four-step rail over the accepted view kinds, the wallet control folded into the Funding section, and one back link to the accepted RiskScan detail route | Changes to the accepted closed state module, picker bounds, command payload or transfer, new outcomes, projection fetch, allocation/capacity/progress claims, payment/settlement/verification claims, environment reads, a second wallet session of its own, dependencies, external links, and full-tree import |
```

No `docs/ui/UI-S47.md` exists, and every row in this ledger so far is
manifest-backed. The root therefore decides whether S47 receives a row at all
or is recorded as specification-backed only through its card and
`docs/specs/s47-world-human-check.md`. If the root does add a row, the
recommended text is:

```
| UI-S47 | World human check intake; specification-backed, no UI manifest | One server-rendered identity card on the signed dashboard with three states, one client widget mounted only in the unverified state, and the two World routes behind it; a success sets one MACed, address-bound, HttpOnly cookie and nothing else | Stored proofs, nullifiers, or World identifiers, unique-human or identity-verified or KYC claims, any unlocked route/control/command, new command/relay/wallet/transaction/schema/authority/role/allowlist/payment/account behavior, live World acceptance claims, and full-tree import |
```

### 5. Card moves

Nothing on this card's evidence moves to `60-done`, and nothing moves to
`90-cancelled`. The ledger records intake, readiness, activation, RED
acceptance, and refinements for this batch, but no `STATE.md` or
`DECISIONS.md` entry records integration or acceptance of the merged result
for any of the cards below, so the acceptance is the root's to make rather
than this card's to assert. Two cards were tested against a supersession
reading and neither holds: both S26-T010 and S36-T010 turn out to be delivered
and unrecorded, which is an acceptance question, not a supersession one.

Root to confirm, with what is missing named for each:

- **S26-T010.** Its only `STATE.md` entry,
  `S26_ROOT_INTEGRATION_ACTIVATION`, records the activation and states that
  final acceptance still requires the card's declared browser evidence and an
  independent review; no such record exists. Meanwhile its declared scope has
  landed elsewhere: the shared session and its focused contract are on `main`
  at `apps/web/src/components/wallet/wallet-session.tsx` and
  `apps/web/tests/wallet-session.test.mjs`, the shell header mounts the island
  inside the session provider at `apps/web/src/app/layout.tsx`, merged pull
  request #112 re-did the header control and amended `layout.tsx`,
  `wallet-connect.tsx`, and the wallet-session contracts, merged pull request
  #113 carries the dashboard surface the connected-badge navigation points at.
  The scoped ownership transfer recorded at the top of
  `docs/work-queue/FILE-OWNERSHIP.md` transfers only `BackingForm`'s
  `useWalletSession`/`connectedWalletSession` composition and the
  `section[aria-labelledby="backing-status"]` composition, and expressly bars
  M56 from adding `WalletIsland`; on `main`, `backing-flow.tsx` has
  `useWalletSession` at line 55 and no `WalletIsland`. S26's own card
  (`docs/work-queue/queue/20-active/S26-T010-header-wallet-session.md`) makes
  the `backing-flow.tsx` island mount conditional on S18-T010 acceptance, and
  S18-T010 is `60-done`; that mount currently exists only in unmerged pull
  request #103 (S39-T010). So S26's declared backing-flow island mount is
  unimplemented on `main` and untransferred, not delivered elsewhere.
  Provenance matters for the reading, though:
  `wallet-session.tsx` was created by `3c90da74`, "feat(web): share one
  MetaMask session from the shell header", which is S26's own lane merged
  under `S26_ROOT_INTEGRATION_ACTIVATION`, and pull request #112 amended that
  shipped delivery rather than replacing it. So S26 is delivered and
  unrecorded on the same footing as S36 below. Missing: the card's declared
  browser evidence plus an independent review at a named head, recorded as an
  acceptance. If the root instead judges that #112 and the M56 transfer
  replaced the delivery, a supersession ruling and a move to `90-cancelled` is
  the alternative; that choice is the root's, and this card recommends the
  acceptance path because the delivery is S26's own.

- **M51-T010.** Newest record is `D-M51-010-006`, PUBLIC ADAPTER RED ACCEPTED
  AND GREEN AUTHORIZED, which authorizes only
  `packages/backend/convex/command_dispatch.ts` and its exact test for a
  minimal closed parser extension. Missing: the GREEN review for that scoped
  adapter change, plus the earlier `D-M51-010-003` through `D-M51-010-005`
  Backend/Web paths' own GREEN reviews, and an integration or acceptance
  record at a named head.
- **M53-T010.** Newest record is
  `M53_STAGE_B_FACTORY_RECEIPT_LOG_SELECTION_ACTIVATION`, which activates only
  the bridge/test pair for the minimal decoder correction. Missing: a GREEN
  result and its acceptance record.
- **M54-T010.** Newest record is `M54_STAGE_3_CANDIDATE_RECOVERY_ACTIVE`,
  which records the correction as active and lists the co-ownership around it.
  Missing: RED acceptance, GREEN, and an acceptance record.
- **M55-T010.** `D-M55-010-008` records Task 1 integrated and, in the same
  row, that M55 stays `20-active` because Tasks 2 to 6 retain their
  active-owner overlap gates; `D-M55-010-009` then authorizes Tasks 2 to 6
  serially. Missing: the per-task GREEN and joint compatibility review records
  for Tasks 2 to 6, and a final acceptance record.
- **M56-T010.** Newest record is
  `M56_RISKSCAN_BACKING_DEMO_MVP_RED_ACCEPTANCE` at `27b0d762`, which permits
  minimal GREEN only. Merged pull request #107 carries the GREEN. Missing: the
  GREEN review and integration record. The M56-S26 ownership transfer's own
  condition — that canonical `main` carry M56's card, specification, and
  catalog row — is already satisfied at `ce080a16`: M56's card and
  specification are tracked at
  `docs/work-queue/queue/20-active/M56-T010-riskscan-backing-demo-mvp.md` and
  `docs/specs/m56-riskscan-backing-demo-mvp.md`, and its catalog row was
  committed by merged pull request #107. The root should record the transfer
  as already in effect rather than pending activation; `FILE-OWNERSHIP.md`
  still carries the conditional wording and needs the root to update it to
  say so.
- **S40-T010.** Newest record is `S40_ACTIVE_ACCOUNT_BINDING_REFINEMENT`, a
  directed repair inside the existing synchronizer, test, and authenticated
  navigation mount; merged pull request #110 carries that binding work.
  Missing: the repair's RED/GREEN records and an acceptance record. S40
  acceptance is also the stated activation gate for S41-T010 and for S47-T010,
  so it is the highest-leverage acceptance in this list.
- **S42-T010.** Newest records are `S42_DYNAMIC_DASHBOARD_AMENDMENT` and
  `S42_EMPTY_CAMPAIGN_AMENDMENT`, both directions rather than results; merged
  pull request #113 carries dashboard campaign work. Missing: the amendments'
  RED/GREEN records and an acceptance record.
- **S44-T010.** Newest record is `S44_TECHNICAL_RECORD_CONTROL`, an owner
  request reserving the technical-record control; merged pull requests #98 and
  #115 carry the command-center and provider polish work. Missing: the GREEN
  and acceptance records for the reconciled contract.
- **S45-T010.** Newest record is `S45_DASHBOARD_LOADING_REFINEMENT`, which
  requires the specification, manifest, ledger, card, and focused loading
  contracts to be amended before RED; merged pull request #108 carries the
  mascot surfaces. Missing: that amendment, the refinement's RED/GREEN, and an
  acceptance record.
- **S36-T010.** The supersession reading this card was asked to test does not
  hold, and the observation is recorded here rather than acted on. S36's
  declared contract is live on `main`: the handoff region is at
  `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx:246` and
  its focused contract is at
  `apps/web/tests/provider-deploy-signature-handoff.test.mjs`, and the later
  provider work amended the same component around it rather than replacing the
  region. So S36 is delivered and unrecorded, not moot. Newest record is
  `D-S36-010-002`, RED accepted and GREEN authorized. Missing: an acceptance
  record at a named head.

B04-T010 is deliberately untouched by this card.

### 6. Pull request #53

Record that pull request #53 on `feat/world-selfie-check-reapply`, which gated
directory publication behind a World Selfie Check, is superseded by pull
request #114, whose slice is dashboard-scoped and gates no publication, and
close #53. The human closes it once the root has recorded the supersession;
this card closes nothing by itself.

## Explicit non-authorizations

This card authorizes no wallet, provider, SDK, signature, `commandAuthorities`
row, schema change, configuration bridge, durable attempt, transaction,
deployment, publication, submission, or live behavior. It does not move any
card between queue states by itself, does not edit any root-owned ledger, and
does not merge, rebase, or close any pull request. The recommended rulings and
records above are input for the root's own review; none of them is authority
until the root records it.

## Human ruling

The human operator ruled GO on the requested sequence at the time this card
was merged, through the operator's delegated session. The root records the
decision rows, rulings, ownership paragraphs, ledger rows, card moves, and the
pull request #53 supersession from this card, and keeps every review and
integration decision.
