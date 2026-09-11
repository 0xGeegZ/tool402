# HI-012 — S18 delegated lane intake and backer authority rulings

## Purpose

Human intake card. Of the three delegated lanes HI-008 listed, two are now
superseded by root-owned deliveries on `main`, and only the S18-T010 backer
funding lane remains unrecorded. This card asks the root to take that lane
as input for S18's ready review next, and to make the two rulings HI-002
deferred to S18 ready time so the lane either advances or is parked with a
stated reason. It authorizes no wallet, SDK, provider, transaction,
deployment, or live action and changes no card's scope.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-11
- Owner: root integrator on intake. The decision row is root-recorded.
- Human actions: none.

## Observation

- S25-T010 is `60-done` on `main`; the root took the `work/page-header` lane
  as input and landed its own commits. S23-T010 is `60-done` on `main`; the
  root recorded `work/entitycheck` as stale and not authority. The human
  closes pull requests #40 and #27 as superseded; neither branch is input any
  longer.
- S18-T010 is still `00-inbox`. Its card carries the human worktree lane
  request of 2026-09-10T14:30:00Z. The lane branch `work/backing` (PR #41,
  head `18de36f`) holds the test-only RED commit `dacfef0` followed by the
  GREEN commits `b02bb18`, `d7cc094`, and `18de36f`, all confined to the
  five declared new paths. STATE.md does not mention S18 or the lane.
- The lane's pre-integration preflight on `b6b11cb` recorded a clean merge,
  clean typecheck, lint, queue check, and whitespace, and Web `299/299`. A
  three-way merge of `work/backing` onto current `main` (`5961a6e`) is still
  conflict-free.
- HI-002 deferred two decisions to S18 ready time: whether an enabled
  `BACKER` `commandAuthorities` row is provisioned so the `HEDERA_FUNDING`
  signature can pass the authority predicate, and whether M40 adds a
  `fundingTreasuryAccount` field as the route's `expectedTarget` or S18
  stays parked. Neither ruling is recorded.
- HI-008 is `00-inbox` without a decision row. Its item 4 is now two-thirds
  satisfied by the S25 and S23 deliveries above.

## Requested sequence

1. Ready review of S18-T010 with `work/backing` as input, after the HI-011
   packet is presented and before S26-T010 and S27-T010. The root keeps the
   ready review, the activation decision, the independent RED and GREEN
   reviews, and the integration decision; the lane is input, not authority.
2. The two HI-002 rulings above, recorded together with item 1. If either
   ruling parks S18, record it as parked with that reason so the lane closes
   cleanly; S18 is `PRIZE_OPTIONAL` and creates no transfer path without an
   `expectedTarget`.
3. If S18 advances, the root's independent review of the delivered RED and
   GREEN commits on the lane branch in place of a fresh RED cycle, unless the
   review finds the delivered contract insufficient.

## Requested root records

1. One decision row recording items 1 and 2; item 3 follows from the
   existing lane request and needs no row of its own.
2. No change to any human-action row.

## Explicit non-authorizations

This card authorizes no `commandAuthorities` row, schema change, wallet or
provider interaction, transaction, deployment, or live behavior. It does not
move any card between queue states by itself and does not merge, rebase, or
close any pull request.

## Human ruling

The human operator ruled GO on the requested sequence at the time this card
was merged, through the operator's delegated session. The root records the
decision row from this card.
